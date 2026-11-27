"""작품 피드만 추가합니다. 최신 마음회의 및 기존 기록을 보존합니다."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import DOUBLE

revision = 'i118_community_feed'
down_revision = 'h117_mind_council'
branch_labels = None
depends_on = None

TIME_FLOAT = sa.Float(53).with_variant(DOUBLE(asdecimal=False), 'mysql')


def upgrade():
    op.create_table(
        'shared_posts',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('diary_id', sa.String(36), sa.ForeignKey('diaries.id'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(160), nullable=False),
        sa.Column('caption', sa.Text(), nullable=False),
        sa.Column('author_name', sa.String(40), nullable=False),
        sa.Column('anonymous', sa.Boolean(), nullable=False),
        sa.Column('created', TIME_FLOAT, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('diary_id'),
    )
    op.create_index('ix_shared_posts_diary_id', 'shared_posts', ['diary_id'])
    op.create_index('ix_shared_posts_user_id', 'shared_posts', ['user_id'])
    op.create_table(
        'post_reactions',
        sa.Column('post_id', sa.String(36), sa.ForeignKey('shared_posts.id'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('reaction', sa.String(12), nullable=False),
        sa.Column('created', TIME_FLOAT, nullable=False),
        sa.PrimaryKeyConstraint('post_id', 'user_id'),
    )
    op.create_table(
        'post_comments',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('post_id', sa.String(36), sa.ForeignKey('shared_posts.id'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('author_name', sa.String(40), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created', TIME_FLOAT, nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_post_comments_post_id', 'post_comments', ['post_id'])
    op.create_index('ix_post_comments_user_id', 'post_comments', ['user_id'])


def downgrade():
    op.drop_index('ix_post_comments_user_id', table_name='post_comments')
    op.drop_index('ix_post_comments_post_id', table_name='post_comments')
    op.drop_table('post_comments')
    op.drop_table('post_reactions')
    op.drop_index('ix_shared_posts_user_id', table_name='shared_posts')
    op.drop_index('ix_shared_posts_diary_id', table_name='shared_posts')
    op.drop_table('shared_posts')
