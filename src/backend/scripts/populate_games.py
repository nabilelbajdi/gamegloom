#!/usr/bin/env python3
"""
Bulk Game Population Script

Fetches quality games from IGDB in batches and stores them in the database.

Two-tier quality filters:
- Released games: rating_count >= 10, has cover + summary
- Unreleased games: hypes >= 5, has cover + summary

Usage:
    cd src
    python -m backend.scripts.populate_games --batch released --limit 5000
    python -m backend.scripts.populate_games --batch anticipated --limit 500
    python -m backend.scripts.populate_games --batch all --limit 10000
"""
import argparse
import asyncio
import time
import logging
from datetime import datetime, UTC

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import after path setup
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.app.api.db_setup import SessionLocal
from backend.app.api.v1.core import services, schemas
from backend.app.api.settings import settings


# IGDB rate limit: 4 requests per second = 250ms between requests
RATE_LIMIT_DELAY = 0.3  # 300ms to be safe
BATCH_SIZE = 500  # IGDB max per request


def fetch_games_batch(query: str) -> list:
    """Fetch a batch of games from IGDB."""
    try:
        result = services.fetch_from_igdb(query=query)
        return result if isinstance(result, list) else [result] if result else []
    except Exception as e:
        logger.error(f"Error fetching batch: {e}")
        return []


def store_games(db, games_data: list) -> tuple[int, int, int]:
    """
    Process and store games in the database.
    
    Returns: (new_count, updated_count, skipped_count)
    """
    new_count = 0
    updated_count = 0
    skipped_count = 0
    
    for game_data in games_data:
        try:
            if not game_data.get('name'):
                continue
            
            processed = services.process_igdb_data(game_data)
            
            # Check quality requirements
            if not services.meets_quality_requirements(processed, log_warnings=False):
                skipped_count += 1
                continue
            
            # Check if exists
            existing = services.get_game_by_igdb_id(db, game_data['id'])
            
            if existing:
                services.update_game(db, existing.id, processed)
                updated_count += 1
            else:
                services.create_game(db, processed)
                new_count += 1
                
        except Exception as e:
            logger.error(f"Error processing game {game_data.get('name', 'Unknown')}: {e}")
            continue
    
    return new_count, updated_count, skipped_count


def populate_released_games(limit: int = 10000) -> dict:
    """
    Fetch released games with good ratings.
    
    Criteria: rating_count >= 10, has cover, main game only
    """
    logger.info(f"=== Populating Released Games (limit: {limit}) ===")
    
    db = SessionLocal()
    total_new = 0
    total_updated = 0
    total_skipped = 0
    offset = 0
    
    try:
        while offset < limit:
            batch_limit = min(BATCH_SIZE, limit - offset)
            
            # IGDB_GAME_FIELDS already starts with "fields ..." 
            # Simple query - let meets_quality_requirements() filter out mods/packs
            query = f"""
                {services.IGDB_GAME_FIELDS}
                where total_rating_count >= 1 
                    & cover != null 
                    & version_parent = null;
                sort total_rating_count desc;
                limit {batch_limit};
                offset {offset};
            """
            # category: 0=main game, 8=remake, 9=remaster, 10=expanded game, 11=port
            
            logger.info(f"Fetching batch at offset {offset}...")
            games = fetch_games_batch(query)
            
            if not games:
                logger.info("No more games found.")
                break
            
            new, updated, skipped = store_games(db, games)
            total_new += new
            total_updated += updated
            total_skipped += skipped
            
            logger.info(f"Batch: +{new} new, {updated} updated, {skipped} skipped | Total: {total_new} new")
            
            offset += batch_limit
            
            # Rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
    finally:
        db.close()
    
    return {
        "type": "released",
        "new": total_new,
        "updated": total_updated,
        "skipped": total_skipped
    }


def populate_anticipated_games(limit: int = 2000) -> dict:
    """
    Fetch anticipated/unreleased games with high hype.
    
    Criteria: hypes >= 5, future release date, has cover, main game only
    """
    logger.info(f"=== Populating Anticipated Games (limit: {limit}) ===")
    
    db = SessionLocal()
    total_new = 0
    total_updated = 0
    total_skipped = 0
    offset = 0
    current_timestamp = int(datetime.now(UTC).timestamp())
    
    try:
        while offset < limit:
            batch_limit = min(BATCH_SIZE, limit - offset)
            
            # Simple query - let meets_quality_requirements() filter
            query = f"""
                {services.IGDB_GAME_FIELDS}
                where hypes >= 5 
                    & first_release_date > {current_timestamp}
                    & cover != null 
                    & version_parent = null;
                sort hypes desc;
                limit {batch_limit};
                offset {offset};
            """
            
            logger.info(f"Fetching anticipated batch at offset {offset}...")
            games = fetch_games_batch(query)
            
            if not games:
                logger.info("No more anticipated games found.")
                break
            
            new, updated, skipped = store_games(db, games)
            total_new += new
            total_updated += updated
            total_skipped += skipped
            
            logger.info(f"Batch: +{new} new, {updated} updated, {skipped} skipped | Total: {total_new} new")
            
            offset += batch_limit
            time.sleep(RATE_LIMIT_DELAY)
            
    finally:
        db.close()
    
    return {
        "type": "anticipated", 
        "new": total_new,
        "updated": total_updated,
        "skipped": total_skipped
    }


def get_current_game_count() -> int:
    """Get current number of games in database."""
    db = SessionLocal()
    try:
        from backend.app.api.v1.models.game import Game
        return db.query(Game).count()
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description='Bulk populate game database from IGDB')
    parser.add_argument('--batch', choices=['released', 'anticipated', 'all'], 
                       default='all', help='Which batch to run')
    parser.add_argument('--limit', type=int, default=5000, 
                       help='Max games to fetch per batch')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be done without making changes')
    
    args = parser.parse_args()
    
    start_count = get_current_game_count()
    logger.info(f"Starting game count: {start_count}")
    
    if args.dry_run:
        logger.info("DRY RUN - No changes will be made")
        return
    
    results = []
    
    if args.batch in ['released', 'all']:
        result = populate_released_games(limit=args.limit)
        results.append(result)
    
    if args.batch in ['anticipated', 'all']:
        result = populate_anticipated_games(limit=min(args.limit, 2000))
        results.append(result)
    
    end_count = get_current_game_count()
    
    logger.info("=" * 50)
    logger.info("POPULATION COMPLETE")
    logger.info(f"Before: {start_count} games")
    logger.info(f"After: {end_count} games")
    logger.info(f"Net gain: {end_count - start_count} games")
    
    for r in results:
        logger.info(f"  {r['type']}: +{r['new']} new, {r['updated']} updated, {r['skipped']} skipped")


if __name__ == "__main__":
    main()
