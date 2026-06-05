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
from sqlalchemy.orm import Session

from ...settings import settings
from ..models.user_platform_link import UserPlatformLink, PlatformType
from ..models.psn_title_lookup import PsnTitleLookup
from ..models.game import Game
from ..core.matching_utils import (
    is_non_game, clean_platform_name, find_igdb_match, pick_best_match,
    normalize_for_match, NO_MATCH
)

logger = logging.getLogger(__name__)


class PSNServiceError(Exception):
    """Custom exception for PSN service errors."""
    pass


# Removed local is_non_game and patterns (now in matching_utils)



# ═══════════════════════════════════════════════════════════════════
# PSNAWP Client
# ═══════════════════════════════════════════════════════════════════

_psnawp_client = None

def _get_psnawp_client():
    """
    Get a PSNAWP client using the server-side NPSSO token.
    
    Uses a module-level singleton to reuse the authenticated session across
    requests. The PSNAWP library authenticates lazily on first API call and
    keeps an internal access/refresh token pair, so reusing one instance
    avoids redundant NPSSO exchanges that Sony may reject.
    
    Performs eager authentication on first call to surface token errors
    immediately rather than on the first user-facing request.
    """
    global _psnawp_client
    from psnawp_api import PSNAWP
    
    if _psnawp_client is not None:
        return _psnawp_client
    
    npsso = settings.PSN_NPSSO
    if not npsso:
        raise PSNServiceError("PSN_NPSSO not configured in environment variables")
    
    try:
        client = PSNAWP(npsso)
        client.me().account_id  # force NPSSO exchange now
        _psnawp_client = client
        logger.info("[PSN] PSNAWP client initialized successfully")
        return _psnawp_client
    except Exception as e:
        logger.error(f"[PSN] Failed to initialize client: {e}")
        raise PSNServiceError(f"Failed to initialize PSN client: {e}")


def _reset_psnawp_client():
    """Reset the cached PSNAWP client (e.g. after token refresh)."""
    global _psnawp_client
    _psnawp_client = None


def check_psn_health() -> dict:
    """
    Check if PSN integration is healthy (NPSSO token valid).
    
    Returns:
        {"status": "ok"} or {"status": "error", "message": "..."}
    """
    try:
        _get_psnawp_client()
        return {"status": "ok"}
    except PSNServiceError as e:
        return {"status": "error", "message": str(e)}
    except Exception as e:
        _reset_psnawp_client()
        return {"status": "error", "message": f"PSN API error: {e}"}


# Removed local cleaning/slug functions (now in matching_utils)



# ═══════════════════════════════════════════════════════════════════
# IGDB Matching
# ═══════════════════════════════════════════════════════════════════

# Removed local pick_best_match (now in matching_utils)



def match_via_igdb_search(db: Session, raw_name: str) -> tuple:
    """
    Last-resort match for an unmatched platform name: search IGDB live, and if a
    result's name (or an alternative name) is an exact normalized match, add it to
    the catalog and return it. Conservative — fuzzy results are ignored so the shared
    catalog never gains a wrong game. Skips known non-games before spending an API call.
    """
    from ..core import services
    from ..core.igdb_service import EXCLUDED_GAME_TYPES

    cleaned = clean_platform_name(raw_name)
    if not cleaned or is_non_game(cleaned):
        return NO_MATCH
    target = normalize_for_match(cleaned)
    if not target or len(target) < 3:
        return NO_MATCH

    search_term = cleaned.replace('"', '').replace('\\', '').strip()
    query = f'search "{search_term}"; {services.IGDB_GAME_FIELDS} where version_parent = null; limit 10;'
    try:
        results = services.fetch_from_igdb(query=query) or []
        if not isinstance(results, list):
            results = [results]
    except Exception as e:
        logger.warning(f"[IGDB Fetch] search failed for {raw_name}: {e}")
        return NO_MATCH

    for data in results:
        if not data or not data.get("id") or not data.get("name"):
            continue
        processed = services.process_igdb_data(data)
        if processed.game_type_id in EXCLUDED_GAME_TYPES or is_non_game(processed.name):
            continue
        candidate_names = [processed.name] + (processed.alternative_names or [])
        if any(normalize_for_match(n) == target for n in candidate_names):
            game = services.get_game_by_igdb_id(db, processed.igdb_id) or services.create_game(db, processed)
            logger.debug(f"[IGDB Fetch] {raw_name} → {game.name} (added/matched)")
            return (game.igdb_id, game.name, game.cover_image, 0.90, "igdb_fetch")
    return NO_MATCH


