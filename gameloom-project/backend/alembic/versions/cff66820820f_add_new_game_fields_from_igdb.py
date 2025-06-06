"""Add new game fields from IGDB

Revision ID: cff66820820f
Revises: 30e5fabac901
Create Date: 2025-03-08 23:39:15.462072

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cff66820820f'
down_revision: Union[str, None] = '30e5fabac901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('dlcs', sa.JSON(), nullable=True, comment='List of DLCs for this game'))
    op.add_column('games', sa.Column('expansions', sa.JSON(), nullable=True, comment='List of expansions for this game'))
    op.add_column('games', sa.Column('remakes', sa.JSON(), nullable=True, comment='List of remakes for this game'))
    op.add_column('games', sa.Column('remasters', sa.JSON(), nullable=True, comment='List of remasters for this game'))
    op.add_column('games', sa.Column('parent_game', sa.JSON(), nullable=True, comment='Parent game if this is DLC/expansion'))
    op.add_column('games', sa.Column('slug', sa.String(), nullable=True))
    op.add_column('games', sa.Column('status', sa.String(), nullable=True))
    op.add_column('games', sa.Column('category', sa.String(), nullable=True))
    op.add_column('games', sa.Column('franchise', sa.String(), nullable=True))
    op.add_column('games', sa.Column('franchises', sa.JSON(), nullable=True))
    op.add_column('games', sa.Column('collections', sa.JSON(), nullable=True))
    op.add_column('games', sa.Column('alternative_names', sa.JSON(), nullable=True))
    op.add_column('games', sa.Column('keywords', sa.JSON(), nullable=True))
    op.add_column('games', sa.Column('game_status', sa.String(), nullable=True))
    op.add_column('games', sa.Column('game_type', sa.String(), nullable=True))
    op.create_index(op.f('ix_games_slug'), 'games', ['slug'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_games_slug'), table_name='games')
    op.drop_column('games', 'game_type')
    op.drop_column('games', 'game_status')
    op.drop_column('games', 'keywords')
    op.drop_column('games', 'alternative_names')
    op.drop_column('games', 'collections')
    op.drop_column('games', 'franchises')
    op.drop_column('games', 'franchise')
    op.drop_column('games', 'category')
    op.drop_column('games', 'status')
    op.drop_column('games', 'slug')
    op.drop_column('games', 'parent_game')
    op.drop_column('games', 'remasters')
    op.drop_column('games', 'remakes')
    op.drop_column('games', 'expansions')
    op.drop_column('games', 'dlcs')
    # ### end Alembic commands ###
