# services/platform_sync_service.py
"""
Platform sync service for cached library management.

Handles syncing PSN/Steam libraries to the database for fast retrieval.
"""
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
import logging

from ..models.user_platform_game import UserPlatformGame
from . import psn_service

logger = logging.getLogger(__name__)


def get_cached_games(
    db: Session, 
    user_id: int, 
    platform: str,
    status: Optional[str] = None,
    include_hidden: bool = False
) -> List[UserPlatformGame]:
    """
    Get cached platform games from database.
    
    Args:
        db: Database session
        user_id: User ID
        platform: Platform ('psn' or 'steam')
        status: Optional filter by status ('pending', 'imported', 'hidden')
        include_hidden: If True, include hidden games
        
    Returns:
        List of UserPlatformGame objects
    """
    query = db.query(UserPlatformGame).filter(
        UserPlatformGame.user_id == user_id,
        UserPlatformGame.platform == platform
    )
    
    if status:
        query = query.filter(UserPlatformGame.status == status)
    elif not include_hidden:
        query = query.filter(UserPlatformGame.status != 'hidden')
    
    return query.order_by(UserPlatformGame.platform_name).all()


def get_game_by_platform_id(
    db: Session,
    user_id: int,
    platform: str,
    platform_id: str
) -> Optional[UserPlatformGame]:
    """Get a specific cached game by platform ID."""
    return db.query(UserPlatformGame).filter(
        UserPlatformGame.user_id == user_id,
        UserPlatformGame.platform == platform,
        UserPlatformGame.platform_id == platform_id
    ).first()


def sync_psn_library(
    db: Session,
    user_id: int,
    username: str,
    existing_igdb_ids: set
) -> Dict:
    """
    Sync PSN library to database.
    
    Fetches games from PSN, matches to IGDB, and stores/updates in database.
    Returns delta info (new/updated counts).
    
    Args:
        db: Database session
        user_id: User ID
        username: PSN username
        existing_igdb_ids: Set of IGDB IDs already in user's library
        
    Returns:
        {
            "new_count": int,
            "updated_count": int,
            "total_count": int,
            "new_games": List[dict]
        }
    """
    import time
    start_time = time.time()
    
    # Fetch games from PSN
    psn_games = psn_service.get_psn_games(username)
    
    # Get existing cached games
    existing_cache = {
        g.platform_id: g 
        for g in db.query(UserPlatformGame).filter(
            UserPlatformGame.user_id == user_id,
            UserPlatformGame.platform == 'psn'
        ).all()
    }
    
    new_games = []
    updated_games = []
    now = datetime.now(timezone.utc)
    
    for game in psn_games:
        platform_id = game.get("title_id", "")
        platform_name = game.get("name", "")
        image_url = game.get("image_url")
        playtime = game.get("play_duration_minutes", 0) or 0
        first_played = game.get("first_played")
        last_played = game.get("last_played")
        
        if platform_id in existing_cache:
            # Existing game - check for updates and re-evaluate status
            cached = existing_cache[platform_id]
            
            # Update playtime if changed
            if cached.playtime_minutes != playtime:
                cached.playtime_minutes = playtime
                cached.updated_at = now
                updated_games.append(cached)
            
            # Update last_played_at if provided and newer
            if last_played:
                # Normalize timezone for comparison
                last_played_utc = last_played
                if hasattr(last_played, 'tzinfo') and last_played.tzinfo is not None:
                    last_played_utc = last_played.replace(tzinfo=None)
                
                cached_last_played = cached.last_played_at
                if cached_last_played and hasattr(cached_last_played, 'tzinfo') and cached_last_played.tzinfo is not None:
                    cached_last_played = cached_last_played.replace(tzinfo=None)
                
                if not cached_last_played or last_played_utc > cached_last_played:
                    cached.last_played_at = last_played
                    if cached not in updated_games:
                        cached.updated_at = now
                        updated_games.append(cached)
            
            # Re-evaluate status based on library presence; preserve 'hidden'
            if cached.status != 'hidden':
                if cached.igdb_id and cached.igdb_id in existing_igdb_ids:
                    cached.status = 'imported'
                else:
                    cached.status = 'pending'
            
            cached.last_synced_at = now
        else:
            # New game - run IGDB matching
            igdb_id, igdb_name, igdb_cover, confidence, method = psn_service.match_game_to_igdb(
                db=db,
                platform_id=platform_id,
                platform_name=platform_name,
                first_played=first_played
            )
            
            # Check if already in library
            if igdb_id and igdb_id in existing_igdb_ids:
                status = 'imported'  # Already imported via different title_id or manually
            else:
                status = 'pending'
            
            new_game = UserPlatformGame(
                user_id=user_id,
                platform='psn',
                platform_id=platform_id,
                platform_name=platform_name,
                platform_image_url=image_url,
                igdb_id=igdb_id,
                igdb_name=igdb_name,
                igdb_cover_url=igdb_cover,
                match_confidence=confidence,
                match_method=method,
                status=status,
                playtime_minutes=playtime,
                first_played=first_played,
                last_played_at=last_played,
                last_synced_at=now
            )
            db.add(new_game)
            
            if status == 'pending':  # Only count unimported as "new"
                new_games.append(new_game)
    
    # Update platform link last_synced_at
    from ..models.user_platform_link import UserPlatformLink
    db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == 'psn'
    ).update({"last_synced_at": now})

    db.commit()
    
    elapsed = time.time() - start_time
    logger.info(
        f"[Sync] Synced PSN library for user {user_id}: "
        f"{len(new_games)} new, {len(updated_games)} updated, "
        f"{len(psn_games)} total in {elapsed:.2f}s"
    )
    
    return {
        "new_count": len(new_games),
        "updated_count": len(updated_games),
        "total_count": len(psn_games),
        "new_games": [g.to_dict() for g in new_games[:10]]  # First 10 for preview
    }


