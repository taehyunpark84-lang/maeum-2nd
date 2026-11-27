"""Sharing is opt-in, scoped to the owner, and withdrawal preserves private records."""
from pathlib import Path
from PIL import Image
from sqlalchemy import select
from test_flow import client
from test_shared_history import person, enter, completed_work
from app.main import app
from app.security import current_user
from app.config import DATA
from app.db import Db, User, Diary, Job, PostComment, PostReaction, uid


def switch_user(user):
    app.dependency_overrides[current_user] = lambda: user


def another_user():
    with Db() as db:
        user = User(username=uid(), nickname='다른 회원', password_hash='unused')
        db.add(user)
        db.commit()
        return user.id


def artwork(user):
    sid = enter('forest')
    diary = completed_work(user, sid)
    directory = DATA / 'images'
    directory.mkdir(exist_ok=True)
    Image.new('RGB', (8, 8), 'ivory').save(directory / 'fixture.png')
    return diary


def publish(diary, **extra):
    return client.post('/posts', json={'diary_id': diary, 'title': '공개 제목', 'caption': '승인한 설명', **extra})


def test_opt_in_publication_allowlist_and_private_routes_remain_owned(person):
    diary = artwork(person)
    other = another_user()
    switch_user(other)
    assert all(p['title'] != '아직 비공개' for p in client.get('/feed').json())
    assert publish(diary).status_code == 404
    assert client.get(f'/diaries/{diary}/image').status_code == 404
    switch_user(person)
    result = publish(diary, private_session='must-not-leak', approved_summary='private')
    assert result.status_code == 200
    post = result.json()
    assert post['anonymous'] and post['author_name'] == '익명' and post['mine']
    assert set(post) == {'id', 'title', 'caption', 'author_name', 'anonymous', 'created', 'image_url',
                         'reaction_counts', 'my_reaction', 'comment_count', 'mine'}
    assert publish(diary).status_code == 409
    switch_user(other)
    response = client.get('/feed')
    assert response.headers['cache-control'] == 'private, no-store'
    shared = next(p for p in response.json() if p['id'] == post['id'])
    assert not shared['mine']
    image = client.get(post['image_url'])
    assert image.status_code == 200 and image.headers['cache-control'] == 'private, no-store'
    assert client.get(f'/diaries/{diary}/messages').status_code == 404


def test_reactions_comments_withdrawal_and_republication_preserve_private_artwork(person):
    diary = artwork(person)
    post = publish(diary, anonymous=False).json()
    post_id = post['id']
    assert post['author_name'] == '검증'
    other = another_user()
    switch_user(other)
    path = f'/posts/{post_id}'
    assert client.post(path + '/reaction', json={'reaction': 'heart'}).json()['reaction_counts']['heart'] == 1
    changed = client.post(path + '/reaction', json={'reaction': 'sad'}).json()
    assert changed['reaction_counts'] == {'heart': 0, 'like': 0, 'sad': 1}
    assert client.post(path + '/reaction', json={'reaction': 'sad'}).json()['my_reaction'] is None
    assert client.post(path + '/reaction', json={'reaction': 'like'}).status_code == 200
    assert client.post(path + '/comments', json={'text': '고마운 그림이네요'}).status_code == 200
    assert len(client.get(path + '/comments').json()) == 1
    assert client.delete(path).status_code == 404
    switch_user(person)
    assert client.delete(path).status_code == 200
    assert all(p['id'] != post_id for p in client.get('/feed').json())
    assert client.get(path + '/image').status_code == 404
    assert client.get(path + '/comments').status_code == 404
    assert client.post(path + '/comments', json={'text': '늦은 댓글'}).status_code == 404
    assert client.post(path + '/reaction', json={'reaction': 'heart'}).status_code == 404
    with Db() as db:
        original = db.get(Diary, diary)
        assert original is not None and db.get(Job, original.job_id) is not None
        assert not list(db.scalars(select(PostComment).where(PostComment.post_id == post_id)))
        assert not list(db.scalars(select(PostReaction).where(PostReaction.post_id == post_id)))
    assert client.get(f'/diaries/{diary}/image').status_code == 200
    assert publish(diary).json()['id'] != post_id


def test_auth_and_validation_for_all_publication_operations(person):
    diary = artwork(person)
    assert publish(diary, title='   ').status_code == 422
    post = publish(diary).json()
    path = f"/posts/{post['id']}"
    assert client.post(path + '/comments', json={'text': '  '}).status_code == 422
    assert client.post(path + '/reaction', json={'reaction': 'unknown'}).status_code == 422
    app.dependency_overrides.clear()
    for method, url, body in [('GET', '/feed', None), ('POST', '/posts', {'diary_id': diary, 'title': '제목'}),
                              ('GET', path+'/image', None), ('GET', path+'/comments', None),
                              ('POST', path+'/comments', {'text':'댓글'}), ('POST', path+'/reaction', {'reaction':'heart'}),
                              ('DELETE', path, None)]:
        assert client.request(method, url, json=body).status_code == 401
