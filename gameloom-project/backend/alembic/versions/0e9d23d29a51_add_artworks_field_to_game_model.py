"""Add artworks field to Game model

Revision ID: 0e9d23d29a51
Revises: bf30d49c639c
Create Date: 2025-02-28 18:14:54.878421

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e9d23d29a51'
down_revision: Union[str, None] = 'bf30d49c639c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('artworks', sa.JSON(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('games', 'artworks')
    # ### end Alembic commands ###
