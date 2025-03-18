"""Add editions and in_bundles fields

Revision ID: a92c964c8f71
Revises: 7b52ed1aa441
Create Date: 2025-03-18 12:32:24.429944

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a92c964c8f71'
down_revision: Union[str, None] = '7b52ed1aa441'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('editions', sa.JSON(), nullable=True, comment='Different editions of this game'))
    op.add_column('games', sa.Column('in_bundles', sa.JSON(), nullable=True, comment='Bundles that this game is included in'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('games', 'in_bundles')
    op.drop_column('games', 'editions')
    # ### end Alembic commands ###
