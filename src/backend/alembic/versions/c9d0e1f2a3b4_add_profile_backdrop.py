"""add profile backdrop to user preferences

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-06-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, None] = 'b8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_preferences', sa.Column('backdrop_image', sa.String(length=500), nullable=True))
    op.add_column('user_preferences', sa.Column('backdrop_game_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('user_preferences', 'backdrop_game_id')
    op.drop_column('user_preferences', 'backdrop_image')
