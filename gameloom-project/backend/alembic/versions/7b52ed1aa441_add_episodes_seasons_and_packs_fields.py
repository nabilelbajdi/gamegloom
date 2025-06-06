"""Add episodes, seasons, and packs fields

Revision ID: 7b52ed1aa441
Revises: e6b95e875e4a
Create Date: 2025-03-18 11:48:19.810469

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b52ed1aa441'
down_revision: Union[str, None] = 'e6b95e875e4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('episodes', sa.JSON(), nullable=True, comment='List of episodes of this game'))
    op.add_column('games', sa.Column('seasons', sa.JSON(), nullable=True, comment='List of seasons of this game'))
    op.add_column('games', sa.Column('packs', sa.JSON(), nullable=True, comment='List of packs/add-ons for this game'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('games', 'packs')
    op.drop_column('games', 'seasons')
    op.drop_column('games', 'episodes')
    # ### end Alembic commands ###