def match_game_to_igdb(
    db: Session,
    platform_id: str,
    platform_name: str,
    first_played: datetime = None,
    allow_igdb_fetch: bool = False
) -> tuple:
    """
    Match a PSN game to IGDB.

    Tries two source names through the shared matcher and keeps the most
    confident result:
    1. The name PSN reports for the game
    2. The canonical name from the Sony title lookup table (title_id → name)

    The PSN name is tried first because it's the title the user actually owns
    and usually names the base game. The Sony lookup name is the full SKU name
    and can carry an expansion/edition ("Monster Hunter World: Iceborne"), so
    it's only a fallback for PSN names too mangled to match ("SOULCALIBURVI").

    Args:
        db: Database session
        platform_id: PSN title_id (e.g., "CUSA00634_00")
        platform_name: Game name from PSN
        first_played: When user first played (for disambiguation)

    Returns:
        (igdb_id, igdb_name, cover_url, confidence, method) - any can be None
    """
    lookup = db.query(PsnTitleLookup).filter(
        PsnTitleLookup.title_id == platform_id
    ).first()

    # 0. Exact concept-id bridge: Sony's concept_id == IGDB's PlayStation concept,
    # so this resolves the game by ID with no name guessing. Highest confidence.
    if lookup and lookup.concept_id:
        candidates = db.query(Game).filter(Game.ps_concept_id == lookup.concept_id).all()
        if candidates:
            game = pick_best_match(candidates, first_played)
            if game:
                logger.debug(f"[Match] {platform_name} → {game.name} (ps_concept)")
                return (game.igdb_id, game.name, game.cover_image, 0.97, "ps_concept")

    names = []
    if platform_name:
        names.append(platform_name)
    lookup_name = lookup.name if lookup and lookup.name else None
    if lookup_name and lookup_name not in names:
        names.append(lookup_name)

    best = NO_MATCH
    for name in names:
        # The Sony lookup name carries the sequel number ("Overwatch 2") that the
        # PSN platform_name ("Overwatch") lacks, so it disambiguates same-named entries.
        result = find_igdb_match(db, name, first_played, disambig_name=lookup_name)
        if result[0] is None:
            continue
        # Stop early on a high-confidence hit; otherwise keep the best so far.
        if (result[3] or 0) >= 0.90:
            logger.debug(f"[Match] {platform_name} → {result[1]} ({result[4]})")
            return result
        if (result[3] or 0) > (best[3] or 0):
            best = result

    # Final fallback: only when fully unmatched and explicitly allowed (initial sync,
    # not the local-only re-sync retry), search IGDB live and add the game if found.
    if best[0] is None and allow_igdb_fetch:
        fetched = match_via_igdb_search(db, platform_name)
        if fetched[0] is not None:
            return fetched

    if best[0] is None:
        logger.debug(f"[Match] {platform_name} → UNMATCHED")
    return best


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
    except PSNServiceError:
        raise
    except Exception as e:
        err = str(e).lower()
        if "not found" in err:
            raise PSNServiceError(f"PSN user '{username}' not found")
        if "expired" in err or "unauthorized" in err or "authentication" in err:
            logger.warning("[PSN] Auth error during verify, resetting client")
            _reset_psnawp_client()
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
