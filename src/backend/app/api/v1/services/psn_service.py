# services/psn_service.py
"""
PlayStation Network integration service.
Uses psnawp library for PSN API access.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from ...settings import settings
from ..models.user_platform_link import UserPlatformLink, PlatformType


class PSNServiceError(Exception):
    """Custom exception for PSN service errors."""
    pass


def exchange_npsso_for_tokens(npsso: str) -> dict:
    """
    Exchange NPSSO token for access and refresh tokens.
    
    Args:
        npsso: 64-character NPSSO token from PlayStation website
        
    Returns:
        Dict with access_token, refresh_token, and expires_at
        
    Raises:
        PSNServiceError: If token exchange fails
    """
    try:
        from psnawp_api import PSNAWP
        
        # Create PSNAWP client with NPSSO
        psnawp = PSNAWP(npsso)
        
        # Get the client info to verify the token works
        client = psnawp.me()
        
        # psnawp handles token management internally
        # We return the NPSSO as the "access token" since psnawp needs it
        return {
            "access_token": npsso,
            "refresh_token": None,  # psnawp handles refresh internally
            "online_id": client.online_id,
            "account_id": client.account_id,
        }
    except Exception as e:
        raise PSNServiceError(f"Failed to authenticate with PSN: {e}")


def get_psn_user_games(npsso: str) -> list[dict]:
    """
    Get all games played by the PSN user with playtime.
    
    Args:
        npsso: NPSSO token
        
    Returns:
        List of games with title, playtime, and play count
    """
    try:
        from psnawp_api import PSNAWP
        
        psnawp = PSNAWP(npsso)
        client = psnawp.me()
        
        # Get title stats (games played with playtime)
        title_stats = client.title_stats()
        
        games = []
        for title in title_stats:
            games.append({
                "title_id": title.title_id,
                "name": title.name,
                "image_url": title.image_url,
                "category": title.category,
                "play_count": title.play_count,
                "first_played_at": title.first_played_date_time,
                "last_played_at": title.last_played_date_time,
                "play_duration_minutes": int(title.play_duration.total_seconds() / 60) if title.play_duration else 0,
            })
        
        return games
    except Exception as e:
        raise PSNServiceError(f"Failed to get PSN games: {e}")


def get_psn_user_profile(npsso: str) -> dict:
    """
    Get PSN user profile information.
    
    Args:
        npsso: NPSSO token
        
    Returns:
        User profile data
    """
    try:
        from psnawp_api import PSNAWP
        
        psnawp = PSNAWP(npsso)
        client = psnawp.me()
        
        return {
            "online_id": client.online_id,
            "account_id": client.account_id,
        }
    except Exception as e:
        raise PSNServiceError(f"Failed to get PSN profile: {e}")


def link_psn_account(db: Session, user_id: int, npsso: str) -> UserPlatformLink:
    """
    Link a PSN account to a GameGloom user.
    
    Args:
        db: Database session
        user_id: GameGloom user ID
        npsso: PSN NPSSO token
        
    Returns:
        Created or updated UserPlatformLink
    """
    # Verify token and get user info
    token_info = exchange_npsso_for_tokens(npsso)
    
    # Check if already linked
    existing = db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()
    
    if existing:
        # Update existing link
        existing.platform_user_id = token_info["account_id"]
        existing.platform_username = token_info["online_id"]
        existing.access_token = npsso  # Store encrypted in production!
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new link
    link = UserPlatformLink(
        user_id=user_id,
        platform=PlatformType.PSN.value,
        platform_user_id=token_info["account_id"],
        platform_username=token_info["online_id"],
        access_token=npsso,  # Store encrypted in production!
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def unlink_psn_account(db: Session, user_id: int) -> bool:
    """
    Unlink PSN account from a GameGloom user.
    
    Args:
        db: Database session
        user_id: GameGloom user ID
        
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
        return True
    return False


def get_psn_link(db: Session, user_id: int) -> Optional[UserPlatformLink]:
    """Get the PSN link for a user, if it exists."""
    return db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()
