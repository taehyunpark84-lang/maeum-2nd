"""생각방 DB/API/AI 경계 검증. 실제 유료 모델을 호출하지 않습니다."""
import asyncio
import json
import threading
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
import pytest
from pydantic import ValidationError
from sqlalchemy import select
from test_flow import client
from test_shared_history import person
from app.main import app
from app.security import current_user
from app.db import Db, User, DiscussionSession, DiscussionMessage, uid
from app import ai, discussion_ai
from app import discussions


def prepare(topic='지금 중소기업에 취업할지 대기업을 더 준비할지 고민이에요.', request_id=None):
    response = client.post('/discussions/prepare', json={'topic':topic, 'request_id':request_id or uid()})
    assert response.status_code == 200, response.text
    return response.json()


def start(topic='지금 중소기업에 취업할지 대기업을 더 준비할지 고민이에요.'):
    draft = prepare(topic)
    response = client.post(f"/discussions/{draft['id']}/confirm")
    assert response.status_code == 200
    return response.json()


def answer(session, request_id=None):
    return client.post(f"/discussions/{session['id']}/reply", json={
        'request_id':request_id or uid(), 'expected_revision':session['revision']})


def test_draft_confirm_turns_and_new_topic_preserve_records(person):
    assert client.get('/discussions/current').json() is None
    draft = prepare()
    assert draft['state'] == 'draft' and draft['revision'] == 0
    assert [bot['id'] for bot in draft['bots']] == ['blue', 'amber', 'violet']
    assert len({bot['name'] for bot in draft['bots']}) == 3
    assert client.get('/discussions/current').json() is None
    assert answer(draft).status_code == 409
    session = client.post(f"/discussions/{draft['id']}/confirm").json()
    for index, expected in enumerate(('blue', 'amber', 'violet')):
        response = answer(session)
        assert response.status_code == 200, response.text
        session = response.json()
        assert len(session['messages']) == index + 1
        assert session['messages'][-1]['speaker'] == expected
        assert session['messages'][-1]['turn'] == 1
        assert session['next_speaker_index'] == (index + 1) % 3
    assert session['completed_turns'] == 1
    # 대기/재조회는 추가 발언을 생성하지 않습니다.
    assert client.get('/discussions/current').json() == session
    proposal = prepare('친구에게 서운한 마음을 어떻게 전할까?')
    assert client.get('/discussions/current').json() == session  # 새 고민 취소 시 그대로 유지
    assert proposal['bots'][0]['name'] != session['bots'][0]['name']
    next_session = client.post(f"/discussions/{proposal['id']}/confirm").json()
    assert client.post(f"/discussions/{proposal['id']}/confirm").json() == next_session
    previous = client.get(f"/discussions/{session['id']}").json()
    assert previous['state'] == 'ended' and previous['messages'] == session['messages']
    assert answer(previous).status_code == 409
    assert client.get('/discussions/current').json()['id'] == proposal['id']


def test_prepare_and_message_idempotency_and_validation(person):
    request_id = uid()
    first = prepare(request_id=request_id)
    assert prepare(request_id=request_id) == first
    assert client.post('/discussions/prepare', json={'topic':'다른 내용', 'request_id':request_id}).status_code == 409
    for topic in ('   ', 'x' * 3001):
        assert client.post('/discussions/prepare', json={'topic':topic, 'request_id':uid()}).status_code == 422
    session = client.post(f"/discussions/{first['id']}/confirm").json()
    body = {'request_id':uid(), 'text':'현실성에 더 비중을 두고 싶어요.'}
    endpoint = f"/discussions/{session['id']}/messages"
    first = client.post(endpoint, json=body).json()
    assert client.post(endpoint, json=body).json() == first
    assert first['revision'] == session['revision'] + 1
    assert first['next_speaker_index'] == 0
    assert client.post(endpoint, json={**body, 'text':'변경된 문장'}).status_code == 409
    assert client.post(endpoint, json={'request_id':uid(), 'text':'  '}).status_code == 422
    reply_id = uid()
    second = answer(first, reply_id).json()
    assert answer(first, reply_id).json() == second  # 응답 유실 후 동일 요청은 중복 생성하지 않음
    assert body['text'] in second['messages'][-1]['text']
    assert answer(first).status_code == 409
    assert answer(second, body['request_id']).status_code == 409
    assert client.post(endpoint, json={'request_id':reply_id, 'text':'잘못된 재사용'}).status_code == 409


