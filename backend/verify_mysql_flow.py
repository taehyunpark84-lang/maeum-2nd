"""MySQL smoke test: all business writes roll back; images use a temporary directory."""
import asyncio
import sys
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import select, func
from sqlalchemy.orm import sessionmaker
from app import main, worker
from app.config import AI_MODE
from app.db import engine, Base

assert engine.dialect.name == 'mysql', 'MySQL only'
assert AI_MODE == 'mock', 'No paid AI calls permitted'

with engine.connect() as connection, tempfile.TemporaryDirectory(prefix='maeum-mysql-check-') as tmp:
    transaction = connection.begin()
    isolated = sessionmaker(bind=connection, expire_on_commit=False,
                            join_transaction_mode='create_savepoint')
    for name, module in list(sys.modules.items()):
        if name.startswith('app.'):
            if hasattr(module, 'Db'):
                module.Db = isolated
            if hasattr(module, 'DATA'):
                module.DATA = Path(tmp)
    try:
        client = TestClient(main.app)
        body = {'username': 'vm_smoke_20261122', 'password': 'temporary-test-only-20261122',
                'nickname': 'VM smoke test', 'gender': 'female'}
        response = client.post('/auth/register', json=body)
        assert response.status_code == 200, response.status_code
        response = client.post('/auth/login', json=body)
        assert response.status_code == 200
        headers = {'Authorization': 'Bearer ' + response.json()['token']}
        assert client.get('/me', headers=headers).json()['ai_mode'] == 'mock'
        session = client.post('/sessions', headers=headers, json={'place_id': 'forest'}).json()['id']
        response = client.post(f'/sessions/{session}/chat', headers=headers,
                               json={'request_id': 'vm-smoke-chat-20261122', 'text': 'A calm day in the forest.'})
        assert response.status_code == 200
        preview = client.post(f'/sessions/{session}/preview', headers=headers)
        assert preview.status_code == 200
        job = client.post('/jobs', headers=headers, json={
            'session_id': session, 'request_id': 'vm-smoke-art-20261122',
            'approved_summary': preview.json()['summary']})
        assert job.status_code == 202, job.status_code
        claimed = worker.claim_job()
        assert claimed and claimed[0] == job.json()['id']
        asyncio.run(worker.process(*claimed))
        assert client.get('/jobs', headers=headers).json()[0]['status'] == 'completed'
        artwork = client.get('/diaries', headers=headers).json()[0]
        assert client.get(f'/diaries/{artwork["id"]}/image', headers=headers).status_code == 200
        assert client.get(f'/diaries/{artwork["id"]}/thumbnail', headers=headers).status_code == 200
        assert client.get(f'/diaries/{artwork["id"]}/image').status_code == 401
        print('PASS: MySQL register/login/chat/preview/job/worker/image/thumbnail/auth')
    finally:
        transaction.rollback()
with engine.connect() as connection:
    counts = {table.name: connection.scalar(select(func.count()).select_from(table))
              for table in Base.metadata.sorted_tables}
    print('Business table counts:', counts)
    assert all(count == 0 for count in counts.values()), 'Expected empty initial database'
print('PASS: test transaction rolled back; no business records retained')
