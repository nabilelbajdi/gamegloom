"""create_user_platform_games_table

Revision ID: 6081229809f0
Revises: b2c3d4e5f6g7
Create Date: 2025-12-15 00:43:40.806437

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6081229809f0'
down_revision: Union[str, None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_platform_games table for cached sync data
    op.create_table(
        'user_platform_games',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=20), nullable=False),
        sa.Column('platform_id', sa.String(length=50), nullable=False),
        sa.Column('platform_name', sa.String(length=255), nullable=False),
        sa.Column('platform_image_url', sa.String(length=500), nullable=True),
        sa.Column('igdb_id', sa.Integer(), nullable=True),
        sa.Column('igdb_name', sa.String(length=255), nullable=True),
        sa.Column('igdb_cover_url', sa.String(length=500), nullable=True),
        sa.Column('match_confidence', sa.Float(), nullable=True),
        sa.Column('match_method', sa.String(length=30), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('playtime_minutes', sa.Integer(), server_default='0'),
        sa.Column('first_played', sa.DateTime(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'platform', 'platform_id', name='uq_user_platform_game')
    )
    op.create_index('ix_user_platform_games_user', 'user_platform_games', ['user_id', 'platform'])
    op.create_index('ix_user_platform_games_status', 'user_platform_games', ['user_id', 'platform', 'status'])


def downgrade() -> None:
    op.drop_index('ix_user_platform_games_status', table_name='user_platform_games')
    op.drop_index('ix_user_platform_games_user', table_name='user_platform_games')
    op.drop_table('user_platform_games')
