"""Add versioned council and reminder settings without replacing existing records."""
from alembic import op
import sqlalchemy as sa

revision = 'h117_mind_council'
down_revision = 'g116_discussions'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('discussion_sessions', sa.Column('protocol_version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('discussion_settings', sa.Column('reminder_enabled', sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade():
    op.drop_column('discussion_settings', 'reminder_enabled')
    op.drop_column('discussion_sessions', 'protocol_version')
