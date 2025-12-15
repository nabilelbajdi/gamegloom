"""add user_psn_preferences table

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2024-12-14

Stores user decisions about PSN games:
- skipped: User wants to hide this game
- matched: User manually matched to a different IGDB entry
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_psn_preferences',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('platform_id', sa.String(50), nullable=False),
        sa.Column('igdb_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'platform_id', name='uq_user_psn_pref')
    )
    op.create_index('ix_user_psn_prefs_user', 'user_psn_preferences', ['user_id'])


def downgrade():
    op.drop_index('ix_user_psn_prefs_user', table_name='user_psn_preferences')
    op.drop_table('user_psn_preferences')
