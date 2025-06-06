"""add avatar field to user model

Revision ID: 30e5fabac901
Revises: 0e9d23d29a51
Create Date: 2025-03-02 21:00:02.099817

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '30e5fabac901'
down_revision: Union[str, None] = '0e9d23d29a51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('avatar', sa.String(length=255), nullable=True))
    op.execute("UPDATE users SET avatar = '/images/default-avatar.svg' WHERE avatar IS NULL")
    op.alter_column('users', 'avatar',
                    existing_type=sa.String(length=255),
                    nullable=False,
                    server_default='/images/default-avatar.svg')

def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'avatar')
    # ### end Alembic commands ###
