"""add user preferences

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-06-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'user_preferences' not in inspector.get_table_names():
        op.create_table(
            'user_preferences',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('favorite_genres', sa.JSON(), nullable=True),
            sa.Column('favorite_themes', sa.JSON(), nullable=True),
            sa.Column('playstyles', sa.JSON(), nullable=True),
            sa.Column('theme_key', sa.String(length=40), server_default='obsidian', nullable=False),
            sa.Column('onboarded_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', name='uq_user_preferences_user_id'),
        )
        op.create_index('ix_user_preferences_user_id', 'user_preferences', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_user_preferences_user_id', table_name='user_preferences')
    op.drop_table('user_preferences')
