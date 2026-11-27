"""KoELECTRA 6감정 분류 서버(scripts/emotion_server, 기본 8001번) 연결.
그림 연출(plan_art)에서만 사용합니다. 서버가 꺼져 있거나 느려도 예외 없이 None을 돌려줍니다."""
import asyncio
import json
import re
import math
import urllib.request
from . import config

EMOTIONS = ('기쁨', '분노', '상처', '슬픔', '당황', '불안')

MAX_TEXTS = 20
MAX_CHARS = 500
MARKER_RE = re.compile(r'\[(?:이모티콘|emoticon)\s*:[^\]]*\]')


def clean_texts(texts):
    """이모티콘 표시를 지우고 너무 짧은 문장은 제외합니다. 최근 MAX_TEXTS개만 사용합니다."""
    cleaned = [MARKER_RE.sub('', str(t)).strip()[:MAX_CHARS] for t in texts]
    return [t for t in cleaned if len(t) >= 2][-MAX_TEXTS:]


def _post(texts):
    request = urllib.request.Request(
        config.EMOTION_URL.rstrip('/') + '/predict_batch',
        data=json.dumps({'texts': texts}, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(request, timeout=config.EMOTION_TIMEOUT) as response:
        return json.loads(response.read().decode('utf-8'))


def aggregate(results):
    """발화별 확률(scores)을 평균 내어 합계 100의 정수 점수와 상위 2개로 만듭니다."""
    totals = {emotion: 0.0 for emotion in EMOTIONS}
    for row in results:
        if row['emotion'] not in EMOTIONS:
            raise ValueError('Unknown emotion')
        for emotion in EMOTIONS:
            score = float(row['scores'].get(emotion, 0.0))
            if not math.isfinite(score) or not 0 <= score <= 1:
                raise ValueError('Invalid probability')
            totals[emotion] += score
    total = sum(totals.values())
    if total <= 0:
        return None
    exact = {emotion: totals[emotion] * 100 / total for emotion in EMOTIONS}
    scores = {emotion: int(exact[emotion]) for emotion in EMOTIONS}
    remainder = 100 - sum(scores.values())
    for emotion in sorted(EMOTIONS, key=lambda e: exact[e] - scores[e], reverse=True)[:remainder]:
        scores[emotion] += 1
    ranked = sorted(EMOTIONS, key=lambda e: (exact[e], EMOTIONS.index(e)), reverse=True)
    per_turn = [row['emotion'] for row in results]
    # confidence: 발화별 확률을 평균 낸 1위 감정의 비율(0~1)
    return {'emotion': ranked[0], 'confidence': round(totals[ranked[0]] / total, 12), 'scores': scores,
            'top2': ranked[:2], 'per_turn': per_turn, 'turns': len(results)}


async def _classify(texts):
    cleaned = clean_texts(texts)
    if not cleaned:
        return None
    try:
        data = await asyncio.to_thread(_post, cleaned)
        results = data['results']
        if not results or len(results) != len(cleaned):
            return None
        return aggregate(results)
    except Exception as exc:  # 분류 서버 문제로 감정 분석이 막히면 안 됩니다.
        print('emotion_classifier:', type(exc).__name__, flush=True)
        return None


def split_story(text, limit=140):
    """모델의 입력 길이(160토큰)에 맞게 이야기를 문장 단위로 나눕니다."""
    sentences = [part.strip() for part in re.findall(r'[^.!?。…\n]+[.!?。…]*', text) if part.strip()]
    chunks, current = [], ''
    for sentence in sentences:
        if current and len(current) + len(sentence) + 1 > limit:
            chunks.append(current)
            current = sentence
        else:
            current = (current + ' ' + sentence).strip()
    if current:
        chunks.append(current)
    return chunks


async def classify_story(text):
    """그림 연출용: 승인한 이야기 전체의 감정을 분류합니다. 비활성화되었거나 서버 문제면 None."""
    if not config.EMOTION_ART_HINT:
        return None
    return await _classify(split_story(text))
