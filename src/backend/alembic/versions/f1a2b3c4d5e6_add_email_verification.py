"""add email verification

Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2026-05-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_verified to users, default existing rows to true
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False))
    op.execute("UPDATE users SET is_verified = true")

    # Create email_verifications table
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'email_verifications' not in inspector.get_table_names():
        op.create_table(
            'email_verifications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('token', sa.String(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_email_verifications_token', 'email_verifications', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_email_verifications_token', table_name='email_verifications')
    op.drop_table('email_verifications')
    op.drop_column('users', 'is_verified')
