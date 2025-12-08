#!/usr/bin/env python
"""
Update ALL stale games in the database.
This script is smarter than force_update - it checks how many games need updating
and processes them in batches with progress tracking.

Usage:
    # See stats only (no updates)
    python scripts/data_management/update_all_stale_games.py --dry-run
    
    # Update all stale games (older than 7 days)
    python scripts/data_management/update_all_stale_games.py
    
    # Update games older than 30 days only
    python scripts/data_management/update_all_stale_games.py --min-age 30
"""
import os
import sys
import time
import argparse
import logging
from datetime import datetime, timedelta, timezone

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

sys.path.append(os.path.abspath('.'))

try:
    from backend.app.api.db_setup import init_db, get_db
    from backend.app.api.v1.core.services import (
        fetch_from_igdb, process_igdb_data, get_game_by_igdb_id, update_game
    )
    from backend.app.api.v1.models.game import Game
    from sqlalchemy import func
except ImportError as e:
    logger.error(f"Failed to import: {e}")
    logger.error("Run from src/ directory")
    sys.exit(1)


def get_stats(db):
    """Get database statistics."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    total = db.query(func.count(Game.id)).scalar()
    stale_7d = db.query(func.count(Game.id)).filter(
        Game.updated_at < now - timedelta(days=7)
    ).scalar()
    stale_30d = db.query(func.count(Game.id)).filter(
        Game.updated_at < now - timedelta(days=30)
    ).scalar()
    
    oldest = db.query(Game.name, Game.updated_at).order_by(
        Game.updated_at.asc()
    ).first()
    
    return {
        'total': total,
        'stale_7d': stale_7d,
        'stale_30d': stale_30d,
        'oldest_name': oldest[0] if oldest else 'N/A',
        'oldest_date': oldest[1] if oldest else None
    }


def update_game_from_igdb(db, game) -> bool:
    """Update a single game. Returns True if successful."""
    try:
        igdb_data = fetch_from_igdb(game_id=game.igdb_id)
        if not igdb_data:
            return False
        
        if isinstance(igdb_data, list):
            igdb_data = igdb_data[0]
        
        processed = process_igdb_data(igdb_data)
        update_game(db, game.id, processed)
        return True
        
    except Exception as e:
        logger.error(f"Error updating {game.name}: {e}")
        return False


def update_all_stale(min_age_days: int = 7, batch_size: int = 100, dry_run: bool = False):
    """Update all games older than min_age_days."""
    init_db()
    db = next(get_db())
    
    try:
        stats = get_stats(db)
        print("\n" + "=" * 50)
        print("DATABASE STATS")
        print("=" * 50)
        print(f"Total games:        {stats['total']}")
        print(f"Stale (>7 days):    {stats['stale_7d']}")
        print(f"Very stale (>30d):  {stats['stale_30d']}")
        print(f"Oldest:             {stats['oldest_name']} ({stats['oldest_date']})")
        print("=" * 50)
        
        if dry_run:
            print("\n[DRY RUN] No updates will be made.")
            return
        
        # Get stale games
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        threshold = now - timedelta(days=min_age_days)
        
        stale_games = db.query(Game).filter(
            Game.updated_at < threshold
        ).order_by(Game.updated_at.asc()).all()
        
        total_stale = len(stale_games)
        if total_stale == 0:
            print("\nNo stale games to update!")
            return
        
        print(f"\nUpdating {total_stale} games older than {min_age_days} days...")
        print(f"Estimated time: {(total_stale * 0.35) / 60:.1f} minutes\n")
        
        success = 0
        failed = 0
        start_time = time.time()
        
        for i, game in enumerate(stale_games):
            if update_game_from_igdb(db, game):
                success += 1
            else:
                failed += 1
            
            # Progress update
            if (i + 1) % batch_size == 0:
                db.commit()
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed
                remaining = (total_stale - i - 1) / rate
                print(f"Progress: {i+1}/{total_stale} ({success} ok, {failed} fail) - ETA: {remaining/60:.1f}m")
            
            time.sleep(0.3)  # Rate limit
        
        db.commit()
        
        elapsed = time.time() - start_time
        print("\n" + "=" * 50)
        print("COMPLETE")
        print("=" * 50)
        print(f"Updated: {success}")
        print(f"Failed:  {failed}")
        print(f"Time:    {elapsed/60:.1f} minutes")
        print("=" * 50)
        
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Update all stale games")
    parser.add_argument('--dry-run', action='store_true', help='Show stats only, no updates')
    parser.add_argument('--min-age', type=int, default=7, help='Minimum age in days (default: 7)')
    
    args = parser.parse_args()
    update_all_stale(min_age_days=args.min_age, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
