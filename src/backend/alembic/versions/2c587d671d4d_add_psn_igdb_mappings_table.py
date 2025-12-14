"""add psn_igdb_mappings table

Revision ID: 2c587d671d4d
Revises: 69b38df6cb4d
Create Date: 2025-12-12 12:03:52.518837

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2c587d671d4d'
down_revision: Union[str, None] = '69b38df6cb4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'psn_igdb_mappings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trophy_id', sa.String(length=50), nullable=False),
        sa.Column('igdb_id', sa.Integer(), nullable=False),
        sa.Column('psn_name', sa.String(length=255), nullable=False),
        sa.Column('verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('use_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_psn_igdb_mappings_trophy_id', 'psn_igdb_mappings', ['trophy_id'], unique=True)
    op.create_index('ix_psn_igdb_mappings_igdb_id', 'psn_igdb_mappings', ['igdb_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_psn_igdb_mappings_igdb_id', table_name='psn_igdb_mappings')
    op.drop_index('ix_psn_igdb_mappings_trophy_id', table_name='psn_igdb_mappings')
    op.drop_table('psn_igdb_mappings')
