"""drop_dead_psn_sync_tables

Revision ID: a1b2c3d4e5f6
Revises: 509348ff0ce3
Create Date: 2024-12-14

Drops unused tables:
- synced_games: Replaced by ephemeral PSN sync flow
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '509348ff0ce3'
branch_labels = None
depends_on = None


def upgrade():
    # Drop synced_games table and its indexes
    op.drop_index('ix_synced_games_status', table_name='synced_games')
    op.drop_index('ix_synced_games_user_platform', table_name='synced_games')
    op.drop_index('ix_synced_games_user_platform_id', table_name='synced_games')
    op.drop_table('synced_games')


def downgrade():
    # Recreate synced_games table
    op.create_table(
        'synced_games',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('platform_id', sa.String(), nullable=False),
        sa.Column('platform_name', sa.String(), nullable=False),
        sa.Column('igdb_id', sa.Integer(), nullable=True),
        sa.Column('igdb_name', sa.String(), nullable=True),
        sa.Column('igdb_cover_url', sa.String(), nullable=True),
        sa.Column('match_confidence', sa.Float(), nullable=True),
        sa.Column('match_method', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('target_list', sa.String(), nullable=True, server_default='played'),
        sa.Column('playtime_minutes', sa.Integer(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_synced_games_status', 'synced_games', ['user_id', 'status'])
    op.create_index('ix_synced_games_user_platform', 'synced_games', ['user_id', 'platform'])
    op.create_index('ix_synced_games_user_platform_id', 'synced_games', ['user_id', 'platform', 'platform_id'], unique=True)
