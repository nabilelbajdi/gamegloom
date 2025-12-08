#!/usr/bin/env python
"""
Force update games from IGDB.
This script allows immediate updating of specific games or batch updating of stale games.

Usage:
    # Update specific games by IGDB ID
    python scripts/data_management/force_update_games.py --ids 119171,1942,26192

    # Update all games not updated in N days
    python scripts/data_management/force_update_games.py --days 3

    # Update all games (full refresh) - use with caution
    python scripts/data_management/force_update_games.py --all --limit 1000
"""
import os
import sys
import time
import argparse
import logging
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the project root to the Python path
sys.path.append(os.path.abspath('.'))

try:
    from backend.app.api.settings import settings
    from backend.app.api.db_setup import init_db, get_db
    from backend.app.api.v1.core.services import (
        fetch_from_igdb, 
        process_igdb_data, 
        get_game_by_igdb_id, 
        update_game, 
        create_game,
        IGDB_GAME_FIELDS
    )
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    logger.error("Make sure you're running this from the src/ directory")
    sys.exit(1)


def update_single_game(db, igdb_id: int) -> bool:
    """
    Fetch and update a single game by IGDB ID.
    Returns True if successful, False otherwise.
    """
    try:
        logger.info(f"Fetching game {igdb_id} from IGDB...")
        igdb_data = fetch_from_igdb(game_id=igdb_id)
        
        if not igdb_data:
            logger.warning(f"No data returned from IGDB for game {igdb_id}")
            return False
        
        # Handle list response
        if isinstance(igdb_data, list):
            igdb_data = igdb_data[0] if igdb_data else None
        
        if not igdb_data:
            logger.warning(f"Empty data for game {igdb_id}")
            return False
            
        processed_data = process_igdb_data(igdb_data)
        
        # Check if game exists
        existing_game = get_game_by_igdb_id(db, igdb_id)
        
        if existing_game:
            # Log what's changing
            old_date = existing_game.first_release_date
            new_date = processed_data.first_release_date
            if old_date != new_date:
                logger.info(f"  Release date changing: {old_date} -> {new_date}")
            
            # Update existing game
            update_game(db, existing_game.id, processed_data)
            logger.info(f"✓ Updated: {processed_data.name} (IGDB: {igdb_id})")
        else:
            # Create new game
            create_game(db, processed_data)
            logger.info(f"✓ Created: {processed_data.name} (IGDB: {igdb_id})")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ Error updating game {igdb_id}: {str(e)}")
        return False


def update_games_by_ids(igdb_ids: list[int]):
    """Update specific games by their IGDB IDs."""
    logger.info(f"Updating {len(igdb_ids)} games by ID...")
    
    init_db()
    db = next(get_db())
    
    success_count = 0
    fail_count = 0
    
    try:
        for igdb_id in igdb_ids:
            if update_single_game(db, igdb_id):
                success_count += 1
            else:
                fail_count += 1
            
            # Rate limiting - IGDB allows ~4 requests per second
            time.sleep(0.3)
        
        db.commit()
        
    finally:
        db.close()
    
    logger.info(f"\n=== Summary ===")
    logger.info(f"Updated: {success_count}")
    logger.info(f"Failed: {fail_count}")


def update_stale_games(days: int, limit: int = 500):
    """Update all games that haven't been updated in N days."""
    logger.info(f"Finding games not updated in {days} days (limit: {limit})...")
    
    init_db()
    db = next(get_db())
    
    try:
        from backend.app.api.v1.models.game import Game
        
        threshold = datetime.utcnow() - timedelta(days=days)
        
        stale_games = db.query(Game).filter(
            Game.updated_at < threshold
        ).order_by(Game.updated_at.asc()).limit(limit).all()
        
        logger.info(f"Found {len(stale_games)} stale games")
        
        if not stale_games:
            logger.info("No stale games found!")
            return
        
        success_count = 0
        fail_count = 0
        
        for game in stale_games:
            if update_single_game(db, game.igdb_id):
                success_count += 1
            else:
                fail_count += 1
            
            # Rate limiting
            time.sleep(0.3)
            
            # Commit periodically
            if (success_count + fail_count) % 50 == 0:
                db.commit()
                logger.info(f"Progress: {success_count + fail_count}/{len(stale_games)}")
        
        db.commit()
        
        logger.info(f"\n=== Summary ===")
        logger.info(f"Updated: {success_count}")
        logger.info(f"Failed: {fail_count}")
        
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Force update games from IGDB",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Update GTA VI (IGDB ID: 119171)
    python scripts/data_management/force_update_games.py --ids 119171
    
    # Update multiple games
    python scripts/data_management/force_update_games.py --ids 119171,1942,26192
    
    # Update all games older than 3 days
    python scripts/data_management/force_update_games.py --days 3
    
    # Update 1000 oldest games
    python scripts/data_management/force_update_games.py --days 0 --limit 1000
        """
    )
    
    parser.add_argument(
        '--ids', 
        type=str, 
        help='Comma-separated list of IGDB IDs to update (e.g., 119171,1942)'
    )
    parser.add_argument(
        '--days', 
        type=int, 
        help='Update games not refreshed in N days'
    )
    parser.add_argument(
        '--limit', 
        type=int, 
        default=500,
        help='Maximum number of games to update (default: 500)'
    )
    
    args = parser.parse_args()
    
    if not args.ids and args.days is None:
        parser.print_help()
        print("\nError: Must specify either --ids or --days")
        sys.exit(1)
    
    if args.ids:
        # Parse comma-separated IDs
        try:
            igdb_ids = [int(id.strip()) for id in args.ids.split(',')]
        except ValueError:
            print("Error: --ids must be comma-separated integers")
            sys.exit(1)
        
        update_games_by_ids(igdb_ids)
    
    elif args.days is not None:
        update_stale_games(args.days, args.limit)


if __name__ == "__main__":
    main()
