"""Explicitly approved artwork sharing; private conversations never enter public responses."""
from typing import Annotated, Literal
import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, delete, func
from sqlalchemy.exc import IntegrityError
from .db import Db, User, Diary, SharedPost, PostReaction, PostComment
from .security import current_user
from .limits import limit
from .config import DATA

class NoStoreJSONResponse(JSONResponse):
    def __init__(self, *args, **kwargs):
        headers = dict(kwargs.pop('headers', None) or {})
        headers['Cache-Control'] = 'private, no-store'
        super().__init__(*args, headers=headers, **kwargs)

router = APIRouter(tags=['community'], default_response_class=NoStoreJSONResponse)
UserId = Annotated[str, Depends(current_user)]

def commit_interaction(db):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, '게시글이나 반응이 변경되었습니다. 새로고침 후 확인해 주세요.') from None

class SharePostInput(BaseModel):
    diary_id: str
    title: str = Field(min_length=1, max_length=160)
    caption: str = Field(default='', max_length=1200)
    anonymous: bool = True

class ReactionInput(BaseModel):
    reaction: Literal['heart', 'like', 'sad']

class CommentInput(BaseModel):
    text: str = Field(min_length=1, max_length=2000)

def community_post_json(db, rows, user):
    ids = [row.id for row in rows]
    counts = {post_id: {'heart':0, 'like':0, 'sad':0} for post_id in ids}
    comments = {post_id:0 for post_id in ids}
    mine = {}
    if ids:
        for post_id, reaction, total in db.execute(
            select(PostReaction.post_id, PostReaction.reaction, func.count())
            .where(PostReaction.post_id.in_(ids))
            .group_by(PostReaction.post_id, PostReaction.reaction)
        ):
            counts[post_id][reaction] = total
        for post_id, total in db.execute(
            select(PostComment.post_id, func.count())
            .where(PostComment.post_id.in_(ids))
            .group_by(PostComment.post_id)
        ):
            comments[post_id] = total
        mine = {row.post_id:row.reaction for row in db.scalars(
            select(PostReaction).where(PostReaction.user_id == user, PostReaction.post_id.in_(ids))
        )}
    return [{
        'id':row.id,
        'title':row.title,
        'caption':row.caption,
        'author_name':row.author_name,
        'anonymous':row.anonymous,
        'created':row.created,
        'image_url':f'/posts/{row.id}/image',
        'reaction_counts':counts[row.id],
        'my_reaction':mine.get(row.id),
        'comment_count':comments[row.id],
        'mine':row.user_id == user,
    } for row in rows]

@router.get('/feed')
def community_feed(user: UserId):
    with Db() as db:
        rows = list(db.scalars(select(SharedPost).order_by(
            SharedPost.created.desc(), SharedPost.id.desc()).limit(100)))
        return community_post_json(db, rows, user)

@router.post('/posts')
def create_community_post(body: SharePostInput, user: UserId):
    title = body.title.strip()
    caption = body.caption.strip()
    if not title:
        raise HTTPException(422, '제목을 입력해 주세요.')
    with Db() as db:
        artwork = db.scalar(select(Diary).where(Diary.id == body.diary_id, Diary.user_id == user).with_for_update())
        if not artwork:
            raise HTTPException(404, '기록을 찾을 수 없습니다.')
        if db.scalar(select(SharedPost).where(SharedPost.diary_id == artwork.id)):
            raise HTTPException(409, '이미 공유한 작품입니다.')
        account = db.get(User, user)
        limit(user, 'share-post', 20, 86400, db=db)
        row = SharedPost(
            diary_id=artwork.id,
            user_id=user,
            title=title,
            caption=caption,
            author_name='익명' if body.anonymous else account.nickname,
            anonymous=body.anonymous,
        )
        db.add(row)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, '이미 공유한 작품입니다.') from None
        db.refresh(row)
        return community_post_json(db, [row], user)[0]

@router.get('/posts/{post_id}/image')
def community_post_image(post_id: str, user: UserId):
    with Db() as db:
        artwork = db.scalar(select(Diary).join(
            SharedPost, SharedPost.diary_id == Diary.id
        ).where(SharedPost.id == post_id))
        if not artwork:
            raise HTTPException(404, '공유된 작품을 찾을 수 없습니다.')
        path = DATA/'images'/artwork.image_file
    if not path.is_file():
        raise HTTPException(404, '이미지 파일을 찾을 수 없습니다.')
    return FileResponse(path, media_type='image/png', headers={'Cache-Control':'private, no-store'})

@router.post('/posts/{post_id}/reaction')
def react_to_post(post_id: str, body: ReactionInput, user: UserId):
    with Db() as db:
        post = db.scalar(select(SharedPost).where(SharedPost.id == post_id).with_for_update())
        if not post:
            raise HTTPException(404, '공유된 작품을 찾을 수 없습니다.')
        existing = db.get(PostReaction, (post_id, user))
        if existing and existing.reaction == body.reaction:
            db.delete(existing)
        elif existing:
            existing.reaction = body.reaction
            existing.created = time.time()
        else:
            db.add(PostReaction(post_id=post_id, user_id=user, reaction=body.reaction))
        commit_interaction(db)
        db.refresh(post)
        return community_post_json(db, [post], user)[0]

@router.get('/posts/{post_id}/comments')
def post_comments(post_id: str, user: UserId):
    with Db() as db:
        if not db.scalar(select(SharedPost).where(SharedPost.id == post_id).with_for_update()):
            raise HTTPException(404, '공유된 작품을 찾을 수 없습니다.')
        return [{key:getattr(row,key) for key in ('id','author_name','text','created')}
                for row in db.scalars(select(PostComment).where(
                    PostComment.post_id == post_id
                ).order_by(PostComment.created, PostComment.id))]

@router.post('/posts/{post_id}/comments')
def create_post_comment(post_id: str, body: CommentInput, user: UserId):
    text = body.text.strip()
    if not text:
        raise HTTPException(422, '댓글 내용을 입력해 주세요.')
    with Db() as db:
        if not db.scalar(select(SharedPost).where(SharedPost.id == post_id).with_for_update()):
            raise HTTPException(404, '공유된 작품을 찾을 수 없습니다.')
        account = db.get(User, user)
        limit(user, 'post-comment', 30, 60, db=db)
        row = PostComment(
            post_id=post_id,
            user_id=user,
            author_name=account.nickname,
            text=text,
        )
        db.add(row)
        commit_interaction(db)
        db.refresh(row)
        return {key:getattr(row,key) for key in ('id','author_name','text','created')}

@router.delete('/posts/{post_id}')
def withdraw_post(post_id: str, user: UserId):
    """Remove the public post and its interactions, preserving the private artwork."""
    with Db() as db:
        post = db.scalar(select(SharedPost).where(SharedPost.id == post_id, SharedPost.user_id == user).with_for_update())
        if not post:
            raise HTTPException(404, '내가 공유한 작품을 찾을 수 없습니다.')
        db.execute(delete(PostComment).where(PostComment.post_id == post_id))
        db.execute(delete(PostReaction).where(PostReaction.post_id == post_id))
        db.delete(post)
        db.commit()
    return {'ok': True}
