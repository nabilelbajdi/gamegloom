"""drop is_featured from user_lists

The flag was only ever read for ordering and nothing could set it, so every row
was false. Featured status is now derived from the list itself (has a description
and enough games), which needs no stored column.

Revision ID: a5b6c7d8e9f0
Revises: f4b5c6d7e8a9
Create Date: 2026-07-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a5b6c7d8e9f0'
down_revision: Union[str, None] = 'f4b5c6d7e8a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = {col['name'] for col in inspector.get_columns('user_lists')}
    if 'is_featured' in columns:
        op.drop_column('user_lists', 'is_featured')


def downgrade() -> None:
    # No data to restore: the column was uniformly false before being dropped.
    op.add_column(
        'user_lists',
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
