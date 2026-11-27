import asyncio
import base64
from types import SimpleNamespace
from test_flow import client
from test_shared_history import person, enter, add_message
from test_art_story import finish
from app import ai
from app.art_text import clean_art_story
from app.db import Db, Job, Message, ActiveJob, uid

LABEL = '[참고용 발화 출처: 공간=forest, 역할=user]'
STORY = '친구들이 나만 빼고 만난 것 같아서 속상해. [친구]에게 물어볼지 고민이야.'


def test_only_internal_markers_are_removed_and_story_brackets_are_preserved():
    assert clean_art_story('[시연 이야기]\n' + LABEL + '\n' + STORY) == STORY
    assert clean_art_story('[시연 요약]\n' + LABEL + '\n' + STORY) == STORY
    assert clean_art_story(STORY) == STORY
    assert clean_art_story('[시연 이야기]\n' + LABEL) == ''
    assert '[시연 이야기]' not in clean_art_story('화풍 지침\n[시연 이야기]\n' + LABEL + '\n' + STORY)


def test_mock_preview_contains_only_story_and_keeps_chat_originals(person):
    sid = enter('forest')
    message_id = add_message(sid, STORY)
    response = client.post(f'/sessions/{sid}/preview')
    assert response.status_code == 200
    assert response.json()['summary'] == STORY
    # Simulate a previously opened/old-client draft with the unwanted prefix.
    approved = '[시연 이야기]\n' + LABEL + '\n' + STORY + '\n내가 수정한 내용.'
    response = client.post('/jobs', json={'session_id':sid, 'request_id':uid(),
        'preview_id':response.json()['preview_id'], 'approved_summary':approved})
    assert response.status_code == 202
    with Db() as db:
        job = db.get(Job, response.json()['id'])
        try:
            assert db.get(Message, message_id).text == STORY
            assert job.approved_summary == STORY + '\n내가 수정한 내용.'
        finally:
            # This suite shares its synthetic queue with the worker integration tests.
            job.status = 'failed'
            db.delete(db.get(ActiveJob, person))
            db.commit()


def test_story_model_receives_source_as_metadata_and_its_echo_is_filtered(person, monkeypatch):
    sid = enter('forest')
    add_message(sid, STORY)
    async def decide(user, new, preceding, reference, previous):
        assert new[-1] == {'role':'user', 'content':STORY, 'place_id':'forest'}
        return ai.StoryDecision(has_new_material=True, story=LABEL + '\n' + STORY)
    monkeypatch.setattr(ai, 'select_art_story', decide)
    assert client.post(f'/sessions/{sid}/preview').json()['summary'] == STORY


def test_reused_legacy_story_is_cleaned_without_rewriting_completed_job(person):
    sid = enter('forest')
    through = add_message(sid, STORY)
    original = '[시연 이야기]\n' + LABEL + '\n' + STORY
    finish(person, sid, through, original)
    response = client.post(f'/sessions/{sid}/preview')
    assert response.status_code == 200 and response.json()['summary'] == STORY
    with Db() as db:
        assert db.query(Job).filter(Job.user_id == person).one().approved_summary == original


def test_art_planning_and_final_image_request_strip_internal_markers(person, monkeypatch):
    captured = {}
    async def parse(**kwargs):
        captured['planning'] = kwargs
        return SimpleNamespace(status='completed', usage=None, output_parsed=ai.ArtPlan(
            title='이야기', poem='시', interpretation='설명', image_prompt=LABEL + '\n[창가]와 초록빛 풍경'))
    async def generate(**kwargs):
        captured['image'] = kwargs
        return SimpleNamespace(data=[SimpleNamespace(b64_json=base64.b64encode(b'fixture').decode())], usage=None)
    monkeypatch.setattr(ai, 'AI_MODE', 'openai')
    monkeypatch.setattr(ai, 'client', lambda:SimpleNamespace(
        responses=SimpleNamespace(parse=parse), images=SimpleNamespace(generate=generate)))
    plan = asyncio.run(ai.plan_art(person, '[시연 이야기]\n' + LABEL + '\n' + STORY))
    assert captured['planning']['input'] == STORY
    assert '참고용 발화 출처' not in plan.image_prompt and '[창가]' in plan.image_prompt
    # Also protect old queued jobs whose plan already contains the internal prefix.
    assert asyncio.run(ai.draw(person, '[시연 이야기]\n' + LABEL + '\n' + plan.image_prompt)) == b'fixture'
    assert captured['image']['prompt'] == plan.image_prompt
    assert captured['planning']['store'] is False


def test_marker_only_submission_is_rejected(person):
    sid = enter('forest')
    response = client.post('/jobs', json={'session_id':sid, 'request_id':uid(),
        'approved_summary':'[시연 이야기]\n' + LABEL})
    assert response.status_code == 422
