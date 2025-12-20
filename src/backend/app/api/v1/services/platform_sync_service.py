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
from . import psn_service, steam_service
from ..models.game import Game
from ..models.user_game import UserGame, ImportSource


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


def _match_by_slug_local(
    db: Session,
    platform_name: str
) -> Tuple[Optional[int], Optional[str], Optional[str], Optional[float], Optional[str]]:
    """
    Fast local slug-based matching without API calls.
    
    This matches games by looking up slugs in the local Game table.
    Much faster than individual IGDB API calls - suitable for 1000+ games.
    
    Returns:
        (igdb_id, igdb_name, cover_url, confidence, method)
    """
    from ..core.matching_utils import generate_slug, slug_with_roman_numerals, clean_name, pick_best_match
    
    try:
        # Step 1: Slug matching
        slug = generate_slug(platform_name)
        candidates = db.query(Game).filter(
            (Game.slug == slug) | 
            (Game.slug.like(f"{slug}--%"))
        ).all()
        
        if candidates:
            game = pick_best_match(candidates)
            if game:
                confidence = 0.85 if game.slug == slug else 0.80
                return (game.igdb_id, game.name, game.cover_image, confidence, "slug")

        # Step 2: Roman numeral conversion
        roman_slug = slug_with_roman_numerals(slug)
        if roman_slug != slug:
            candidates = db.query(Game).filter(
                (Game.slug == roman_slug) | 
                (Game.slug.like(f"{roman_slug}--%"))
            ).all()
            
            if candidates:
                game = pick_best_match(candidates)
                if game:
                    return (game.igdb_id, game.name, game.cover_image, 0.80, "slug_roman")

        # Step 3: Partial name search (only for longer names)
        c_name = clean_name(platform_name)
        if len(c_name) >= 5:
            candidates = db.query(Game).filter(
                Game.name.ilike(f"{c_name}%")
            ).order_by(Game.igdb_id).limit(5).all()
            
            if candidates:
                game = candidates[0]
                return (game.igdb_id, game.name, game.cover_image, 0.60, "partial")

        return None, None, None, None, None
        
    except Exception as e:
        logger.warning(f"[Slug Match] Error matching {platform_name}: {e}")
        return None, None, None, None, None


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
    seen_platform_ids = set()
    now = datetime.now(timezone.utc)
    
    try:
        for game in psn_games:
            platform_id = game.get("title_id", "")
            if not platform_id or platform_id in seen_platform_ids:
                continue
            seen_platform_ids.add(platform_id)
            
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

        # Post-sync: Update playtimes for any games already in library
        update_library_stats(db, user_id, igdb_ids=existing_igdb_ids)

    except Exception as e:
        db.rollback()
        logger.error(f"[Sync] Critical error during PSN sync for user {user_id}: {e}")
        raise

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


