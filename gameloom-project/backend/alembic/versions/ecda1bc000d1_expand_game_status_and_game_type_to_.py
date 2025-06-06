"""Expand game_status and game_type to include names

Revision ID: ecda1bc000d1
Revises: a29d1af0ae2c
Create Date: 2025-03-09 06:55:55.888010

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ecda1bc000d1'
down_revision: Union[str, None] = 'a29d1af0ae2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('game_status_id', sa.Integer(), nullable=True, comment='Game status ID'))
    op.add_column('games', sa.Column('game_status_name', sa.String(), nullable=True, comment='Game status name (released, alpha, beta, etc)'))
    op.add_column('games', sa.Column('game_type_id', sa.Integer(), nullable=True, comment='Game type ID'))
    op.add_column('games', sa.Column('game_type_name', sa.String(), nullable=True, comment='Game type name (main_game, dlc_addon, etc)'))
    op.drop_column('games', 'game_type')
    op.drop_column('games', 'game_status')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('game_status', sa.INTEGER(), autoincrement=False, nullable=True, comment='Status enum (0=released, 2=alpha, 3=beta, etc)'))
    op.add_column('games', sa.Column('game_type', sa.INTEGER(), autoincrement=False, nullable=True, comment='Category enum (0=main_game, 1=dlc_addon, etc)'))
    op.drop_column('games', 'game_type_name')
    op.drop_column('games', 'game_type_id')
    op.drop_column('games', 'game_status_name')
    op.drop_column('games', 'game_status_id')
    # ### end Alembic commands ###
