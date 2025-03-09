"""add_bundles_field_to_game_model

Revision ID: 2854968ac07b
Revises: ecda1bc000d1
Create Date: 2025-03-09 21:32:47.219817

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2854968ac07b'
down_revision: Union[str, None] = 'ecda1bc000d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('bundles', sa.JSON(), nullable=True, comment='List of bundles this game is a part of'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('games', 'bundles')
    # ### end Alembic commands ###
