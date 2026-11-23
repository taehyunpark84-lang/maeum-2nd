"""별도 생각방 기록과 표시 설정. 기존 대화/사용자 열은 변경하지 않습니다."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import DOUBLE

revision = 'g116_discussions'
down_revision = 'f115_profile_art_sources'
branch_labels = None
depends_on = None

TIME_FLOAT = sa.Float(53).with_variant(DOUBLE(asdecimal=False), 'mysql')


def upgrade():
    op.create_table('discussion_sessions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('request_id', sa.String(64), nullable=False),
        sa.Column('topic', sa.Text(), nullable=False),
        sa.Column('bots', sa.Text(), nullable=False),
        sa.Column('state', sa.String(10), nullable=False),
        sa.Column('next_speaker_index', sa.Integer(), nullable=False),
        sa.Column('completed_turns', sa.Integer(), nullable=False),
        sa.Column('revision', sa.Integer(), nullable=False),
        sa.Column('reply_lease_id', sa.String(36), nullable=True),
        sa.Column('reply_lease_until', TIME_FLOAT, nullable=False, server_default='0'),
        sa.Column('created', TIME_FLOAT, nullable=False),
        sa.Column('updated', TIME_FLOAT, nullable=False),
        sa.UniqueConstraint('user_id', 'request_id'))
    op.create_index('ix_discussion_sessions_user_id', 'discussion_sessions', ['user_id'])
    op.create_table('discussion_messages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('discussion_sessions.id'), nullable=False),
        sa.Column('request_id', sa.String(64), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('speaker', sa.String(10), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('turn', sa.Integer(), nullable=False),
        sa.Column('created_at', TIME_FLOAT, nullable=False),
        sa.UniqueConstraint('session_id', 'request_id'),
        sa.UniqueConstraint('session_id', 'sequence'))
    op.create_index('ix_discussion_messages_session_id', 'discussion_messages', ['session_id'])
    op.create_table('discussion_settings',
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('show_history', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    op.drop_table('discussion_settings')
    op.drop_index('ix_discussion_messages_session_id', table_name='discussion_messages')
    op.drop_table('discussion_messages')
    op.drop_index('ix_discussion_sessions_user_id', table_name='discussion_sessions')
    op.drop_table('discussion_sessions')
