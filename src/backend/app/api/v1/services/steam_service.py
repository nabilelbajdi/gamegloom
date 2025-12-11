# services/steam_service.py
"""
Steam integration service.
Handles OpenID 2.0 authentication and Steam Web API calls.
"""
import re
import urllib.parse
from datetime import datetime, timezone
from typing import Optional
import httpx
from sqlalchemy.orm import Session

from ...settings import settings
from ..models.user_platform_link import UserPlatformLink, PlatformType


# Steam OpenID constants
STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_API_BASE = "https://api.steampowered.com"


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
