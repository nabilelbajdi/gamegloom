# services/steam_service.py
"""
Steam integration service.
Handles OpenID 2.0 authentication and Steam Web API calls.
"""
import re
import time
import urllib.parse
from datetime import datetime, timezone
from typing import Optional
import httpx
from sqlalchemy.orm import Session

from ...settings import settings
from ..models.user_platform_link import UserPlatformLink, PlatformType
from ..models.game import Game
from ..core.igdb_service import fetch_from_igdb
from ..core.matching_utils import (
    clean_name, clean_platform_name, generate_slug, 
    slug_with_roman_numerals, pick_best_match
)

import logging
logger = logging.getLogger(__name__)


# Steam OpenID constants
STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_API_BASE = "https://api.steampowered.com"

# Rate limit: Steam allows 100,000 requests/day
MAX_RETRIES = 3
RETRY_DELAY_BASE = 1.0  # seconds


def _request_with_retry(method: str, url: str, max_retries: int = MAX_RETRIES, **kwargs) -> httpx.Response:
    """
    Make an HTTP request with exponential backoff retry for rate limits.
    
    Handles 403 (rate limit) and 429 (too many requests) with retries.
    """
    last_error = None
    for attempt in range(max_retries):
        try:
            if method.lower() == "get":
                response = httpx.get(url, **kwargs)
            else:
                response = httpx.post(url, **kwargs)
            
            # If rate limited, wait and retry
            if response.status_code in (403, 429):
                delay = RETRY_DELAY_BASE * (2 ** attempt)
                logger.warning(f"[Steam] Rate limited (attempt {attempt + 1}/{max_retries}), waiting {delay}s...")
                time.sleep(delay)
                continue
            
            return response
            
        except httpx.RequestError as e:
            last_error = e
            if attempt < max_retries - 1:
                delay = RETRY_DELAY_BASE * (2 ** attempt)
                logger.warning(f"[Steam] Request failed (attempt {attempt + 1}/{max_retries}): {e}, retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise
    
    # If we exhausted retries due to rate limiting, raise with last response
    raise SteamServiceError(f"Rate limited after {max_retries} retries")


class SteamServiceError(Exception):
    """Custom exception for Steam service errors."""
    pass


def construct_steam_login_url(return_url: Optional[str] = None) -> str:
    """
    Construct the Steam OpenID login URL for user authentication.
    
    Args:
        return_url: Optional custom return URL. Defaults to settings.STEAM_OPENID_RETURN_TO
        
    Returns:
        Full Steam OpenID login URL to redirect the user to
    """
    return_to = return_url or settings.STEAM_OPENID_RETURN_TO
    realm = settings.STEAM_OPENID_REALM
    
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": return_to,
        "openid.realm": realm,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    
    return f"{STEAM_OPENID_URL}?{urllib.parse.urlencode(params)}"


def validate_steam_callback(query_params: dict) -> Optional[str]:
    """
    Validate the Steam OpenID callback and extract the Steam ID.
    
    Args:
        query_params: Dictionary of query parameters from Steam callback
        
    Returns:
        Steam64 ID if validation succeeds, None otherwise
        
    Raises:
        SteamServiceError: If validation fails
    """
    # Check for required OpenID parameters
    if query_params.get("openid.mode") != "id_res":
        raise SteamServiceError("Invalid OpenID mode in callback")
    
    claimed_id = query_params.get("openid.claimed_id", "")
    
    # Extract Steam ID from claimed_id URL
    # Format: https://steamcommunity.com/openid/id/76561198012345678
    match = re.search(r"steamcommunity\.com/openid/id/(\d+)", claimed_id)
    if not match:
        raise SteamServiceError("Could not extract Steam ID from callback")
    
    steam_id = match.group(1)
    
    # Verify the response with Steam (important security step)
    verification_params = {
        "openid.assoc_handle": query_params.get("openid.assoc_handle", ""),
        "openid.signed": query_params.get("openid.signed", ""),
        "openid.sig": query_params.get("openid.sig", ""),
        "openid.ns": query_params.get("openid.ns", ""),
        "openid.mode": "check_authentication",
    }
    
    # Add all signed parameters 
    signed_params = query_params.get("openid.signed", "").split(",")
    for param in signed_params:
        key = f"openid.{param}"
        if key in query_params:
            verification_params[key] = query_params[key]
    
    # Verify with Steam
    try:
        response = httpx.post(STEAM_OPENID_URL, data=verification_params, timeout=10.0)
        if "is_valid:true" not in response.text:
            raise SteamServiceError("Steam OpenID verification failed")
    except httpx.RequestError as e:
        raise SteamServiceError(f"Failed to verify with Steam: {e}")
    
    return steam_id


def get_steam_user_summary(steam_id: str) -> dict:
    """
    Get Steam user profile summary.
    
    Args:
        steam_id: Steam64 ID
        
    Returns:
        User profile data including display name and avatar
    """
    if not settings.STEAM_API_KEY:
        raise SteamServiceError("Steam API key not configured")
    
    url = f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/"
    params = {
        "key": settings.STEAM_API_KEY,
        "steamids": steam_id,
    }
    
    try:
        response = httpx.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        
        players = data.get("response", {}).get("players", [])
        if not players:
            raise SteamServiceError("Steam user not found")
        
        return players[0]
    except httpx.RequestError as e:
        raise SteamServiceError(f"Failed to get Steam user summary: {e}")


def resolve_vanity_url(vanity_url: str) -> Optional[str]:
    """
    Resolve a Steam vanity URL name to its 64-bit Steam ID.
    
    Args:
        vanity_url: The custom name (e.g., 'gabelogannewell')
        
    Returns:
        Steam64 ID string if found, None otherwise
    """
    if not settings.STEAM_API_KEY:
        raise SteamServiceError("Steam API key not configured")
        
    url = f"{STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v0001/"
    params = {
        "key": settings.STEAM_API_KEY,
        "vanityurl": vanity_url,
    }
    
    try:
        response = httpx.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        
        res = data.get("response", {})
        if res.get("success") == 1:
            return res.get("steamid")
        return None
    except httpx.RequestError as e:
        logger.error(f"[Steam] Failed to resolve vanity URL '{vanity_url}': {e}")
        return None


def extract_steam_id_from_input(input_str: str) -> Optional[str]:
    """
    Parse a Steam ID, custom URL, or profile URL into a 64-bit Steam ID.
    
    Handles:
    - steamid64 (17 digits)
    - profile url: https://steamcommunity.com/profiles/76561198012345678
    - custom url: https://steamcommunity.com/id/myusername/
    - vanity name: myusername
    
    Returns:
    - Steam64 ID string if resolved, None otherwise
    """
    input_str = input_str.strip().rstrip('/')
    
    # 1. Check if it's already a 17-digit Steam64 ID
    if re.match(r"^\d{17}$", input_str):
        return input_str
        
    # 2. Extract from /profiles/ URL
    profile_match = re.search(r"steamcommunity\.com/profiles/(\d{17})", input_str)
    if profile_match:
        return profile_match.group(1)
        
    # 3. Extract vanity name from /id/ URL or treat as vanity name directly
    vanity_match = re.search(r"steamcommunity\.com/id/([^/?#]+)", input_str)
    vanity_name = vanity_match.group(1) if vanity_match else input_str
    
    # Sanitize vanity name (disallow characters that shouldn't be in a custom URL)
    if re.match(r"^[A-Za-z0-9_-]+$", vanity_name):
        return resolve_vanity_url(vanity_name)
        
    return None


def get_owned_games(steam_id: str, include_free_games: bool = True) -> list[dict]:
    """
    Get all games owned by a Steam user with playtime.
    
    Args:
        steam_id: Steam64 ID
        include_free_games: Whether to include free-to-play games
        
    Returns:
        List of games with appid, name, and playtime_forever (in minutes)
    """
    if not settings.STEAM_API_KEY:
        raise SteamServiceError("Steam API key not configured")
    
    url = f"{STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/"
    params = {
        "key": settings.STEAM_API_KEY,
        "steamid": steam_id,
        "format": "json",
        "include_appinfo": 1,  # Include game names
        "include_played_free_games": 1 if include_free_games else 0,
    }
    
    try:
        response = httpx.get(url, params=params, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        
        return data.get("response", {}).get("games", [])
    except httpx.RequestError as e:
        raise SteamServiceError(f"Failed to get owned games: {e}")


def link_steam_account(db: Session, user_id: int, steam_id: str) -> UserPlatformLink:
    """
    Link a Steam account to a GameGloom user.
    
    Args:
        db: Database session
        user_id: GameGloom user ID
        steam_id: Steam64 ID
        
    Returns:
        Created or updated UserPlatformLink
    """
    # Check if already linked
    existing = db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.STEAM.value
    ).first()
    
    # Get Steam user info
    try:
        steam_user = get_steam_user_summary(steam_id)
        steam_username = steam_user.get("personaname", "")
    except SteamServiceError:
        steam_username = None
    
    if existing:
        # Update existing link
        existing.platform_user_id = steam_id
        existing.platform_username = steam_username
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new link
    link = UserPlatformLink(
        user_id=user_id,
        platform=PlatformType.STEAM.value,
        platform_user_id=steam_id,
        platform_username=steam_username,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def unlink_steam_account(db: Session, user_id: int) -> bool:
    """
    Unlink Steam account from a GameGloom user.
    
    Args:
        db: Database session
        user_id: GameGloom user ID
        
    Returns:
        True if unlinked, False if no link existed
    """
    link = db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.STEAM.value
    ).first()
    
    if link:
        db.delete(link)
        db.commit()
        return True
    return False


def get_steam_link(db: Session, user_id: int) -> Optional[UserPlatformLink]:
    """Get the Steam link for a user, if it exists."""
    return db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.STEAM.value
    ).first()


