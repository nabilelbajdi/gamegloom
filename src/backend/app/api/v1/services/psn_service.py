# services/psn_service.py
"""
PlayStation Network integration service.

Handles:
- PSN API access via psnawp library
- Game name cleaning and normalization
- IGDB matching logic
- Account linking/unlinking
"""
import re
import logging
import unicodedata
from datetime import datetime, timezone
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import Session

from ...settings import settings
from ..models.user_platform_link import UserPlatformLink, PlatformType
from ..models.game import Game
from ..models.psn_title_lookup import PsnTitleLookup
from ..core.matching_utils import (
    is_non_game, clean_name, clean_platform_name, generate_slug, 
    slug_with_roman_numerals, pick_best_match
)

logger = logging.getLogger(__name__)


class PSNServiceError(Exception):
    """Custom exception for PSN service errors."""
    pass


# Removed local is_non_game and patterns (now in matching_utils)



# ═══════════════════════════════════════════════════════════════════
# PSNAWP Client
# ═══════════════════════════════════════════════════════════════════

def _get_psnawp_client():
    """
    Get a PSNAWP client using the server-side NPSSO token.
    
    Returns:
        PSNAWP instance
        
    Raises:
        PSNServiceError: If PSN_NPSSO is not configured or invalid
    """
    from psnawp_api import PSNAWP
    
    npsso = settings.PSN_NPSSO
    if not npsso:
        raise PSNServiceError("PSN_NPSSO not configured in environment variables")
    
    try:
        return PSNAWP(npsso)
    except Exception as e:
        raise PSNServiceError(f"Failed to initialize PSN client: {e}")


def check_psn_health() -> dict:
    """
    Check if PSN integration is healthy (NPSSO token valid).
    
    Returns:
        {"status": "ok"} or {"status": "error", "message": "..."}
    """
    try:
        client = _get_psnawp_client()
        # Try to get client's own account to verify token
        client.me()
        return {"status": "ok"}
    except PSNServiceError as e:
        return {"status": "error", "message": str(e)}
    except Exception as e:
        return {"status": "error", "message": f"PSN API error: {e}"}


# Removed local cleaning/slug functions (now in matching_utils)



# ═══════════════════════════════════════════════════════════════════
# IGDB Matching
# ═══════════════════════════════════════════════════════════════════

# Removed local pick_best_match (now in matching_utils)



def match_game_to_igdb(
    db: Session,
    platform_id: str,
    platform_name: str,
    first_played: datetime = None
) -> tuple:
    """
    Match a PSN game to IGDB.
    
    Matching strategy:
    1. Sony title lookup table → exact name match
    2. Slug match with IGDB disambiguation suffixes
    3. Roman numeral conversion (3→iii)
    4. Partial name prefix match
    
    Args:
        db: Database session
        platform_id: PSN title_id (e.g., "CUSA00634_00")
        platform_name: Cleaned game name from PSN
        first_played: When user first played (for disambiguation)
    
    Returns:
        (igdb_id, igdb_name, cover_url, confidence, method) - any can be None
    """
    # Step 1: Sony title lookup table
    lookup = db.query(PsnTitleLookup).filter(
        PsnTitleLookup.title_id == platform_id
    ).first()
    
    if lookup:
        c_name = clean_name(lookup.name)
        
        # Exact match
        game = db.query(Game).filter(Game.name == c_name).first()
        if game:
            logger.debug(f"[Match] {platform_name} → {game.name} (exact)")
            return (game.igdb_id, game.name, game.cover_image, 0.99, "exact")
        
        # Case-insensitive exact
        game = db.query(Game).filter(Game.name.ilike(c_name)).first()
        if game:
            logger.debug(f"[Match] {platform_name} → {game.name} (iexact)")
            return (game.igdb_id, game.name, game.cover_image, 0.95, "iexact")
        
        # Use Sony lookup name for slug matching
        platform_name = c_name
    
    # Step 2: Slug matching
    slug = generate_slug(platform_name)
    
    candidates = db.query(Game).filter(
        (Game.slug == slug) | 
        (Game.slug.like(f"{slug}--_"))  # Match --1, --2, etc.
    ).all()
    
    if candidates:
        game = pick_best_match(candidates, first_played)
        if game:
            confidence = 0.85 if game.slug == slug else 0.80
            logger.debug(f"[Match] {platform_name} → {game.name} (slug)")
            return (game.igdb_id, game.name, game.cover_image, confidence, "slug")
    
    # Step 3: Roman numeral conversion
    roman_slug = slug_with_roman_numerals(slug)
    if roman_slug != slug:
        candidates = db.query(Game).filter(
            (Game.slug == roman_slug) | 
            (Game.slug.like(f"{roman_slug}--_"))
        ).all()
        
        if candidates:
            game = pick_best_match(candidates, first_played)
            if game:
                logger.debug(f"[Match] {platform_name} → {game.name} (slug_roman)")
                return (game.igdb_id, game.name, game.cover_image, 0.80, "slug_roman")
    
    # Step 4: Partial name search (prefix match, min 5 chars)
    c_name = clean_name(platform_name)
    if len(c_name) >= 5:
        # Get all matching games, ordered by igdb_id (lower = original, not localized version)
        candidates = db.query(Game).filter(
            Game.name.ilike(f"{c_name}%")
        ).order_by(Game.igdb_id).limit(5).all()
        
        if candidates:
            game = candidates[0]  # Take lowest igdb_id (usually the original/English version)
            logger.debug(f"[Match] {platform_name} → {game.name} (partial)")
            return (game.igdb_id, game.name, game.cover_image, 0.60, "partial")
    
    # Step 5: No match
    logger.debug(f"[Match] {platform_name} → UNMATCHED")
    return (None, None, None, None, None)


