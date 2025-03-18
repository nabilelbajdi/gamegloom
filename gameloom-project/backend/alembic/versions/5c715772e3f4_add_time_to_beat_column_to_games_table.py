"""Add time_to_beat column to games table

Revision ID: 5c715772e3f4
Revises: e13d62ca857f
Create Date: 2025-03-18 18:35:40.086329

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5c715772e3f4'
down_revision: Union[str, None] = 'e13d62ca857f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('time_to_beat', sa.JSON(), nullable=True, comment='Time to beat data (hastily, normally, completely)'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('games', 'time_to_beat')
    # ### end Alembic commands ###