def match_game_to_igdb(
    db: Session,
    platform_id: str,
    platform_name: str
) -> tuple:
    """
    Match a Steam game to IGDB.
    
    Matching strategy:
    1. IGDB external_games lookup (via Steam AppID) -> ~99% accuracy
    2. Slug match with IGDB disambiguation suffixes
    3. Roman numeral conversion (3→iii)
    4. Partial name prefix match
    
    Returns:
        (igdb_id, igdb_name, cover_url, confidence, method)
    """
    try:
        app_id = int(platform_id)
        
        # Step 1: IGDB external_games lookup
        # category 1 is Steam
        query = f"fields game.id, game.name, game.cover.image_id; where category = 1 & uid = \"{app_id}\";"
        external_data = fetch_from_igdb(query=query, endpoint="external_games")
        
        if external_data:
            ext = external_data[0]
            igdb_game = ext.get("game")
            if igdb_game:
                igdb_id = igdb_game["id"]
                name = igdb_game["name"]
                cover_id = igdb_game.get("cover", {}).get("image_id")
                cover_url = f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{cover_id}.jpg" if cover_id else None
                
                logger.debug(f"[Steam Match] {platform_name} ({app_id}) → {name} (appid)")
                return (igdb_id, name, cover_url, 0.99, "appid")

        # Step 2: Slug matching (fallback)
        slug = generate_slug(platform_name)
        candidates = db.query(Game).filter(
            (Game.slug == slug) | 
            (Game.slug.like(f"{slug}--%"))
        ).all()
        
        if candidates:
            game = pick_best_match(candidates)
            if game:
                confidence = 0.85 if game.slug == slug else 0.80
                logger.debug(f"[Steam Match] {platform_name} → {game.name} (slug)")
                return (game.igdb_id, game.name, game.cover_image, confidence, "slug")

        # Step 3: Roman numeral conversion
        roman_slug = slug_with_roman_numerals(slug)
        if roman_slug != slug:
            candidates = db.query(Game).filter(
                (Game.slug == roman_slug) | 
                (Game.slug.like(f"{roman_slug}--%"))
            ).all()
            
            if candidates:
                game = pick_best_match(candidates)
                if game:
                    logger.debug(f"[Steam Match] {platform_name} → {game.name} (slug_roman)")
                    return (game.igdb_id, game.name, game.cover_image, 0.80, "slug_roman")

        # Step 4: Partial name search
        c_name = clean_name(platform_name)
        if len(c_name) >= 5:
            candidates = db.query(Game).filter(
                Game.name.ilike(f"{c_name}%")
            ).order_by(Game.igdb_id).limit(5).all()
            
            if candidates:
                game = candidates[0]
                logger.debug(f"[Steam Match] {platform_name} → {game.name} (partial)")
                return (game.igdb_id, game.name, game.cover_image, 0.60, "partial")

        return None, None, None, None, None

    except Exception as e:
        logger.error(f"[Steam Match] Error matching {platform_name}: {e}")
        return None, None, None, None, None


