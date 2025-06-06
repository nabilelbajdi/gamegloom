"""Replace status and category with game_status and game_type

Revision ID: 0e902e3c206a
Revises: 716be201d68d
Create Date: 2025-03-09 06:25:34.553982

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e902e3c206a'
down_revision: Union[str, None] = '716be201d68d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('games', sa.Column('game_status', sa.Integer(), nullable=True, comment='Status enum (0=released, 2=alpha, 3=beta, etc)'))
    op.add_column('games', sa.Column('game_type', sa.Integer(), nullable=True, comment='Category enum (0=main_game, 1=dlc_addon, etc)'))
    op.drop_column('games', 'status')
    op.drop_column('games', 'category')
    op.drop_constraint('user_games_game_id_fkey', 'user_games', type_='foreignkey')
    op.create_foreign_key(None, 'user_games', 'games', ['game_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'user_games', type_='foreignkey')
    op.create_foreign_key('user_games_game_id_fkey', 'user_games', 'games', ['game_id'], ['id'], ondelete='CASCADE')
    op.add_column('games', sa.Column('category', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('games', sa.Column('status', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.drop_column('games', 'game_type')
    op.drop_column('games', 'game_status')
    # ### end Alembic commands ###