def update_game_status(
    db: Session,
    user_id: int,
    platform: str,
    platform_id: str,
    status: str
) -> Optional[UserPlatformGame]:
    """
    Update a game's status (pending, hidden, imported).
    
    Returns:
        Updated game or None if not found
    """
    game = get_game_by_platform_id(db, user_id, platform, platform_id)
    if not game:
        return None
    
    game.status = status
    game.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    logger.info(f"[Sync] Updated status for {platform_id}: {status}")
    return game


def update_game_match(
    db: Session,
    user_id: int,
    platform: str,
    platform_id: str,
    igdb_id: int,
    igdb_name: str,
    igdb_cover_url: Optional[str] = None
) -> Optional[UserPlatformGame]:
    """
    Update a game's IGDB match (manual user match).
    
    Returns:
        Updated game or None if not found
    """
    game = get_game_by_platform_id(db, user_id, platform, platform_id)
    if not game:
        return None
    
    game.igdb_id = igdb_id
    game.igdb_name = igdb_name
    game.igdb_cover_url = igdb_cover_url
    game.match_method = 'user_match'
    game.match_confidence = 1.0
    game.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    logger.info(f"[Sync] Updated match for {platform_id} -> IGDB {igdb_id}")
    return game


def migrate_preferences(db: Session, user_id: int) -> int:
    """
    Migrate user_psn_preferences to user_platform_games.
    
    Call this during sync to ensure old preferences are preserved.
    
    Returns:
        Number of preferences migrated
    """
    from ..models.user_psn_preference import UserPsnPreference
    
    prefs = db.query(UserPsnPreference).filter(
        UserPsnPreference.user_id == user_id
    ).all()
    
    count = 0
    for pref in prefs:
        game = get_game_by_platform_id(db, user_id, 'psn', pref.platform_id)
        if game:
            if pref.action == 'skipped':
                game.status = 'hidden'
                game.updated_at = datetime.now(timezone.utc)
            elif pref.action == 'matched' and pref.igdb_id:
                # Fetch IGDB data for the match
                from ..models.game import Game
                igdb_game = db.query(Game).filter(Game.igdb_id == pref.igdb_id).first()
                if igdb_game:
                    game.igdb_id = pref.igdb_id
                    game.igdb_name = igdb_game.name
                    game.igdb_cover_url = igdb_game.cover_image
                    game.match_method = 'user_match'
                    game.match_confidence = 1.0
                    game.updated_at = datetime.now(timezone.utc)
            count += 1
    
    db.commit()
    logger.info(f"[Sync] Migrated {count} preferences for user {user_id}")
    return count


def delete_platform_games(db: Session, user_id: int, platform: str) -> int:
    """
    Delete all cached games for a platform (on unlink).
    
    Returns:
        Number of games deleted
    """
    count = db.query(UserPlatformGame).filter(
        UserPlatformGame.user_id == user_id,
        UserPlatformGame.platform == platform
    ).delete()
    db.commit()
    logger.info(f"[Sync] Deleted {count} cached {platform} games for user {user_id}")
    return count
