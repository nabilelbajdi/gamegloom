"""fix_foreign_keys_and_remove_redundant_fields

Revision ID: 716be201d68d
Revises: cff66820820f
Create Date: 2025-03-09 05:03:45.267958

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '716be201d68d'
down_revision: Union[str, None] = 'cff66820820f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, clean up orphaned records in reviews and user_games
    conn = op.get_bind()
    
    # Delete reviews that reference non-existent games
    conn.execute(sa.text("""
        DELETE FROM reviews 
        WHERE game_id NOT IN (SELECT id FROM games)
    """))
    
    # Delete user_games entries that reference non-existent games
    conn.execute(sa.text("""
        DELETE FROM user_games 
        WHERE game_id NOT IN (SELECT id FROM games)
    """))
    
    # Add foreign key constraints with CASCADE DELETE
    
    # For reviews table
    # First check if the constraint exists and drop it if it does
    conn.execute(sa.text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'reviews_game_id_fkey' AND conrelid = 'reviews'::regclass
            ) THEN
                ALTER TABLE reviews DROP CONSTRAINT reviews_game_id_fkey;
            END IF;
        END
        $$;
    """))
    
    # Add the constraint with CASCADE DELETE
    op.create_foreign_key(
        'reviews_game_id_fkey',
        'reviews',
        'games',
        ['game_id'],
        ['id'],
        ondelete='CASCADE'
    )
    
    # For user_games table
    # First check if the constraint exists and drop it if it does
    conn.execute(sa.text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'user_games_game_id_fkey' AND conrelid = 'user_games'::regclass
            ) THEN
                ALTER TABLE user_games DROP CONSTRAINT user_games_game_id_fkey;
            END IF;
        END
        $$;
    """))
    
    # Add the constraint with CASCADE DELETE
    op.create_foreign_key(
        'user_games_game_id_fkey',
        'user_games',
        'games',
        ['game_id'],
        ['id'],
        ondelete='CASCADE'
    )
    
    # Remove redundant fields from games table
    op.drop_column('games', 'game_type')
    op.drop_column('games', 'game_status')


def downgrade() -> None:
    # Add back the redundant fields
    op.add_column('games', sa.Column('game_type', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('games', sa.Column('game_status', sa.VARCHAR(), autoincrement=False, nullable=True))
    
    # Remove the CASCADE DELETE constraints and add back the original constraints
    
    # For reviews table
    op.drop_constraint('reviews_game_id_fkey', 'reviews', type_='foreignkey')
    op.create_foreign_key(
        'reviews_game_id_fkey',
        'reviews',
        'games',
        ['game_id'],
        ['id']
    )
    
    # For user_games table
    op.drop_constraint('user_games_game_id_fkey', 'user_games', type_='foreignkey')
    op.create_foreign_key(
        'user_games_game_id_fkey',
        'user_games',
        'games',
        ['game_id'],
        ['id']
    )
