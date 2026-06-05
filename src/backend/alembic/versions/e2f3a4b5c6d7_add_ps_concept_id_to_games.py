"""add ps_concept_id to games

Sony concept id parsed from IGDB external_games PlayStation URLs. Bridges a PSN
title_id -> psn_title_lookup.concept_id -> games.ps_concept_id for exact matching.
Populated going forward by the IGDB write path; backfill existing rows with
scripts/data_management/backfill_ps_concept.py.

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-06-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e2f3a4b5c6d7'
down_revision: Union[str, None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('games', sa.Column('ps_concept_id', sa.Integer(), nullable=True))
    op.create_index('ix_games_ps_concept_id', 'games', ['ps_concept_id'])


def downgrade() -> None:
    op.drop_index('ix_games_ps_concept_id', table_name='games')
    op.drop_column('games', 'ps_concept_id')
