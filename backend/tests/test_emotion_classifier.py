import asyncio
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from app import config, emotion_art, emotion_classifier as clf
from app.emotion_art import EMOTIONS


def result(emotion, **scores):
    base = {name: 0.0 for name in EMOTIONS}
    base.update(scores)
    return {'emotion': emotion, 'confidence': max(base.values()), 'top2': [], 'scores': base}


def test_emotion_order_matches_session_module():
    assert clf.EMOTIONS == EMOTIONS


def test_clean_texts_removes_emoticon_markers_and_short_text():
    texts = ['[이모티콘: 울음] ', '네', '면접 망해서 너무 불안해', '[emoticon: smile]좋아요 정말']
    assert clf.clean_texts(texts) == ['면접 망해서 너무 불안해', '좋아요 정말']


def test_aggregate_sums_to_100_and_ranks_top2():
    rows = [result('불안', 불안=0.7, 슬픔=0.3), result('불안', 불안=0.5, 슬픔=0.4, 기쁨=0.1)]
    out = clf.aggregate(rows)
    assert sum(out['scores'].values()) == 100
    assert out['top2'] == ['불안', '슬픔']
    assert out['per_turn'] == ['불안', '불안'] and out['turns'] == 2


def test_aggregate_exposes_emotion_and_confidence():
    out = clf.aggregate([result('불안', 불안=0.8, 슬픔=0.2), result('불안', 불안=0.6, 슬픔=0.4)])
    assert out['emotion'] == '불안' and out['confidence'] == 0.7


def test_art_emotion_requires_confidence_and_agreement():
    sure = {'emotion': '불안', 'confidence': 0.7}
    assert emotion_art.decide(sure, '불안', 0.7) == (True, 'agreed')
    assert emotion_art.decide({'emotion': '불안', 'confidence': 0.69}, '불안', 0.7) == (False, 'uncertain')
    assert emotion_art.decide(sure, '슬픔', 0.7) == (False, 'disagree')
    assert emotion_art.decide(sure, '', 0.7) == (False, 'gpt_unclear')
    assert emotion_art.decide(sure, '무기력', 0.7) == (False, 'gpt_unclear')
    assert emotion_art.decide(None, '불안', 0.7) == (False, 'no_classifier')


def test_threshold_uses_probability_before_display_rounding():
    value = clf.aggregate([result('불안', 불안=0.699, 슬픔=0.301)])
    assert value['scores']['불안'] == 70
    assert value['confidence'] == 0.699
    assert emotion_art.decide(value, '불안', 0.7) == (False, 'uncertain')


def test_every_emotion_has_art_hint_without_color_words():
    assert set(emotion_art.HINTS) == set(emotion_art.EMOTIONS)
    for emotion in emotion_art.EMOTIONS:
        text = emotion_art.hint_text(emotion)
        assert emotion in text and '감정 참고' in text


def test_split_story_keeps_chunks_short():
    story = ' '.join(['오늘 면접에서 말문이 막혀 한참 아무 말도 못했다.'] * 12)
    chunks = clf.split_story(story)
    assert len(chunks) > 1 and all(len(chunk) <= 140 + 40 for chunk in chunks)
    assert clf.split_story('두부가 퇴원해서 안심했어.') == ['두부가 퇴원해서 안심했어.']


def test_classify_story_respects_art_switch_and_returns_confidence(monkeypatch):
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            rows = [result('슬픔', 슬픔=0.9, 불안=0.1) for _ in body['texts']]
            data = json.dumps({'results': rows}, ensure_ascii=False).encode()
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers()
            self.wfile.write(data)
        def log_message(self, *args):
            pass
    server = HTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    monkeypatch.setattr(config, 'EMOTION_URL', f'http://127.0.0.1:{server.server_port}')
    monkeypatch.setattr(config, 'EMOTION_ART_HINT', True)
    out = asyncio.run(clf.classify_story('두부가 떠난 뒤로 집이 너무 조용해. 자꾸 눈물이 나.'))
    assert out['emotion'] == '슬픔' and out['confidence'] == 0.9
    monkeypatch.setattr(config, 'EMOTION_ART_HINT', False)
    assert asyncio.run(clf.classify_story('두부가 떠난 뒤로 집이 너무 조용해.')) is None
    server.shutdown()
