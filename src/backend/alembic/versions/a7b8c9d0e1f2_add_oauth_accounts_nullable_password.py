"""add oauth accounts and make password nullable

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-06-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # OAuth users have no password, so the column must allow NULL.
    op.alter_column('users', 'hashed_password', existing_type=sa.String(), nullable=True)

    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'user_oauth_accounts' not in inspector.get_table_names():
        op.create_table(
            'user_oauth_accounts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('provider', sa.String(length=20), nullable=False),
            sa.Column('provider_account_id', sa.String(length=255), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('provider', 'provider_account_id', name='uq_oauth_provider_account'),
        )
        op.create_index('ix_user_oauth_accounts_user_id', 'user_oauth_accounts', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_user_oauth_accounts_user_id', table_name='user_oauth_accounts')
    op.drop_table('user_oauth_accounts')
    # Existing OAuth-only users would have NULL passwords; backfill before tightening.
    op.execute("UPDATE users SET hashed_password = '' WHERE hashed_password IS NULL")
    op.alter_column('users', 'hashed_password', existing_type=sa.String(), nullable=False)
