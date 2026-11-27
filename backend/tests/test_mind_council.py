import asyncio
import json
import threading
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from test_flow import client
from test_shared_history import person
from app import ai, mind_council
from app.db import uid


def start():
    draft = client.post('/discussions/prepare', json={
        'topic': '친구에게 서운하지만 다시 만나고 싶어.', 'request_id': uid(), 'protocol_version': 2})
    assert draft.status_code == 200, draft.text
    return client.post(f"/discussions/{draft.json()['id']}/confirm").json()


def reply(session, request_id=None):
    return client.post(f"/discussions/{session['id']}/reply", json={
        'request_id': request_id or uid(), 'expected_revision': session['revision']})


def send(session, text='내 마음을 먼저 알아줬으면 좋겠어.'):
    response = client.post(f"/discussions/{session['id']}/messages", json={'text': text, 'request_id': uid()})
    assert response.status_code == 200, response.text
    return response.json()


def test_full_cycle_waits_for_user_rotates_question_and_preserves_records(person):
    session = start()
    assert [b['id'] for b in session['bots']] == list(mind_council.PANEL_IDS)
    expected = ['moderator', *mind_council.PANEL_IDS, *mind_council.PANEL_IDS, 'moderator', 'sadness']
    for speaker in expected:
        response = reply(session)
        assert response.status_code == 200, response.text
        session = response.json()
        assert session['messages'][-1]['speaker'] == speaker
    assert session['phase'] == 'awaiting_user' and session['completed_turns'] == 1
    assert [m['phase'] for m in session['messages']] == ['opening', *(['first_opinion'] * 4), *(['debate'] * 4), 'bridge', 'question']
    assert reply(session).status_code == 409
    assert client.get('/discussions/current').json() == session
    # Retries of the final committed reply remain idempotent even while awaiting input.
    session = send(session)
    assert session['phase'] == 'opening'
    for _ in range(mind_council.STEPS):
        response = reply(session)
        assert response.status_code == 200, response.text
        session = response.json()
    assert session['messages'][-1]['speaker'] == 'anxiety'
    assert session['completed_turns'] == 2
    assert [m['phase'] for m in session['messages'][-11:]] == ['opening', *(['first_opinion'] * 4), *(['debate'] * 4), 'bridge', 'question']
    previous = json.loads(json.dumps(session['messages']))
    next_session = start()
    saved = client.get(f"/discussions/{session['id']}").json()
    assert saved['state'] == 'ended' and saved['messages'] == previous
    assert client.get('/discussions/current').json()['id'] == next_session['id']


def test_actual_provider_payload_reminder_on_off_on_for_all_personas(person, monkeypatch):
    captured = []
    async def create(**kwargs):
        captured.append(kwargs)
        return SimpleNamespace(status='completed', output_text='서로 다른 마음을 살펴보자.', usage=None)
    monkeypatch.setattr(ai, 'AI_MODE', 'openai')
    monkeypatch.setattr(ai, 'client', lambda: SimpleNamespace(responses=SimpleNamespace(create=create)))
    session = start()
    settings_url = '/discussions/settings?protocol_version=2'
    assert client.get(settings_url).json()['reminder_enabled'] is True
    for _ in range(mind_council.STEPS):
        response = reply(session)
        assert response.status_code == 200, response.text
        session = response.json()
    for index, speaker in enumerate(['moderator', *mind_council.PANEL_IDS, *mind_council.PANEL_IDS, 'moderator', 'sadness']):
        payload = captured[index]
        extras = [m for m in payload['input'] if m['role'] == 'developer']
        assert payload['store'] is False
        if speaker == 'moderator':
            assert not extras
        else:
            assert len(extras) == 1 and mind_council.reminder(speaker) in extras[0]['content']
            assert payload['input'][-1] == extras[0]
            assert (mind_council.PROMPTS / f'{speaker}.txt').read_text(encoding='utf-8') in payload['instructions']
    assert client.patch('/discussions/settings', json={'show_history': False, 'reminder_enabled': False}).status_code == 200
    assert client.get(settings_url).json()['reminder_enabled'] is False
    session = send(session, '최신 답변의 구체적인 조건을 반영해 줘.')
    for _ in range(2):
        session = reply(session).json()
    assert not any(m['role'] == 'developer' for m in captured[-1]['input'])
    assert any('최신 답변의 구체적인 조건' in m['content'] for m in captured[-1]['input'])
    assert '슬픔(공감자)' in captured[-1]['instructions']
    client.patch('/discussions/settings', json={'show_history': False, 'reminder_enabled': True})
    session = client.get('/discussions/current').json()
    assert reply(session).status_code == 200
    assert mind_council.reminder('anxiety') in captured[-1]['input'][-1]['content']