# Batch size for IGDB queries - IGDB returns max 500 results per query
# Use 50 AppIDs per batch with limit 500 to ensure we get all matches
IGDB_BATCH_SIZE = 50


def batch_match_steam_appids(app_ids: list[str]) -> dict[str, tuple]:
    """
    Batch match multiple Steam AppIDs to IGDB in a single query.
    
    This dramatically improves sync performance for large libraries:
    - 1000 games: 1000 API calls → ~20 batch calls
    
    Args:
        app_ids: List of Steam AppID strings
        
    Returns:
        Dict mapping app_id to (igdb_id, igdb_name, cover_url, confidence, method)
        Missing entries = no match found (game not in IGDB or not linked to Steam)
    """
    if not app_ids:
        return {}
    
    results = {}
    total_batches = (len(app_ids) + IGDB_BATCH_SIZE - 1) // IGDB_BATCH_SIZE
    
    # Process in batches with rate limiting
    for batch_num, i in enumerate(range(0, len(app_ids), IGDB_BATCH_SIZE)):
        batch = app_ids[i:i + IGDB_BATCH_SIZE]
        
        try:
            # Build OR query for multiple UIDs
            # external_game_source = 1 is Steam (category field is DEPRECATED)
            uid_conditions = " | ".join([f'uid = "{app_id}"' for app_id in batch])
            query = f"fields game.id, game.name, game.cover.image_id, uid; where external_game_source = 1 & ({uid_conditions}); limit 500;"

            
            external_data = fetch_from_igdb(query=query, endpoint="external_games")
            
            batch_matched = 0
            if external_data:
                for ext in external_data:
                    uid = str(ext.get("uid", ""))
                    igdb_game = ext.get("game")
                    
                    if igdb_game and uid:
                        igdb_id = igdb_game["id"]
                        name = igdb_game["name"]
                        cover_id = igdb_game.get("cover", {}).get("image_id") if igdb_game.get("cover") else None
                        cover_url = f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{cover_id}.jpg" if cover_id else None
                        
                        results[uid] = (igdb_id, name, cover_url, 0.99, "appid_batch")
                        batch_matched += 1
                        
            logger.info(f"[Steam Batch] Batch {batch_num + 1}/{total_batches}: matched {batch_matched}/{len(batch)} games")
            
            # Rate limiting: IGDB allows 4 req/sec, so wait 0.3s between batches
            if batch_num < total_batches - 1:
                time.sleep(0.3)
            
        except Exception as e:
            logger.error(f"[Steam Batch] Batch {batch_num + 1}/{total_batches} failed: {e}")
            # Continue processing other batches even if one fails
            continue
    
    logger.info(f"[Steam Batch] Total matched: {len(results)}/{len(app_ids)} via batch IGDB lookup")
    
    # Note: Games not matched here don't necessarily mean IGDB doesn't have them,
    # it means IGDB's external_games table doesn't have a Steam AppID mapping for them.
    # The fallback individual matching will try slug-based matching for these.
    return results
