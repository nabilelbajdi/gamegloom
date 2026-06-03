"""add community_rating to games

Separate GameGloom community rating from IGDB's total_rating so IGDB re-syncs
never wipe it. Backfilled from the existing reviews table (stars 1-5 -> 0-100).

Revision ID: d1e2f3a4b5c6
Revises: c9d0e1f2a3b4
Create Date: 2026-06-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('games', sa.Column('community_rating', sa.Float(), nullable=True))
    op.add_column('games', sa.Column('community_rating_count', sa.Integer(), nullable=True, server_default='0'))

    # Backfill from existing reviews: average stars (1-5) -> 0-100 scale, plus count.
    op.execute(
        """
        UPDATE games g SET
            community_rating = sub.avg_rating,
            community_rating_count = sub.cnt
        FROM (
            SELECT game_id, (AVG(rating) / 5.0) * 100 AS avg_rating, COUNT(*) AS cnt
            FROM reviews
            GROUP BY game_id
        ) sub
        WHERE g.id = sub.game_id
        """
    )


def downgrade() -> None:
    op.drop_column('games', 'community_rating_count')
    op.drop_column('games', 'community_rating')
