"""인증된 생각방 API. 표시 설정과 생성 상태는 일반 대화와 분리합니다."""
import asyncio
import json
import time
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, update
from .db import Db, User, DiscussionSession, DiscussionMessage, DiscussionSettings, uid
from .security import current_user
from .limits import limit
from .ai_errors import public_ai_error
from .tuning import CHAT_TIMEOUT_SECONDS
from . import discussion_ai, mind_council

router = APIRouter(prefix='/discussions', tags=['discussions'])
UserId = Annotated[str, Depends(current_user)]


class PrepareInput(BaseModel):
    topic: str = Field(min_length=1, max_length=3000)
    request_id: str = Field(pattern=r'^[a-zA-Z0-9_-]{8,64}$')
    protocol_version: int = Field(default=1, ge=1, le=2)

    @field_validator('topic')
    @classmethod
    def trim_topic(cls, value):
        if not value.strip():
            raise ValueError('고민을 입력해 주세요.')
        return value.strip()


class MessageInput(BaseModel):
    text: str = Field(min_length=1, max_length=3000)
    request_id: str = Field(pattern=r'^[a-zA-Z0-9_-]{8,64}$')

    @field_validator('text')
    @classmethod
    def trim_text(cls, value):
        if not value.strip():
            raise ValueError('의견을 입력해 주세요.')
        return value.strip()


class ReplyInput(BaseModel):
    request_id: str = Field(pattern=r'^[a-zA-Z0-9_-]{8,64}$')
    expected_revision: int = Field(ge=0)


class SettingsInput(BaseModel):
    show_history: bool
    reminder_enabled: bool | None = None


def lock_account(db, user):
    # 짧은 쓰기 트랜잭션만 직렬화합니다. SQLite에서도 첫 문장을 UPDATE로 시작해
    # 읽기→쓰기 lock upgrade 충돌을 피하고, MySQL에서는 해당 사용자 행을 잠급니다.
    result = db.execute(update(User).where(User.id == user).values(nickname=User.nickname))
    if not result.rowcount:
        raise HTTPException(401, '로그인이 필요합니다.')


def owned(db, session_id, user):
    row = db.get(DiscussionSession, session_id)
    if row is None or row.user_id != user:
        raise HTTPException(404, '생각방 기록을 찾을 수 없습니다.')
    return row


def message_json(row):
    return {key:getattr(row, key) for key in ('id', 'speaker', 'text', 'turn', 'created_at')}


def session_json(db, row):
    messages = db.scalars(select(DiscussionMessage).where(
        DiscussionMessage.session_id == row.id,
        DiscussionMessage.sequence <= row.revision).order_by(DiscussionMessage.sequence))
    result = {'id':row.id, 'topic':row.topic, 'bots':json.loads(row.bots),
            'messages':[message_json(message) for message in messages],
            'next_speaker_index':row.next_speaker_index, 'completed_turns':row.completed_turns,
            'revision':row.revision, 'state':row.state}
    if row.protocol_version == 2:
        result.update(protocol_version=2, phase=mind_council.step(row)[1])
    return result


def prior_request(db, session_id, request_id):
    return db.scalar(select(DiscussionMessage).where(
        DiscussionMessage.session_id == session_id, DiscussionMessage.request_id == request_id))


def require_active(row):
    if row.state != 'active':
        raise HTTPException(409, '현재 진행 중인 주제가 아닙니다. 생각방을 새로 불러와 주세요.')


@router.get('/settings')
def get_settings(user: UserId, protocol_version: int = 1):
    with Db() as db:
        row = db.get(DiscussionSettings, user)
        result = {'show_history':row.show_history if row else False}
        if protocol_version == 2:
            result['reminder_enabled'] = row.reminder_enabled if row else True
        return result


