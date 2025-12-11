# routers/integrations.py
"""
Platform integrations router for Steam and PSN.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from ..core import security
from ..models.user import User
from ..models.user_platform_link import UserPlatformLink, PlatformType
from ...db_setup import get_db
from ...settings import settings

# Import services - using relative imports
from ..services import steam_service, psn_service

router = APIRouter(prefix="/integrations", tags=["integrations"])


# ============ SCHEMAS ============

class PlatformLinkResponse(BaseModel):
    """Response schema for a linked platform."""
    platform: str
    platform_user_id: str
    platform_username: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class IntegrationStatusResponse(BaseModel):
    """Response with all linked platforms."""
    steam: Optional[PlatformLinkResponse] = None
    psn: Optional[PlatformLinkResponse] = None


class PSNLinkRequest(BaseModel):
    """Request schema for linking PSN account."""
    npsso: str = Field(..., min_length=60, max_length=70, description="64-character NPSSO token")


class SteamGame(BaseModel):
    """Steam game with playtime info."""
    appid: int
    name: str
    playtime_minutes: int
    img_icon_url: Optional[str] = None


class PSNGame(BaseModel):
    """PSN game with playtime info."""
    title_id: str
    name: str
    play_duration_minutes: int
    play_count: int
    image_url: Optional[str] = None


class SyncResult(BaseModel):
    """Result of syncing games from a platform."""
    games_found: int
    games_imported: int
    games_updated: int
    message: str


# ============ STEAM ENDPOINTS ============

@router.get("/steam/auth-url")
def get_steam_auth_url(
    return_url: Optional[str] = Query(None, description="Custom return URL after auth"),
    current_user: User = Depends(security.get_current_user)
):
    """
    Get the Steam OpenID login URL to redirect the user to.
    """
    if not settings.STEAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Steam integration is not configured"
        )
    
    try:
        url = steam_service.construct_steam_login_url(return_url)
        return {"auth_url": url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Steam auth URL: {e}"
        )


@router.get("/steam/callback")
def steam_callback(
    db: Session = Depends(get_db),
    **query_params
):
    """
    Callback endpoint for Steam OpenID authentication.
    Steam redirects here after user authenticates.
    """
    # FastAPI doesn't easily pass all query params, so we need to reconstruct
    # This endpoint will be called with OpenID response params
    from fastapi import Request
    
    # For now, return instructions - actual implementation needs Request object
    return {
        "message": "Steam callback received. Please implement frontend callback handling.",
        "note": "Frontend should extract query params and call /steam/link endpoint"
    }


@router.post("/steam/link")
def link_steam_account(
    steam_id: str = Query(..., description="Steam64 ID from OpenID callback"),
    openid_params: Optional[dict] = None,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link a Steam account after OpenID authentication.
    Frontend should call this with the Steam ID extracted from the callback.
    """
    if not settings.STEAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Steam integration is not configured"
        )
    
    try:
        link = steam_service.link_steam_account(db, current_user.id, steam_id)
        return {
            "message": "Steam account linked successfully",
            "platform_username": link.platform_username,
            "platform_user_id": link.platform_user_id
        }
    except steam_service.SteamServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/steam/games", response_model=list[SteamGame])
def get_steam_games(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all games from the user's linked Steam account.
    """
    link = steam_service.get_steam_link(db, current_user.id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Steam account linked"
        )
    
    try:
        games = steam_service.get_owned_games(link.platform_user_id)
        return [
            SteamGame(
                appid=g["appid"],
                name=g.get("name", f"App {g['appid']}"),
                playtime_minutes=g.get("playtime_forever", 0),
                img_icon_url=g.get("img_icon_url")
            )
            for g in games
        ]
    except steam_service.SteamServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )


# ============ PSN ENDPOINTS ============

@router.post("/psn/link")
def link_psn_account(
    request: PSNLinkRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link a PSN account using an NPSSO token.
    
    To get your NPSSO token:
    1. Sign in at https://www.playstation.com
    2. Visit https://ca.account.sony.com/api/v1/ssocookie
    3. Copy the 64-character token from the JSON response
    """
    try:
        link = psn_service.link_psn_account(db, current_user.id, request.npsso)
        return {
            "message": "PSN account linked successfully",
            "platform_username": link.platform_username,
            "platform_user_id": link.platform_user_id
        }
    except psn_service.PSNServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/psn/games", response_model=list[PSNGame])
def get_psn_games(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all games from the user's linked PSN account with playtime.
    """
    link = psn_service.get_psn_link(db, current_user.id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No PSN account linked"
        )
    
    if not link.access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PSN token expired. Please re-link your account."
        )
    
    try:
        games = psn_service.get_psn_user_games(link.access_token)
        return [
            PSNGame(
                title_id=g["title_id"],
                name=g["name"],
                play_duration_minutes=g["play_duration_minutes"],
                play_count=g["play_count"],
                image_url=g.get("image_url")
            )
            for g in games
        ]
    except psn_service.PSNServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )


# ============ COMMON ENDPOINTS ============

@router.get("/status", response_model=IntegrationStatusResponse)
def get_integration_status(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the status of all platform integrations for the current user.
    """
    steam_link = steam_service.get_steam_link(db, current_user.id)
    psn_link = psn_service.get_psn_link(db, current_user.id)
    
    return IntegrationStatusResponse(
        steam=PlatformLinkResponse(
            platform="steam",
            platform_user_id=steam_link.platform_user_id,
            platform_username=steam_link.platform_username,
            last_synced_at=steam_link.last_synced_at,
            created_at=steam_link.created_at
        ) if steam_link else None,
        psn=PlatformLinkResponse(
            platform="psn",
            platform_user_id=psn_link.platform_user_id,
            platform_username=psn_link.platform_username,
            last_synced_at=psn_link.last_synced_at,
            created_at=psn_link.created_at
        ) if psn_link else None
    )


@router.delete("/{platform}/unlink")
def unlink_platform(
    platform: str,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlink a platform account.
    """
    if platform == "steam":
        success = steam_service.unlink_steam_account(db, current_user.id)
    elif platform == "psn":
        success = psn_service.unlink_psn_account(db, current_user.id)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown platform: {platform}"
        )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {platform} account linked"
        )
    
    return {"message": f"{platform.upper()} account unlinked successfully"}
