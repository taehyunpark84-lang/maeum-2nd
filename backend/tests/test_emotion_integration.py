import asyncio
from types import SimpleNamespace
import pytest
from test_shared_history import person
from app import ai


@pytest.mark.parametrize('classification,gpt,expected', [
    ({'emotion': '불안', 'confidence': .8}, '불안', True),
    ({'emotion': '불안', 'confidence': .69}, '불안', False),
    ({'emotion': '불안', 'confidence': .8}, '슬픔', False),
    (None, '불안', False),
])
def test_art_hint_preserves_clean_story_and_requires_agreement(person, monkeypatch, classification, gpt, expected):
    calls = {}
    async def classify(story):
        calls['story'] = story
        return classification
    async def parse(**kwargs):
        calls['input'] = kwargs['input']
        return SimpleNamespace(status='completed', usage=None, output_parsed=ai.ArtPlan(
            title='제목', poem='시', interpretation='해석', emotion=gpt,
            image_prompt='[시연 이야기]\n[창가]의 빛'))
    monkeypatch.setattr(ai, 'AI_MODE', 'openai')
    monkeypatch.setattr(ai, 'EMOTION_ART_HINT', True)
    monkeypatch.setattr(ai, 'EMOTION_MIN_CONFIDENCE', .7)
    monkeypatch.setattr(ai, 'classify_story', classify)
    monkeypatch.setattr(ai, 'client', lambda: SimpleNamespace(responses=SimpleNamespace(parse=parse)))
    plan = asyncio.run(ai.plan_art(person, '[시연 이야기]\n면접을 앞두고 불안해.'))
    assert calls == {'input': '면접을 앞두고 불안해.', 'story': '면접을 앞두고 불안해.'}
    assert ('감정 참고:' in plan.image_prompt) == expected
    assert '[시연 이야기]' not in plan.image_prompt and '[창가]' in plan.image_prompt


def test_planning_failure_cancels_pending_classifier(person, monkeypatch):
    cancelled = []
    started = asyncio.Event()
    async def classify(story):
        started.set()
        try:
            await asyncio.sleep(60)
        finally:
            cancelled.append(True)
    async def parse(**kwargs):
        await started.wait()
        raise RuntimeError('synthetic planning failure')
    monkeypatch.setattr(ai, 'AI_MODE', 'openai')
    monkeypatch.setattr(ai, 'EMOTION_ART_HINT', True)
    monkeypatch.setattr(ai, 'classify_story', classify)
    monkeypatch.setattr(ai, 'client', lambda: SimpleNamespace(responses=SimpleNamespace(parse=parse)))
    with pytest.raises(RuntimeError, match='synthetic planning failure'):
        asyncio.run(ai.plan_art(person, '검증 이야기'))
    assert cancelled == [True]
