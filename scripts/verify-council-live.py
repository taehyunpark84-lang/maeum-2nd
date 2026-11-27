"""Opt-in real-model council check. Synthetic data and an isolated tmp DB only."""
import argparse
import json
import os
from pathlib import Path
import sys
import time
from types import SimpleNamespace

parser = argparse.ArgumentParser()
parser.add_argument('--live', action='store_true', help='Allow 14 real text-model calls (API charges apply).')
args = parser.parse_args()
if not args.live:
    parser.exit(message='No API calls made. Use --live for the synthetic 14-call check.\n')

from dotenv import dotenv_values
root = Path(__file__).resolve().parents[1]
values = dotenv_values(root / 'backend/.env')
assert values.get('OPENAI_API_KEY'), 'Set the local backend key first'
output = root / 'tmp/council' / f'live-{time.time_ns()}'
output.mkdir(parents=True)
os.environ.update(PYTHON_DOTENV_DISABLED='1', AI_MODE='openai',
                  OPENAI_API_KEY=values['OPENAI_API_KEY'],
                  DATA_DIR=str(output), DATABASE_URL='sqlite:///' + (output / 'check.db').as_posix(),
                  TEXT_MODEL=values.get('TEXT_MODEL') or 'gpt-6.1-terra')
sys.path.insert(0, str(root / 'backend'))
from fastapi.testclient import TestClient
from app.main import app
from app import ai
from app.db import Base, engine, uid
from app.mind_council import STEPS

Base.metadata.create_all(engine)
captured = []
native = ai.client()


async def capture_create(**kwargs):
    extras = [m for m in kwargs['input'] if m['role'] == 'developer']
    captured.append(bool(extras))
    try:
        return await native.responses.create(**kwargs)
    except Exception as exc:
        report.setdefault('provider_errors', []).append({
            'type': type(exc).__name__, 'http_status': getattr(exc, 'status_code', None),
            'event_loop_closed': 'event loop is closed' in str(exc).lower()})
        raise


ai.client = lambda: SimpleNamespace(responses=SimpleNamespace(create=capture_create))
report = {'model': os.environ['TEXT_MODEL'], 'synthetic': True, 'utterances': []}
client = TestClient(app)
client.__enter__()  # One persistent event loop, matching the actual API server.
credentials = {'username': 'council_check', 'password': 'synthetic-password-123', 'nickname': '검증'}
client.post('/auth/register', json=credentials).raise_for_status()
login = client.post('/auth/login', json=credentials)
login.raise_for_status()
client.headers['Authorization'] = 'Bearer ' + login.json()['token']
draft = client.post('/discussions/prepare', json={
    'topic': '친구가 약속을 두 번 취소해서 서운해. 그래도 관계는 지키고 싶어.',
    'request_id': uid(), 'protocol_version': 2})
draft.raise_for_status()
session = client.post(f"/discussions/{draft.json()['id']}/confirm").json()


def reply():
    global session
    response = client.post(f"/discussions/{session['id']}/reply", json={
        'request_id': uid(), 'expected_revision': session['revision']})
    if response.status_code != 200:
        raise RuntimeError(f'Council request failed, HTTP {response.status_code}')
    session = response.json()
    message = session['messages'][-1]
    report['utterances'].append({'speaker': message['speaker'], 'text': message['text'],
                                 'phase': message.get('phase'),
                                 'reminder_sent': captured[-1]})
    print(f"PASS: utterance {len(captured)}/14 {message['speaker']} reminder={captured[-1]}", flush=True)


try:
    for _ in range(STEPS):
        reply()
    assert session['phase'] == 'awaiting_user'
    assert [m['phase'] for m in session['messages']] == ['opening', *(['first_opinion'] * 4), *(['debate'] * 4), 'bridge', 'question']
    for message in session['messages']:
        if message['phase'] == 'first_opinion':
            assert 2 <= len(message['text'].splitlines()) <= 3, 'Opinion must have 2-3 lines'
        if message['phase'] == 'debate':
            assert len(message['text'].splitlines()) == 1
            assert len(message['text']) <= 90, 'Rebuttal must be short'
            assert any(name in message['text'] for name in ('슬픔', '불안', '분노', '기쁨')), 'Rebuttal must address another panel'
    assert captured == [False, True, True, True, True, True, True, True, True, False, True]
    report['first_cycle'] = 'passed'
    client.patch('/discussions/settings', json={'show_history': False, 'reminder_enabled': False}).raise_for_status()
    session = client.post(f"/discussions/{session['id']}/messages", json={
        'request_id': uid(), 'text': '나는 약속을 잡기 전에 일정이 가능한지 먼저 확인했으면 좋겠어.'}).json()
    reply()  # moderator
    reply()  # sadness, reminder off
    assert captured[-1] is False
    client.patch('/discussions/settings', json={'show_history': False, 'reminder_enabled': True}).raise_for_status()
    session = client.get('/discussions/current').json()
    reply()  # anxiety, reminder on again
    assert captured[-1] is True
    report['reminder_on_off_on'] = 'passed'
    report['status'] = 'passed'
finally:
    (output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Report:', output / 'report.json', flush=True)
    client.__exit__(None, None, None)
