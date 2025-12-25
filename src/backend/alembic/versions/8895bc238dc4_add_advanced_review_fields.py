"""add_advanced_review_fields

Revision ID: 8895bc238dc4
Revises: 6081229809f0
Create Date: 2025-12-25 13:56:34.085316

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '8895bc238dc4'
down_revision: Union[str, None] = '6081229809f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add advanced review fields
    op.add_column('reviews', sa.Column('platform', sa.String(length=50), nullable=True))
    op.add_column('reviews', sa.Column('playtime_hours', sa.Integer(), nullable=True))
    op.add_column('reviews', sa.Column('completion_status', sa.String(length=50), nullable=True))
    op.add_column('reviews', sa.Column('story_rating', sa.Integer(), nullable=True))
    op.add_column('reviews', sa.Column('gameplay_rating', sa.Integer(), nullable=True))
    op.add_column('reviews', sa.Column('visuals_rating', sa.Integer(), nullable=True))
    op.add_column('reviews', sa.Column('audio_rating', sa.Integer(), nullable=True))
    op.add_column('reviews', sa.Column('performance_rating', sa.Integer(), nullable=True))
    op.add_column('reviews', sa.Column('recommended', sa.Boolean(), nullable=True))
    op.alter_column('reviews', 'content',
               existing_type=sa.VARCHAR(length=2000),
               type_=sa.String(length=5000),
               existing_nullable=True)


def downgrade() -> None:
    op.alter_column('reviews', 'content',
               existing_type=sa.String(length=5000),
               type_=sa.VARCHAR(length=2000),
               existing_nullable=True)
    op.drop_column('reviews', 'recommended')
    op.drop_column('reviews', 'performance_rating')
    op.drop_column('reviews', 'audio_rating')
    op.drop_column('reviews', 'visuals_rating')
    op.drop_column('reviews', 'gameplay_rating')
    op.drop_column('reviews', 'story_rating')
    op.drop_column('reviews', 'completion_status')
    op.drop_column('reviews', 'playtime_hours')
    op.drop_column('reviews', 'platform')

