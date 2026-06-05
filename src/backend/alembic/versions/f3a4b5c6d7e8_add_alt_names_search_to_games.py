"""add alt_names_search to games

Normalized alternative names joined as "|tok1|tok2|" so a platform name that matches
an alt/regional/abbreviated name (not the primary) resolves via LIKE '%|tok|%'.
Populated by the IGDB write path; existing rows fill on the next populate_games run.

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-06-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f3a4b5c6d7e8'
down_revision: Union[str, None] = 'e2f3a4b5c6d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('games', sa.Column('alt_names_search', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('games', 'alt_names_search')
