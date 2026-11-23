"""Opt-in real-model smoke check; uses a fresh isolated DB and synthetic topic only."""
import argparse
import json
from pathlib import Path
import sys
import uuid


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--live', action='store_true', help='Allow five billable text model calls using backend configuration.')
    args = parser.parse_args()
    if not args.live:
        parser.error('--live is required: this check makes up to five billable model calls.')
    root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(root / 'backend'))
    from app import config
    if not config.API_KEY:
        raise SystemExit('OPENAI_API_KEY is not configured; no model calls made.')
    run = root / 'tmp' / 'discussion-live' / str(uuid.uuid4())
    run.mkdir(parents=True, exist_ok=False)
    config.DATABASE_URL = 'sqlite:///' + (run / 'validation.db').as_posix()
    config.DATA = run
    config.AI_MODE = 'openai'
    from app.db import Base, engine, Db, User, uid
    from app.main import app
    from app.security import current_user
    from fastapi.testclient import TestClient
    Base.metadata.create_all(engine)
    with Db.begin() as db:
        user = User(username='discussion-live-check', nickname='기능 검증', password_hash='test-only-no-login')
        db.add(user)
        db.flush()
        user_id = user.id
    app.dependency_overrides[current_user] = lambda: user_id
    print('Isolated validation database initialized.', flush=True)
    report = {'mode': 'openai', 'topic': '바로 중소기업에 취업할지 취업 준비를 더 해서 대기업에 도전할지 고민입니다.', 'checks': []}
    def request(client, path, body=None):
        response = client.post(path, json=body) if body is not None else client.post(path)
        if response.status_code != 200:
            raise RuntimeError(f'{path}: HTTP {response.status_code}: {response.text[:300]}')
        return response.json()
    try:
        with TestClient(app) as client:
            print('Requesting role assignment from configured text model.', flush=True)
            draft = request(client, '/discussions/prepare', {'topic': report['topic'], 'request_id': uid()})
            report['bots'] = draft['bots']
            print('Topic-specific roles generated.', flush=True)
            session = request(client, f"/discussions/{draft['id']}/confirm")
            for speaker in ('blue', 'amber', 'violet'):
                session = request(client, f"/discussions/{session['id']}/reply", {'request_id': uid(), 'expected_revision': session['revision']})
                assert session['messages'][-1]['speaker'] == speaker
                print(f'{speaker} reply generated.', flush=True)
            assert session['completed_turns'] == 1 and session['next_speaker_index'] == 0
            report['checks'].append('one complete turn with three distinct speakers')
            session = request(client, f"/discussions/{session['id']}/messages", {'text': '지금 생활비가 필요해서 현실성과 당장 실행할 수 있는 방법에 더 비중을 두고 싶어요.', 'request_id': uid()})
            session = request(client, f"/discussions/{session['id']}/reply", {'request_id': uid(), 'expected_revision': session['revision']})
            report['messages'] = session['messages']
            report['checks'].append('reply generated after user priority intervention')
            report['ok'] = True
    except Exception as error:
        report['ok'] = False
        report['error'] = str(error)
        raise
    finally:
        app.dependency_overrides.clear()
        destination = run / 'report.json'
        destination.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'Report: {destination}', flush=True)


if __name__ == '__main__':
    main()
