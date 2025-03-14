#!/usr/bin/env python
"""
Check the status of the IGDB import and handle any issues.
This script can be used to:
1. Count the number of games in the database
2. Check for duplicate games
3. Verify data integrity
"""
import os
import sys
import logging
import argparse
from sqlalchemy import func, select

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("igdb_check.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Add the project root to the Python path
sys.path.append(os.path.abspath('.'))

# Import the necessary modules from the backend
try:
    from backend.app.api.db_setup import init_db, get_db
    from backend.app.api.v1.models.game import Game
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    sys.exit(1)

def count_games(db):
    """Count the number of games in the database"""
    count = db.scalar(select(func.count()).select_from(Game))
    logger.info(f"Total games in database: {count}")
    return count

def check_duplicates(db):
    """Check for duplicate games in the database"""
    # Query for duplicate IGDB IDs
    duplicate_query = select(
        Game.igdb_id, 
        func.count(Game.igdb_id).label('count')
    ).group_by(
        Game.igdb_id
    ).having(
        func.count(Game.igdb_id) > 1
    )
    
    duplicates = db.execute(duplicate_query).all()
    
    if duplicates:
        logger.warning(f"Found {len(duplicates)} duplicate IGDB IDs")
        for igdb_id, count in duplicates:
            logger.warning(f"IGDB ID {igdb_id} appears {count} times")
        return duplicates
    else:
        logger.info("No duplicate IGDB IDs found")
        return []

def check_data_integrity(db, sample_size=100):
    """Check data integrity for a sample of games"""
    # Get a sample of games
    sample = db.execute(
        select(Game).order_by(func.random()).limit(sample_size)
    ).scalars().all()
    
    issues = 0
    
    for game in sample:
        # Check for essential fields
        if not game.name:
            logger.warning(f"Game ID {game.id} (IGDB ID {game.igdb_id}) has no name")
            issues += 1
            
        if not game.cover_image and game.first_release_date:
            # Only flag missing cover images for released games
            logger.warning(f"Game '{game.name}' (ID {game.id}) has no cover image")
            issues += 1
    
    if issues:
        logger.warning(f"Found {issues} data integrity issues in sample of {sample_size} games")
    else:
        logger.info(f"No data integrity issues found in sample of {sample_size} games")
    
    return issues

def fix_duplicates(db):
    """Fix duplicate games in the database"""
    duplicates = check_duplicates(db)
    
    if not duplicates:
        return 0
    
    fixed = 0
    
    for igdb_id, count in duplicates:
        # Get all duplicates for this IGDB ID
        dupe_games = db.execute(
            select(Game).where(Game.igdb_id == igdb_id)
        ).scalars().all()
        
        # Sort by created_at (oldest first)
        dupe_games.sort(key=lambda g: g.created_at)
        
        # Keep the first one, delete the rest
        for game in dupe_games[1:]:
            logger.info(f"Deleting duplicate game: {game.name} (ID {game.id}, IGDB ID {game.igdb_id})")
            db.delete(game)
            fixed += 1
    
    db.commit()
    logger.info(f"Fixed {fixed} duplicate games")
    return fixed

def main():
    parser = argparse.ArgumentParser(description="Check the status of the IGDB import")
    parser.add_argument("--count", action="store_true", help="Count the number of games")
    parser.add_argument("--check-duplicates", action="store_true", help="Check for duplicate games")
    parser.add_argument("--fix-duplicates", action="store_true", help="Fix duplicate games")
    parser.add_argument("--check-integrity", action="store_true", help="Check data integrity")
    parser.add_argument("--sample-size", type=int, default=100, help="Sample size for integrity check")
    args = parser.parse_args()
    
    # Initialize the database
    logger.info("Initializing database connection")
    init_db()
    
    # Create a database session
    db = next(get_db())
    
    try:
        # Run the requested checks
        if args.count or not any([args.check_duplicates, args.fix_duplicates, args.check_integrity]):
            count_games(db)
            
        if args.check_duplicates:
            check_duplicates(db)
            
        if args.fix_duplicates:
            fix_duplicates(db)
            
        if args.check_integrity:
            check_data_integrity(db, args.sample_size)
            
    except Exception as e:
        logger.error(f"Error checking database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 