def test_toggle_invalidates_inflight_reply_and_next_request_uses_new_value(person, monkeypatch):
    session = start()
    session = reply(session).json()  # moderator
    started, finish = threading.Event(), threading.Event()
    flags = []
    async def slow(user, row, history, enabled):
        flags.append(enabled)
        started.set()
        while not finish.is_set():
            await asyncio.sleep(.01)
        return '이전 설정으로 생성한 발언'
    with monkeypatch.context() as patch:
        patch.setattr(mind_council, 'next_reply', slow)
        with ThreadPoolExecutor(max_workers=1) as pool:
            pending = pool.submit(reply, session)
            try:
                assert started.wait(5)
                assert client.patch('/discussions/settings', json={'show_history': False, 'reminder_enabled': False}).status_code == 200
            finally:
                finish.set()
            assert pending.result().status_code == 409
    latest = client.get('/discussions/current').json()
    assert latest['messages'] == session['messages']
    async def next_value(user, row, history, enabled):
        flags.append(enabled)
        return '새 설정을 반영한 발언'
    monkeypatch.setattr(mind_council, 'next_reply', next_value)
    response = reply(latest)
    assert response.status_code == 200
    assert flags == [True, False]
    assert response.json()['messages'][-1]['text'] == '새 설정을 반영한 발언'


def test_settings_for_other_accounts_and_legacy_api_keep_defaults(person):
    # Original response contract and version-1 callers remain supported.
    assert client.get('/discussions/settings').json() == {'show_history': False}
    assert client.get('/discussions/settings?protocol_version=2').json() == {'show_history': False, 'reminder_enabled': True}
    assert client.patch('/discussions/settings', json={'show_history': True}).json() == {'show_history': True}
    assert client.get('/discussions/settings?protocol_version=2').json()['reminder_enabled'] is True


def test_debate_interjection_stays_one_sentence_and_question_contains_only_the_question():
    assert mind_council.format_reply('잠깐!\n그 근거를 확인해야 해.', 'debate') == '잠깐, 그 근거를 확인해야 해.'
    assert mind_council.format_reply('네 마음이 중요해. 가장 속상했던 건 뭐야?', 'question') == '가장 속상했던 건 뭐야?'
    assert mind_council.format_reply('기쁨아, 너무 성급한 결론이야. 다른 의견을 다시 말할게.', 'debate') == '기쁨아, 너무 성급한 결론이야.'
    assert mind_council.format_reply('첫 생각이야. 다음 생각이야. 마지막 생각이야. 더 길게 말할게.', 'first_opinion') == '첫 생각이야.\n다음 생각이야.\n마지막 생각이야.'


def test_user_input_blocked_at_every_stage_until_representative_question(person):
    session = start()
    for _ in range(mind_council.STEPS):
        before = client.get('/discussions/current').json()
        blocked = client.post(f"/discussions/{session['id']}/messages", json={'text': '아직 입력하면 안 돼.', 'request_id': uid()})
        assert blocked.status_code == 409
        assert client.get('/discussions/current').json() == before
        session = reply(session).json()
    request_id = uid()
    body = {'text': '이제 대표 질문에 답할게.', 'request_id': request_id}
    endpoint = f"/discussions/{session['id']}/messages"
    response = client.post(endpoint, json=body)
    assert response.status_code == 200
    updated = response.json()
    assert updated['messages'][-1]['phase'] == 'user'
    assert client.post(endpoint, json=body).json() == updated
    assert client.post(endpoint, json={**body, 'request_id': uid()}).status_code == 409


def test_debate_provider_instruction_requires_a_rebuttal_not_another_opinion(person):
    row = SimpleNamespace(topic='마음 회의', next_speaker_index=5, completed_turns=0)
    payload = mind_council.request_payload(row, [], True)
    assert '현재는 3단계' in payload['instructions']
    assert '1차 의견을 다시 발표하는 단계가 절대 아니다' in payload['instructions']
    assert '그 패널의 이름을 부르며 직접 반박' in payload['instructions']
    assert payload['input'][-1]['role'] == 'developer'