def test_history_setting_default_and_account_ownership(person):
    session = start()
    assert client.get('/discussions/settings').json() == {'show_history':False}
    assert client.patch('/discussions/settings', json={'show_history':True}).json() == {'show_history':True}
    assert client.get('/discussions/settings').json() == {'show_history':True}
    assert client.get('/me').json()['show_history'] is False  # 일반 대화 설정과 분리
    with Db() as db:
        other = User(username=uid(), nickname='other', password_hash='unused')
        db.add(other)
        db.commit()
    app.dependency_overrides[current_user] = lambda:other.id
    try:
        assert client.get('/discussions/settings').json() == {'show_history':False}
        assert client.get('/discussions/current').json() is None
        assert client.get(f"/discussions/{session['id']}").status_code == 404
        assert client.post(f"/discussions/{session['id']}/confirm").status_code == 404
        assert answer(session).status_code == 404
        assert client.post(f"/discussions/{session['id']}/messages", json={
            'request_id':uid(), 'text':'다른 계정'}).status_code == 404
    finally:
        app.dependency_overrides[current_user] = lambda:person
    assert client.get('/discussions/settings').json() == {'show_history':True}


def test_authentication_is_required():
    for path in ('/discussions/settings', '/discussions/current', '/discussions/unknown'):
        assert client.get(path).status_code == 401
    assert client.post('/discussions/prepare', json={'topic':'고민', 'request_id':uid()}).status_code == 401
    assert client.patch('/discussions/settings', json={'show_history':True}).status_code == 401


def test_intervention_discards_stale_ai_and_retry_uses_latest_context(person, monkeypatch):
    session = start()
    started, finish = threading.Event(), threading.Event()
    seen = []
    async def slow(user, row, history):
        seen.append(history)
        started.set()
        while not finish.is_set():
            await asyncio.sleep(.01)
        return '개입 전에 생성된 낡은 답변'
    with monkeypatch.context() as patch:
        patch.setattr(discussion_ai, 'next_reply', slow)
        with ThreadPoolExecutor(max_workers=1) as pool:
            pending = pool.submit(answer, session)
            try:
                assert started.wait(5)
                intervened = client.post(f"/discussions/{session['id']}/messages", json={
                    'request_id':uid(), 'text':'미래 가능성에 더 무게를 두고 싶어요.'})
                assert intervened.status_code == 200
            finally:
                finish.set()
            assert pending.result().status_code == 409
    updated = client.get('/discussions/current').json()
    assert len(updated['messages']) == 1 and updated['messages'][0]['speaker'] == 'user'
    assert updated['next_speaker_index'] == 0
    result = answer(updated).json()
    assert '미래 가능성' in result['messages'][-1]['text']


def test_simultaneous_messages_and_replies_do_not_duplicate_or_skip(person, monkeypatch):
    session = start()
    endpoint = f"/discussions/{session['id']}/messages"
    body = {'request_id':uid(), 'text':'같은 의견'}
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _:client.post(endpoint, json=body), range(2)))
    assert [response.status_code for response in results] == [200, 200]
    latest = client.get('/discussions/current').json()
    assert len(latest['messages']) == 1 and latest['revision'] == session['revision'] + 1
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda n:client.post(endpoint, json={
            'request_id':uid(), 'text':f'다른 의견 {n}'}), range(2)))
    assert all(response.status_code == 200 for response in results)
    assert all(len(response.json()['messages']) == response.json()['revision'] - 1 for response in results)
    latest = client.get('/discussions/current').json()
    assert len(latest['messages']) == 3
    started, finish = threading.Event(), threading.Event()
    calls = []
    async def slow(*args):
        calls.append(1)
        started.set()
        while not finish.is_set():
            await asyncio.sleep(.01)
        return '동시에 요청한 첫 화자'
    monkeypatch.setattr(discussion_ai, 'next_reply', slow)
    with ThreadPoolExecutor(max_workers=1) as pool:
        pending = pool.submit(answer, latest)
        try:
            assert started.wait(5)
            busy = answer(latest)
            assert busy.status_code == 409 and busy.headers['Retry-After'] == '2'
        finally:
            finish.set()
        results = [pending.result(), busy]
    assert len(calls) == 1
    assert sorted(response.status_code for response in results) == [200, 409]
    latest = client.get('/discussions/current').json()
    assert len(latest['messages']) == 4 and latest['next_speaker_index'] == 1
    assert latest['messages'][-1]['speaker'] == 'blue'


def test_new_topic_invalidates_inflight_reply(person, monkeypatch):
    session = start()
    proposal = prepare('가족과의 대화')
    started, finish = threading.Event(), threading.Event()
    async def slow(*args):
        started.set()
        while not finish.is_set():
            await asyncio.sleep(.01)
        return '이전 주제의 뒤늦은 답변'
    monkeypatch.setattr(discussion_ai, 'next_reply', slow)
    with ThreadPoolExecutor(max_workers=1) as pool:
        pending = pool.submit(answer, session)
        try:
            assert started.wait(5)
            assert client.post(f"/discussions/{proposal['id']}/confirm").status_code == 200
        finally:
            finish.set()
        assert pending.result().status_code == 409
    assert client.get(f"/discussions/{session['id']}").json()['messages'] == []


