"""add_public_lists_and_likes_support

Revision ID: 1c42c1077661
Revises: 8895bc238dc4
Create Date: 2025-12-27 11:50:33.693550

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c42c1077661'
down_revision: Union[str, None] = '8895bc238dc4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create list_likes table
    op.create_table('list_likes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('list_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['list_id'], ['user_lists.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add new columns to user_lists
    op.add_column('user_lists', sa.Column('is_public', sa.Boolean(), nullable=True))
    op.add_column('user_lists', sa.Column('is_featured', sa.Boolean(), nullable=True))
    op.add_column('user_lists', sa.Column('likes_count', sa.Integer(), nullable=True))
    
    # Set default values for existing rows
    op.execute("UPDATE user_lists SET is_public = false WHERE is_public IS NULL")
    op.execute("UPDATE user_lists SET is_featured = false WHERE is_featured IS NULL")
    op.execute("UPDATE user_lists SET likes_count = 0 WHERE likes_count IS NULL")
    
    # Make columns non-nullable
    op.alter_column('user_lists', 'is_public', nullable=False)
    op.alter_column('user_lists', 'is_featured', nullable=False)
    op.alter_column('user_lists', 'likes_count', nullable=False)


def downgrade() -> None:
    op.drop_column('user_lists', 'likes_count')
    op.drop_column('user_lists', 'is_featured')
    op.drop_column('user_lists', 'is_public')
    op.drop_table('list_likes')
