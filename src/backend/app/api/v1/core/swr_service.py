# swr_service.py
"""Stale-While-Revalidate (SWR) pattern for game data freshness."""

from datetime import datetime, UTC
from sqlalchemy.orm import Session
import logging

from ..models import game
from .igdb_service import fetch_from_igdb, process_igdb_data, meets_quality_requirements

logger = logging.getLogger(__name__)


def is_stale(db_game: game.Game, max_age_hours: int = 24) -> bool:
    """Check if a game's data is stale and needs refreshing.
    
    Args:
        db_game: The game object to check
        max_age_hours: Maximum age in hours before data is considered stale (default: 24)
    
    Returns:
        True if the game data is stale and should be refreshed
    """
    if not db_game or not db_game.updated_at:
        return True
    
    age = datetime.now(UTC) - db_game.updated_at.replace(tzinfo=UTC)
    return age.total_seconds() > (max_age_hours * 3600)


async def refresh_game_async(igdb_id: int) -> bool:
    """Refresh a game's data from IGDB in the background.
    
    This is designed to be called as a background task via asyncio.create_task().
    It creates its own database session to avoid issues with the request session
    being closed before the task completes.
    
    Args:
        igdb_id: The IGDB ID of the game to refresh
        
    Returns:
        True if refresh was successful, False otherwise
    """
    # Import here to avoid circular imports
    from ...db_setup import SessionLocal
    from .game_service import get_game_by_igdb_id, update_game, create_game
    
    db = SessionLocal()
    try:
        logger.info(f"[SWR] Background refresh starting for IGDB ID: {igdb_id}")
        
        # Fetch fresh data from IGDB
        igdb_data = fetch_from_igdb(game_id=igdb_id)
        if not igdb_data:
            logger.warning(f"[SWR] No data returned from IGDB for game {igdb_id}")
            return False
        
        # Handle list response
        if isinstance(igdb_data, list):
            igdb_data = igdb_data[0] if igdb_data else None
        
        if not igdb_data:
            return False
        
        # Process the data
        processed_data = process_igdb_data(igdb_data)
        
        # Find and update the existing game
        existing_game = get_game_by_igdb_id(db, igdb_id)
        if existing_game:
            update_game(db, existing_game.id, processed_data)
            existing_game.updated_at = datetime.now(UTC)
            db.commit()
            logger.info(f"[SWR] Successfully refreshed: {processed_data.name} (IGDB: {igdb_id})")
        else:
            if meets_quality_requirements(processed_data):
                create_game(db, processed_data)
                db.commit()
                logger.info(f"[SWR] Created new game: {processed_data.name} (IGDB: {igdb_id})")
            else:
                logger.info(f"[SWR] Skipped creating '{processed_data.name}': doesn't meet quality requirements")
                return False
        
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"[SWR] Error refreshing game {igdb_id}: {str(e)}")
        return False
    finally:
        db.close()