# ═══════════════════════════════════════════════════════════════════
# PSN Game Fetching
# ═══════════════════════════════════════════════════════════════════

def get_psn_games(username: str) -> list[dict]:
    """
    Get all games for a PSN user by their username.
    
    Uses title_stats which provides playtime data.
    Aggregates PS4/PS5 versions of the same game.
    Filters out non-game apps.
    
    Args:
        username: PSN online_id
        
    Returns:
        List of games with title_id, name, playtime, etc.
        
    Raises:
        PSNServiceError: If user not found or profile is private
    """
    try:
        psnawp = _get_psnawp_client()
        
        try:
            user = psnawp.user(online_id=username)
        except Exception as e:
            if "not found" in str(e).lower():
                raise PSNServiceError(f"PSN user '{username}' not found")
            raise PSNServiceError(f"Failed to find PSN user: {e}")
        
        # First, collect all games from title_stats
        raw_games = []
        try:
            for stat in user.title_stats(limit=None):
                raw_name = stat.name or ""
                
                # Skip non-game apps early
                if is_non_game(clean_platform_name(raw_name)):
                    continue
                
                play_mins = 0
                if stat.play_duration:
                    play_mins = int(stat.play_duration.total_seconds() / 60)
                
                raw_games.append({
                    "title_id": stat.title_id,
                    "raw_name": raw_name,
                    "image_url": stat.image_url,
                    "play_duration_minutes": play_mins,
                    "play_count": stat.play_count or 0,
                    "last_played": stat.last_played_date_time,
                    "first_played": stat.first_played_date_time,
                })
        except Exception as e:
            if "forbidden" in str(e).lower() or "private" in str(e).lower():
                raise PSNServiceError(
                    f"User '{username}' has a private profile. "
                    "They must set their PSN privacy to public."
                )
            raise PSNServiceError(f"Failed to fetch games: {e}")
        
        # Static mapping for known games where PSN name doesn't match the actual game
        # This happens when games are "upgraded" (e.g., OW1 became OW2 on PSN)
        # Keys are title_ids from PSN, values are the correct game names
        TITLE_ID_OVERRIDE = {
            # Overwatch 1 (original) - PSN shows as "Overwatch 2" but these are OW1 title_ids
            "CUSA03974_00": "Overwatch",  # PS4 Overwatch 1
            "CUSA04961_00": "Overwatch",  # PS4 Overwatch 1 (alternate region?)
            # Note: PPSA07821_00, PPSA08257_00, CUSA34317_00 are actual OW2 title_ids
        }
        
        logger.info(f"[PSN] Using static override map for {len(TITLE_ID_OVERRIDE)} known games")
        
        # Build final games list using override names where available
        games = []
        for game in raw_games:
            title_id = game["title_id"]
            raw_name = game["raw_name"]
            
            # Use static override if available, otherwise use current name
            if title_id in TITLE_ID_OVERRIDE:
                name = TITLE_ID_OVERRIDE[title_id]
            else:
                name = clean_platform_name(raw_name)
            
            games.append({
                "title_id": title_id,
                "name": name,
                "image_url": game["image_url"],
                "play_duration_minutes": game["play_duration_minutes"],
                "play_count": game["play_count"],
                "last_played": game["last_played"],
                "first_played": game["first_played"],
            })
        
        # Return all games individually - aggregation will happen in sync service
        # after IGDB matching (so we combine by IGDB ID, not by name)
        logger.info(f"[PSN] Fetched {len(games)} games for user '{username}'")
        return games
        
    except PSNServiceError:
        raise
    except Exception as e:
        raise PSNServiceError(f"Failed to get PSN games: {e}")