@router.patch('/settings')
def update_settings(body: SettingsInput, user: UserId):
    with Db() as db:
        lock_account(db, user)
        row = db.get(DiscussionSettings, user)
        if row is None:
            row = DiscussionSettings(user_id=user)
            db.add(row)
        row.show_history = body.show_history
        if body.reminder_enabled is not None:
            if row.reminder_enabled != body.reminder_enabled:
                # Invalidate an in-flight council response so the next displayed
                # utterance really uses the updated toggle, even across devices.
                db.execute(update(DiscussionSession).where(
                    DiscussionSession.user_id == user, DiscussionSession.state == 'active',
                    DiscussionSession.protocol_version == 2).values(
                    revision=DiscussionSession.revision + 1, reply_lease_id=None,
                    reply_lease_until=0, updated=time.time()))
            row.reminder_enabled = body.reminder_enabled
        db.commit()
        result = {'show_history':row.show_history}
        if body.reminder_enabled is not None:
            result['reminder_enabled'] = row.reminder_enabled
        return result


@router.get('/current')
def current(user: UserId):
    with Db() as db:
        row = db.scalar(select(DiscussionSession).where(
            DiscussionSession.user_id == user, DiscussionSession.state == 'active')
            .order_by(DiscussionSession.updated.desc(), DiscussionSession.id.desc()).limit(1))
        return session_json(db, row) if row else None


@router.post('/prepare')
async def prepare(body: PrepareInput, user: UserId, request: Request):
    with Db() as db:
        prior = db.scalar(select(DiscussionSession).where(
            DiscussionSession.user_id == user, DiscussionSession.request_id == body.request_id))
        if prior is not None:
            if prior.topic != body.topic or prior.protocol_version != body.protocol_version:
                raise HTTPException(409, '다른 고민에는 새 요청 ID가 필요합니다.')
            return session_json(db, prior)
    limit(user, 'discussion-prepare', 12)
    try:
        if body.protocol_version == 2:
            panel_bots = mind_council.bots()
        else:
            plan = await asyncio.wait_for(discussion_ai.assign_roles(user, body.topic), CHAT_TIMEOUT_SECONDS)
            plan = discussion_ai.RolePlan.model_validate(plan.model_dump())
            panel_bots = plan.model_dump()['bots']
    except Exception as error:
        raise HTTPException(502, public_ai_error(error)) from None
    if await request.is_disconnected():
        raise HTTPException(499, '역할 배정 요청이 취소되었습니다.')
    with Db() as db:
        lock_account(db, user)
        prior = db.scalar(select(DiscussionSession).where(
            DiscussionSession.user_id == user, DiscussionSession.request_id == body.request_id))
        if prior is not None:
            if prior.topic != body.topic or prior.protocol_version != body.protocol_version:
                raise HTTPException(409, '다른 고민에는 새 요청 ID가 필요합니다.')
            return session_json(db, prior)
        row = DiscussionSession(user_id=user, topic=body.topic, request_id=body.request_id,
                                bots=json.dumps(panel_bots, ensure_ascii=False), protocol_version=body.protocol_version)
        db.add(row)
        db.flush()
        result = session_json(db, row)
        db.commit()
        return result


@router.get('/{session_id}')
def read_session(session_id: str, user: UserId):
    with Db() as db:
        return session_json(db, owned(db, session_id, user))


@router.post('/{session_id}/confirm')
def confirm(session_id: str, user: UserId):
    with Db() as db:
        lock_account(db, user)
        row = owned(db, session_id, user)
        if row.state == 'active':
            return session_json(db, row)
        if row.state != 'draft':
            raise HTTPException(409, '종료한 주제는 다시 시작할 수 없습니다. 새 고민을 입력해 주세요.')
        now = time.time()
        db.execute(update(DiscussionSession).where(
            DiscussionSession.user_id == user, DiscussionSession.state == 'active').values(
                state='ended', revision=DiscussionSession.revision + 1, updated=now))
        row.state = 'active'
        row.revision += 1
        row.updated = now
        result = session_json(db, row)
        db.commit()
        return result


@router.post('/{session_id}/messages')
def add_message(session_id: str, body: MessageInput, user: UserId):
    with Db() as db:
        lock_account(db, user)
        row = owned(db, session_id, user)
        previous = prior_request(db, session_id, body.request_id)
        if previous is not None:
            if previous.speaker != 'user' or previous.text != body.text:
                raise HTTPException(409, '다른 메시지에는 새 요청 ID가 필요합니다.')
            return session_json(db, row)
        require_active(row)
        limit(user, 'discussion-message', 60, db=db)
        if row.protocol_version == 2:
            row.next_speaker_index = 0
            row.reply_lease_id = None
            row.reply_lease_until = 0
        row.revision += 1
        row.updated = time.time()
        db.add(DiscussionMessage(session_id=row.id, request_id=body.request_id,
            sequence=row.revision, speaker='user', text=body.text, turn=row.completed_turns + 1))
        result = session_json(db, row)
        db.commit()
        return result