def sync_steam_library(
    db: Session,
    user_id: int,
    steam_id: str,
    existing_igdb_ids: set
) -> Dict:
    """
    Sync Steam library to database.
    
    Fetches games from Steam API, matches to IGDB, and stores/updates in database.
    Returns delta info (new/updated counts).
    """
    import time
    start_time = time.time()
    
    # Fetch games from Steam
    steam_games = steam_service.get_owned_games(steam_id)
    
    # Get existing cached games
    existing_cache = {
        g.platform_id: g 
        for g in db.query(UserPlatformGame).filter(
            UserPlatformGame.user_id == user_id,
            UserPlatformGame.platform == 'steam'
        ).all()
    }
    
    new_games = []
    updated_games = []
    seen_platform_ids = set()
    now = datetime.now(timezone.utc)
    from ..core.matching_utils import is_non_game
    
    # Collect new games for batch processing
    new_game_data = []  # List of (platform_id, platform_name, playtime, last_played)
    
    try:
        # First pass: Update existing games and collect new games for batch matching
        for game in steam_games:
            platform_id = str(game.get("appid", ""))
            if not platform_id or platform_id in seen_platform_ids:
                continue
            seen_platform_ids.add(platform_id)
            
            platform_name = game.get("name", "")
        
            if is_non_game(platform_name):
                logger.debug(f"[Steam Sync] Skipping non-game: {platform_name} ({platform_id})")
                continue
                
            playtime = game.get("playtime_forever", 0) or 0

            # Steam returns rtime_last_played (Unix timestamp) when include_appinfo=1
            last_played_rtime = game.get("rtime_last_played")
            last_played = datetime.fromtimestamp(last_played_rtime, tz=timezone.utc) if last_played_rtime else None
            
            if platform_id in existing_cache:
                # Existing game - check for updates
                cached = existing_cache[platform_id]
                
                # Update playtime if changed
                if cached.playtime_minutes != playtime:
                    cached.playtime_minutes = playtime
                    cached.updated_at = now
                    updated_games.append(cached)
                
                # Update last_played_at if provided and newer
                if last_played:
                    # Normalize for comparison
                    last_played_utc = last_played.replace(tzinfo=None)
                    cached_last_played = cached.last_played_at
                    if cached_last_played and hasattr(cached_last_played, 'tzinfo') and cached_last_played.tzinfo is not None:
                        cached_last_played = cached_last_played.replace(tzinfo=None)
                    
                    if not cached_last_played or last_played_utc > cached_last_played:
                        cached.last_played_at = last_played
                        if cached not in updated_games:
                            cached.updated_at = now
                            updated_games.append(cached)
                
                # Re-evaluate status; preserve 'hidden'
                if cached.status != 'hidden':
                    if cached.igdb_id and cached.igdb_id in existing_igdb_ids:
                        cached.status = 'imported'
                    else:
                        cached.status = 'pending'
                
                cached.last_synced_at = now
            else:
                # Collect new game for batch processing
                new_game_data.append((platform_id, platform_name, playtime, last_played))
        
        # Batch match all new games at once (HUGE performance improvement!)
        if new_game_data:
            app_ids_to_match = [g[0] for g in new_game_data]
            logger.info(f"[Steam Sync] Batch matching {len(app_ids_to_match)} new games...")
            
            batch_results = steam_service.batch_match_steam_appids(app_ids_to_match)
            
            matched_count = 0
            unmatched_count = 0
            total_new = len(new_game_data)
            local_start = time.time()
            
            logger.info(f"[Steam Sync] Starting local slug matching for {total_new - len(batch_results)} unmatched games...")
            
            # Create records for new games with batch match results
            for idx, (platform_id, platform_name, playtime, last_played) in enumerate(new_game_data):
                # Check batch results - if not found, try local slug matching (FAST)
                # We skip the IGDB API call but still try to match via local DB
                if platform_id in batch_results:
                    igdb_id, igdb_name, igdb_cover, confidence, method = batch_results[platform_id]
                    matched_count += 1
                else:
                    # Try fast local slug matching (no API call, just DB query)
                    igdb_id, igdb_name, igdb_cover, confidence, method = _match_by_slug_local(
                        db=db,
                        platform_name=platform_name
                    )
                    if igdb_id:
                        matched_count += 1
                    else:
                        unmatched_count += 1
                
                # Progress logging every 200 games
                if (idx + 1) % 200 == 0:
                    logger.info(f"[Steam Sync] Progress: {idx + 1}/{total_new} games processed ({matched_count} matched)")


                
                # Check if already in library
                if igdb_id and igdb_id in existing_igdb_ids:
                    status = 'imported'
                else:
                    status = 'pending'
                
                # Generate Steam CDN cover URL for fallback display
                steam_cover_url = f"https://steamcdn-a.akamaihd.net/steam/apps/{platform_id}/library_600x900.jpg"
                
                new_game = UserPlatformGame(
                    user_id=user_id,
                    platform='steam',
                    platform_id=platform_id,
                    platform_name=platform_name,
                    platform_image_url=steam_cover_url,  # Steam cover for unmatched games
                    igdb_id=igdb_id,
                    igdb_name=igdb_name,
                    igdb_cover_url=igdb_cover,
                    match_confidence=confidence,
                    match_method=method,
                    status=status,
                    playtime_minutes=playtime,
                    last_played_at=last_played,
                    last_synced_at=now
                )
                db.add(new_game)
                
                if status == 'pending':
                    new_games.append(new_game)
            
            logger.info(f"[Steam Sync] Batch results: {matched_count} matched, {unmatched_count} unmatched (will show in 'Review' tab)")
    
        # Update platform link last_synced_at
        from ..models.user_platform_link import UserPlatformLink
        db.query(UserPlatformLink).filter(
            UserPlatformLink.user_id == user_id,
            UserPlatformLink.platform == 'steam'
        ).update({"last_synced_at": now})

        db.commit()
        
        # Post-sync: Update playtimes for any games already in library
        update_library_stats(db, user_id, igdb_ids=existing_igdb_ids)



    except Exception as e:
        db.rollback()
        logger.error(f"[Sync] Critical error during Steam sync for user {user_id}: {e}")
        raise

    elapsed = time.time() - start_time

    logger.info(
        f"[Sync] Synced Steam library for user {user_id}: "
        f"{len(new_games)} new, {len(updated_games)} updated, "
        f"{len(steam_games)} total in {elapsed:.2f}s"
    )
    
    return {
        "new_count": len(new_games),
        "updated_count": len(updated_games),
        "total_count": len(steam_games),
        "new_games": [g.to_dict() for g in new_games[:10]]
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


def update_library_stats(db: Session, user_id: int, igdb_ids: set = None):
    """
    Update UserGame playtime and last_played_at by aggregating from ALL platforms.
    """
    if igdb_ids is None:
        # Get all IGDB IDs in user's library
        igdb_ids = set(
            igdb_id for (igdb_id,) in db.query(Game.igdb_id).join(
                UserGame, UserGame.game_id == Game.id
            ).filter(UserGame.user_id == user_id).all()
        )

    if not igdb_ids:
        return

    for igdb_id in igdb_ids:
        # Sum playtime across ALL platforms (Steam + PSN)
        cached_entries = db.query(UserPlatformGame).filter(
            UserPlatformGame.user_id == user_id,
            UserPlatformGame.igdb_id == igdb_id
        ).all()

        if not cached_entries:
            continue

        total_playtime = sum(e.playtime_minutes or 0 for e in cached_entries)
        # Normalize datetimes to naive UTC for safe comparison across platforms
        def to_naive(dt):
            if dt and hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
                return dt.replace(tzinfo=None)
            return dt
        latest_played = max((to_naive(e.last_played_at) for e in cached_entries if e.last_played_at), default=None)

        # Update UserGame
        target_user_game = db.query(UserGame).join(Game).filter(
            UserGame.user_id == user_id,
            Game.igdb_id == igdb_id
        ).first()

        if target_user_game:
            target_user_game.playtime_minutes = total_playtime
            target_user_game.last_played_at = latest_played


    db.commit()


def import_games_to_library(db: Session, user_id: int, platform: str, games_data: List[Dict]) -> Tuple[int, int]:
    """
    Unified import logic for any platform.
    Handles aggregation and cross-platform status updates.
    
    Returns:
        (imported_count, skipped_count)
    """
    from ..core.igdb_service import fetch_from_igdb, process_igdb_data
    
    imported = 0
    skipped = 0
    now = datetime.now(timezone.utc)

    for game_req in games_data:
        igdb_id = game_req.get("igdb_id")
        platform_id = game_req.get("platform_id")
        list_type = game_req.get("list_type", "played")

        if not igdb_id:
            skipped += 1
            continue

        # 1. Find/Create Game entry
        game = db.query(Game).filter(Game.igdb_id == igdb_id).first()
        if not game:
            try:
                igdb_response = fetch_from_igdb(game_id=igdb_id)
                if igdb_response:
                    igdb_data = process_igdb_data(igdb_response[0])
                    if igdb_data:
                        game = Game(
                            igdb_id=igdb_data.igdb_id,
                            name=igdb_data.name,
                            slug=igdb_data.slug,
                            summary=igdb_data.summary,
                            cover_image=igdb_data.cover_image,
                            first_release_date=igdb_data.first_release_date,
                            rating=igdb_data.rating,
                            rating_count=igdb_data.rating_count or 0,
                        )
                        db.add(game)
                        db.flush()
            except Exception as e:
                logger.error(f"[Import] Failed to fetch IGDB game {igdb_id}: {e}")

        if not game:
            skipped += 1
            continue

        # 2. Check if already in library
        user_game = db.query(UserGame).filter(
            UserGame.user_id == user_id,
            UserGame.game_id == game.id
        ).first()

        # Get stats from platform cache
        cached_entries = db.query(UserPlatformGame).filter(
            UserPlatformGame.user_id == user_id,
            UserPlatformGame.igdb_id == igdb_id
        ).all()
        
        total_playtime = sum(e.playtime_minutes or 0 for e in cached_entries)
        # Normalize datetimes to naive UTC for safe comparison across platforms
        def to_naive(dt):
            if dt and hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
                return dt.replace(tzinfo=None)
            return dt
        latest_played = max((to_naive(e.last_played_at) for e in cached_entries if e.last_played_at), default=None)

        if user_game:
            # Already in library - just update stats (aggregation)
            user_game.playtime_minutes = total_playtime
            user_game.last_played_at = latest_played
            # Maybe update status if it was just "WANT_TO_PLAY" and we now have playtime?
            if list_type == 'played' and user_game.status == 'want_to_play':
                user_game.status = 'played'
            skipped += 1 # We count it as skipped for the "newly imported" count
        else:
            # New to library
            user_game = UserGame(
                user_id=user_id,
                game_id=game.id,
                status=list_type,
                import_source=platform,
                playtime_minutes=total_playtime,
                last_played_at=latest_played
            )
            db.add(user_game)
            imported += 1

        # 3. Mark ALL platforms as imported for this IGDB ID
        for entry in cached_entries:
            entry.status = 'imported'
            entry.updated_at = now

    db.commit()
    return imported, skipped