# ═══════════════════════════════════════════════════════════════════
# Account Linking
# ═══════════════════════════════════════════════════════════════════

def verify_psn_username(username: str) -> dict:
    """
    Verify a PSN username exists and is accessible.
    
    Returns:
        {"online_id": str, "account_id": str}
        
    Raises:
        PSNServiceError: If user not found
    """
    try:
        psnawp = _get_psnawp_client()
        user = psnawp.user(online_id=username)
        
        return {
            "online_id": user.online_id,
            "account_id": str(user.account_id),
        }
    except Exception as e:
        if "not found" in str(e).lower():
            raise PSNServiceError(f"PSN user '{username}' not found")
        raise PSNServiceError(f"Failed to verify PSN user: {e}")


def link_psn_account(db: Session, user_id: int, username: str) -> UserPlatformLink:
    """
    Link a PSN account to a GameGloom user.
    
    Args:
        db: Database session
        user_id: GameGloom user ID
        username: PSN online_id
        
    Returns:
        Created or updated UserPlatformLink
    """
    profile = verify_psn_username(username)
    
    existing = db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()
    
    if existing:
        existing.platform_user_id = profile["account_id"]
        existing.platform_username = profile["online_id"]
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        logger.info(f"[PSN] Updated link for user {user_id}: {username}")
        return existing
    
    link = UserPlatformLink(
        user_id=user_id,
        platform=PlatformType.PSN.value,
        platform_user_id=profile["account_id"],
        platform_username=profile["online_id"],
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    logger.info(f"[PSN] Created link for user {user_id}: {username}")
    return link


def unlink_psn_account(db: Session, user_id: int) -> bool:
    """
    Unlink PSN account from a GameGloom user.
    
    Returns:
        True if unlinked, False if no link existed
    """
    link = db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()
    
    if link:
        db.delete(link)
        db.commit()
        logger.info(f"[PSN] Unlinked account for user {user_id}")
        return True
    return False


def get_psn_link(db: Session, user_id: int) -> Optional[UserPlatformLink]:
    """Get the PSN link for a user, if it exists."""
    return db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()


def update_last_synced(db: Session, user_id: int) -> None:
    """Update the last_synced_at timestamp for a user's PSN link."""
    link = get_psn_link(db, user_id)
    if link:
        link.last_synced_at = datetime.now(timezone.utc)
        db.commit()


# ═══════════════════════════════════════════════════════════════════
# PSN Profile (Avatar)
# ═══════════════════════════════════════════════════════════════════

def get_psn_profile(username: str) -> dict:
    """
    Get PSN profile data including avatar URL and trophy stats.
    
    Args:
        username: PSN online_id
        
    Returns:
        {
            "online_id": str, 
            "account_id": str, 
            "avatar_url": str|None,
            "trophy_level": int|None,
            "platinum": int, "gold": int, "silver": int, "bronze": int
        }
    """
    try:
        psnawp = _get_psnawp_client()
        user = psnawp.user(online_id=username)
        
        # Try to get avatar URL from profile
        avatar_url = None
        try:
            profile = user.profile()
            # profile() returns "avatars" list with "size" and "url" keys
            avatars = profile.get("avatars", [])
            if avatars:
                # Prefer xl (extra large), then l (large)
                for preferred_size in ["xl", "l", "m", "s"]:
                    for av in avatars:
                        if av.get("size") == preferred_size and av.get("url"):
                            avatar_url = av["url"]
                            break
                    if avatar_url:
                        break
        except Exception as e:
            logger.warning(f"[PSN] Could not fetch avatar for {username}: {e}")
        
        # Try to get trophy stats
        trophy_level = None
        platinum = gold = silver = bronze = 0
        try:
            trophy_summary = user.trophy_summary()
            trophy_level = trophy_summary.trophy_level
            platinum = trophy_summary.earned_trophies.platinum or 0
            gold = trophy_summary.earned_trophies.gold or 0
            silver = trophy_summary.earned_trophies.silver or 0
            bronze = trophy_summary.earned_trophies.bronze or 0
        except Exception as e:
            logger.warning(f"[PSN] Could not fetch trophies for {username}: {e}")
        
        return {
            "online_id": user.online_id,
            "account_id": str(user.account_id),
            "avatar_url": avatar_url,
            "trophy_level": trophy_level,
            "platinum": platinum,
            "gold": gold,
            "silver": silver,
            "bronze": bronze,
        }
    except Exception as e:
        logger.warning(f"[PSN] Could not fetch profile for {username}: {e}")
        return {
            "online_id": username,
            "account_id": None,
            "avatar_url": None,
            "trophy_level": None,
            "platinum": 0,
            "gold": 0,
            "silver": 0,
            "bronze": 0,
        }