@router.post('/{session_id}/reply')
async def reply(session_id: str, body: ReplyInput, user: UserId, request: Request):
    lease_id = uid()
    with Db() as db:
        lock_account(db, user)
        row = owned(db, session_id, user)
        previous = prior_request(db, session_id, body.request_id)
        if previous is not None:
            if previous.speaker == 'user':
                raise HTTPException(409, '발언 생성에는 새 요청 ID가 필요합니다.')
            return session_json(db, row)
        require_active(row)
        if row.protocol_version == 2 and row.next_speaker_index >= mind_council.STEPS:
            raise HTTPException(409, '사용자의 답변을 기다리고 있어요.')
        if row.revision != body.expected_revision:
            raise HTTPException(409, '새 의견이나 발언이 있습니다. 대화를 새로 불러와 주세요.')
        if row.reply_lease_id and row.reply_lease_until > time.time():
            raise HTTPException(409, '앞선 발언을 정리하고 있어요. 잠시 기다려 주세요.',
                                headers={'Retry-After': '2'})
        limit(user, 'discussion-reply', 60, db=db)
        row.reply_lease_id = lease_id
        row.reply_lease_until = time.time() + CHAT_TIMEOUT_SECONDS + 15
        snapshot = session_json(db, row)
        settings = db.get(DiscussionSettings, user)
        reminder_enabled = settings.reminder_enabled if settings else True
        db.commit()
        # ORM row는 세션 종료 후에도 expire_on_commit=False로 읽기만 사용합니다.
    try:
        try:
            generate = (mind_council.next_reply(user, row, snapshot['messages'], reminder_enabled)
                        if row.protocol_version == 2 else discussion_ai.next_reply(user, row, snapshot['messages']))
            text = await asyncio.wait_for(generate, CHAT_TIMEOUT_SECONDS)
            if not isinstance(text, str) or not text.strip() or len(text) > 1800:
                raise ValueError('빈 발언 또는 발언 길이 초과')
        except Exception as error:
            raise HTTPException(502, public_ai_error(error)) from None
        if await request.is_disconnected():
            raise HTTPException(499, '발언 생성 요청이 취소되었습니다.')
        with Db() as db:
            lock_account(db, user)
            row = owned(db, session_id, user)
            require_active(row)
            # 의견/새 주제/만료 후 새 생성이 있으면 낡은 응답은 저장하지 않습니다.
            if row.revision != body.expected_revision or row.reply_lease_id != lease_id:
                raise HTTPException(409, '새 의견이나 설정이 반영되어 이전 발언을 취소했어요. 다시 확인해 주세요.'
                                    if row.protocol_version == 2 else '새 의견이 반영되어 이전 발언을 취소했어요. 이어하기를 눌러 주세요.')
            speaker = (mind_council.step(row)[0] if row.protocol_version == 2
                       else discussion_ai.BOT_IDS[row.next_speaker_index])
            row.revision += 1
            row.updated = time.time()
            db.add(DiscussionMessage(session_id=row.id, request_id=body.request_id, sequence=row.revision,
                speaker=speaker, text=text.strip(), turn=row.completed_turns + 1))
            row.next_speaker_index = (row.next_speaker_index + 1 if row.protocol_version == 2
                                      else (row.next_speaker_index + 1) % 3)
            if (row.protocol_version == 2 and row.next_speaker_index == mind_council.STEPS
                    or row.protocol_version != 2 and row.next_speaker_index == 0):
                row.completed_turns += 1
            row.reply_lease_id = None
            row.reply_lease_until = 0
            result = session_json(db, row)
            db.commit()
            return result
    finally:
        # 오류·중단·취소에도 자신의 리스만 해제합니다. 프로세스 종료 시에는 만료로 복구합니다.
        with Db.begin() as db:
            db.execute(update(DiscussionSession).where(
                DiscussionSession.id == session_id,
                DiscussionSession.reply_lease_id == lease_id,
            ).values(reply_lease_id=None, reply_lease_until=0))