def test_model_failure_preserves_state_and_masks_private_error(person, monkeypatch):
    session = start()
    async def fail(*args):
        raise RuntimeError('private-token-secret-123')
    with monkeypatch.context() as patch:
        patch.setattr(discussion_ai, 'next_reply', fail)
        response = answer(session)
        assert response.status_code == 502 and 'private-token' not in response.text
        assert client.get('/discussions/current').json() == session
        patch.setattr(discussion_ai, 'assign_roles', fail)
        response = client.post('/discussions/prepare', json={'topic':'새 고민', 'request_id':uid()})
        assert response.status_code == 502 and 'private-token' not in response.text
        assert client.get('/discussions/current').json() == session
    assert answer(session).status_code == 200


def test_openai_role_schema_and_reply_prompt_receive_topic_and_preferences(person, monkeypatch):
    captured = []
    plan = discussion_ai.mock_roles('취업')
    async def parse(**kwargs):
        captured.append(kwargs)
        return SimpleNamespace(status='completed', output_parsed=plan, usage=None)
    async def create(**kwargs):
        captured.append(kwargs)
        return SimpleNamespace(status='completed', output_text='그 의견에 공감해요. 장기 기회를 살릴 준비 기간을 정해 보죠.', usage=None)
    monkeypatch.setattr(ai, 'AI_MODE', 'openai')
    monkeypatch.setattr(ai, 'client', lambda:SimpleNamespace(responses=SimpleNamespace(parse=parse, create=create)))
    session = start('취업과 더 긴 준비 중 무엇이 좋을까?')
    assert captured[0]['text_format'] is discussion_ai.RolePlan
    assert captured[0]['store'] is False
    assert '취업' in json.loads(captured[0]['input'])['topic']
    session = client.post(f"/discussions/{session['id']}/messages", json={
        'request_id':uid(), 'text':'미래성에 비중을 둘게요.'}).json()
    result = answer(session)
    assert result.status_code == 200
    payload = json.loads(captured[-1]['input'])
    assert payload['user_preferences'] == ['미래성에 비중을 둘게요.']
    assert payload['current_bot']['id'] == 'blue'
    assert captured[-1]['store'] is False
    assert '직전 다른 화자의 구체적인 요점' in captured[-1]['instructions']
    assert '그 선택을 실현하는 방법을 적극적으로' in captured[-1]['instructions']
    invalid = plan.model_dump()
    invalid['bots'][1]['id'] = 'blue'
    with pytest.raises(ValidationError):
        discussion_ai.RolePlan.model_validate(invalid)
    invalid = plan.model_dump()
    invalid['bots'][1]['name'] = invalid['bots'][0]['name']
    with pytest.raises(ValidationError):
        discussion_ai.RolePlan.model_validate(invalid)
    invalid = plan.model_dump()
    invalid['bots'][1]['position'] = invalid['bots'][0]['position']
    with pytest.raises(ValidationError):
        discussion_ai.RolePlan.model_validate(invalid)


def test_expired_reply_lease_recovers_and_disconnect_releases(person, monkeypatch):
    session = start()
    with Db.begin() as db:
        row = db.get(DiscussionSession, session['id'])
        row.reply_lease_id = uid()
        row.reply_lease_until = 1
    response = answer(session)
    assert response.status_code == 200
    session = response.json()
    async def disconnected(_request):
        return True
    with monkeypatch.context() as patch:
        patch.setattr(discussions.Request, 'is_disconnected', disconnected)
        assert answer(session).status_code == 499
    with Db() as db:
        row = db.get(DiscussionSession, session['id'])
        assert row.reply_lease_id is None and row.reply_lease_until == 0
    assert client.get('/discussions/current').json() == session
    assert answer(session).status_code == 200


def test_cancelled_model_task_releases_reply_lease(person, monkeypatch):
    session = start()
    async def cancelled(*args):
        raise asyncio.CancelledError()
    monkeypatch.setattr(discussion_ai, 'next_reply', cancelled)
    with pytest.raises(asyncio.CancelledError):
        asyncio.run(discussions.reply(session['id'], discussions.ReplyInput(
            request_id=uid(), expected_revision=session['revision']), person, None))
    with Db() as db:
        row = db.get(DiscussionSession, session['id'])
        assert row.reply_lease_id is None and row.reply_lease_until == 0
    assert client.get('/discussions/current').json() == session


def test_model_timeout_releases_reply_lease(person, monkeypatch):
    session = start()
    async def slow(*args):
        await asyncio.sleep(1)
        return 'late'
    with monkeypatch.context() as patch:
        patch.setattr(discussions, 'CHAT_TIMEOUT_SECONDS', .01)
        patch.setattr(discussion_ai, 'next_reply', slow)
        assert answer(session).status_code == 502
    with Db() as db:
        row = db.get(DiscussionSession, session['id'])
        assert row.reply_lease_id is None and row.reply_lease_until == 0
    assert answer(session).status_code == 200
