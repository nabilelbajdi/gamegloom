"""drop user preferences

Removes the personalization/onboarding preferences table. The recommendation
and onboarding features it backed have been removed.

Revision ID: f4b5c6d7e8a9
Revises: f3a4b5c6d7e8
Create Date: 2026-06-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'f4b5c6d7e8a9'
down_revision: Union[str, None] = 'f3a4b5c6d7e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'user_preferences' in inspector.get_table_names():
        indexes = {ix['name'] for ix in inspector.get_indexes('user_preferences')}
        if 'ix_user_preferences_user_id' in indexes:
            op.drop_index('ix_user_preferences_user_id', table_name='user_preferences')
        op.drop_table('user_preferences')


def downgrade() -> None:
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('favorite_genres', sa.JSON(), nullable=True),
        sa.Column('favorite_themes', sa.JSON(), nullable=True),
        sa.Column('playstyles', sa.JSON(), nullable=True),
        sa.Column('theme_key', sa.String(length=40), server_default='obsidian', nullable=False),
        sa.Column('backdrop_image', sa.String(length=500), nullable=True),
        sa.Column('backdrop_game_id', sa.Integer(), nullable=True),
        sa.Column('onboarded_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_user_preferences_user_id'),
    )
    op.create_index('ix_user_preferences_user_id', 'user_preferences', ['user_id'])
