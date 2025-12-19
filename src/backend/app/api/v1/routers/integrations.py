# routers/integrations.py
"""
Platform integrations router for Steam and PSN.

Endpoints:
- Steam: OAuth linking, game fetching
- PSN: Username linking, library sync, import

The PSN flow is ephemeral - games are matched on-the-fly, not stored in a 
sync table. Users review matches and import directly to their library.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..core import security
from ..models.user import User
from ..models.user_platform_link import UserPlatformLink, PlatformType
from ..models.user_game import UserGame
from ..models.game import Game as GameModel
from ...db_setup import get_db
from ...settings import settings
from ..services import steam_service, psn_service, platform_sync_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integrations", tags=["integrations"])


# ═══════════════════════════════════════════════════════════════════
# Schemas
# ═══════════════════════════════════════════════════════════════════

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
    username: str = Field(..., min_length=3, max_length=16, description="PSN Online ID")


class SteamGame(BaseModel):
    """Steam game with playtime info."""
    appid: int
    name: str
    playtime_minutes: int
    img_icon_url: Optional[str] = None


class SteamLibraryGame(BaseModel):
    platform: str = 'steam'  # Always 'steam' for this response
    platform_id: str
    platform_name: str
    platform_image_url: Optional[str] = None  # Steam CDN cover
    igdb_id: Optional[int] = None
    igdb_name: Optional[str] = None
    igdb_cover_url: Optional[str] = None
    image_url: Optional[str] = None
    playtime_minutes: int = 0
    last_played_at: Optional[datetime] = None
    match_confidence: Optional[float] = None
    match_method: Optional[str] = None
    status: str = 'pending'
    platform_category: Optional[str] = "PC"


class PSNLibraryGame(BaseModel):
    """A PSN game matched to IGDB, ready for import."""
    platform_id: str
    platform_name: str
    platform_category: Optional[str] = None  # 'ps4' | 'ps5' | 'ps4,ps5' (for aggregated)
    igdb_id: Optional[int] = None
    igdb_name: Optional[str] = None
    igdb_cover_url: Optional[str] = None
    image_url: Optional[str] = None
    playtime_minutes: int = 0
    last_played_at: Optional[datetime] = None
    match_confidence: Optional[float] = None
    match_method: Optional[str] = None
    status: str = "pending"  # 'pending' | 'imported' | 'hidden'


def _get_platform_category(title_id: str) -> str:
    """Get platform category from PSN title_id prefix."""
    if title_id.startswith("PPSA"):
        return "ps5"
    elif title_id.startswith("CUSA"):
        return "ps4"
    return "ps4"  # Default to PS4 for unknown


class ImportGameRequest(BaseModel):
    """Single game import request."""
    platform_id: str
    igdb_id: int
    list_type: str = "played"



class ImportGamesRequest(BaseModel):
    """Bulk import request."""
    games: List[ImportGameRequest]


class ImportResponse(BaseModel):
    """Import result."""
    imported: int
    skipped: int
    message: str


class SyncResponse(BaseModel):
    """Sync result with delta info."""
    new_count: int
    updated_count: int
    total_count: int
    message: str


class SkipGameRequest(BaseModel):
    """Request to skip (hide) a game from sync."""
    platform_id: str


class FixMatchRequest(BaseModel):
    """Request to manually match a platform game to IGDB."""
    platform_id: str
    igdb_id: int
    igdb_name: Optional[str] = None
    igdb_cover_url: Optional[str] = None


class SteamLinkManualRequest(BaseModel):
    """Request to link Steam account via manual identifier."""
    identifier: str



# ═══════════════════════════════════════════════════════════════════
# Steam Endpoints
# ═══════════════════════════════════════════════════════════════════

class OpenIDParams(BaseModel):
    """OpenID 2.0 callback parameters from Steam."""
    openid_ns: str
    openid_mode: str
    openid_op_endpoint: Optional[str] = None
    openid_claimed_id: str
    openid_identity: str
    openid_return_to: str
    openid_response_nonce: str
    openid_assoc_handle: str
    openid_signed: str
    openid_sig: str


@router.get("/steam/auth-url")
def get_steam_auth_url(
    return_url: Optional[str] = Query(None, description="Custom return URL after auth"),
    current_user: User = Depends(security.get_current_user)
):
    """Get the Steam OpenID login URL."""
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
def steam_callback():
    """Steam OpenID callback (frontend handles actual validation)."""
    return {
        "message": "Steam callback - frontend handles OpenID validation",
        "flow": "Frontend extracts OpenID params and calls POST /steam/link"
    }


@router.post("/steam/link")
def link_steam_account(
    openid_params: OpenIDParams,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Link a Steam account after OpenID authentication."""
    if not settings.STEAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Steam integration is not configured"
        )
    
    query_params = {
        "openid.ns": openid_params.openid_ns,
        "openid.mode": openid_params.openid_mode,
        "openid.claimed_id": openid_params.openid_claimed_id,
        "openid.identity": openid_params.openid_identity,
        "openid.return_to": openid_params.openid_return_to,
        "openid.response_nonce": openid_params.openid_response_nonce,
        "openid.assoc_handle": openid_params.openid_assoc_handle,
        "openid.signed": openid_params.openid_signed,
        "openid.sig": openid_params.openid_sig,
    }
    if openid_params.openid_op_endpoint:
        query_params["openid.op_endpoint"] = openid_params.openid_op_endpoint
    
    try:
        steam_id = steam_service.validate_steam_callback(query_params)
        if not steam_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not validate Steam authentication"
            )
        
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


class SteamProfilePreview(BaseModel):
    """Steam profile preview for linking confirmation."""
    steam_id: str
    persona_name: str
    avatar_url: Optional[str] = None
    profile_url: Optional[str] = None
    game_count: Optional[int] = None


@router.get("/steam/preview/{identifier}", response_model=SteamProfilePreview)
def preview_steam_profile(
    identifier: str,
    current_user: User = Depends(security.get_current_user)
):
    """
    Preview a Steam profile before linking.
    
    Accepts: Steam64 ID, profile URL, custom URL, or vanity name.
    Returns profile info (avatar, name) for user confirmation.
    """
    if not settings.STEAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Steam integration is not configured"
        )
    
    # Resolve the identifier to a Steam64 ID
    steam_id = steam_service.extract_steam_id_from_input(identifier)
    
    if not steam_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not resolve Steam ID. Check the username or URL."
        )
    
    try:
        # Get profile summary
        profile = steam_service.get_steam_user_summary(steam_id)
        
        # Optionally get game count (fast, doesn't fetch full list)
        game_count = None
        try:
            games = steam_service.get_owned_games(steam_id)
            game_count = len(games) if games else 0
        except Exception:
            pass  # Non-critical, just skip if it fails
        
        return SteamProfilePreview(
            steam_id=steam_id,
            persona_name=profile.get("personaname", "Unknown"),
            avatar_url=profile.get("avatarfull") or profile.get("avatar"),
            profile_url=profile.get("profileurl"),
            game_count=game_count
        )
    except steam_service.SteamServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile not found or is private"
        )


@router.post("/steam/link-manual")

def link_steam_account_manual(
    request: SteamLinkManualRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Link a Steam account via manual ID, URL, or vanity name."""
    if not settings.STEAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Steam integration is not configured"
        )
    
    steam_id = steam_service.extract_steam_id_from_input(request.identifier)
    
    if not steam_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not resolve Steam ID. Please provide a valid SteamID64, Profile URL, or Custom URL name."
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


@router.get("/steam/library", response_model=List[SteamLibraryGame])
def get_steam_library(
    include_hidden: bool = Query(False, description="Include hidden/skipped games"),
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all games from the user's cached Steam library."""
    link = steam_service.get_steam_link(db, current_user.id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Steam account linked"
        )
    
    games = platform_sync_service.get_cached_games(
        db, current_user.id, platform='steam', include_hidden=include_hidden
    )
    
    return [
        SteamLibraryGame(
            platform_id=g.platform_id,
            platform_name=g.platform_name,
            igdb_id=g.igdb_id,
            igdb_name=g.igdb_name,
            igdb_cover_url=g.igdb_cover_url,
            image_url=g.platform_image_url,
            playtime_minutes=g.playtime_minutes or 0,
            last_played_at=g.last_played_at,
            match_confidence=g.match_confidence,
            match_method=g.match_method,
            status=g.status,
            platform_category="PC"
        )

        for g in games
    ]


@router.post("/steam/sync", response_model=SyncResponse)
def sync_steam_library(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Sync Steam library from Steam API to local cache."""
    link = steam_service.get_steam_link(db, current_user.id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Steam account linked"
        )
    
    try:
        # Get existing IGDB IDs for 'imported' status evaluation
        from ..models.user_game import UserGame
        existing_igdb_ids = set(
            igdb_id for (igdb_id,) in db.query(GameModel.igdb_id).join(
                UserGame, UserGame.game_id == GameModel.id
            ).filter(UserGame.user_id == current_user.id).all()
        )
        
        result = platform_sync_service.sync_steam_library(
            db=db,
            user_id=current_user.id,
            steam_id=link.platform_user_id,
            existing_igdb_ids=existing_igdb_ids
        )
        
        return SyncResponse(
            new_count=result["new_count"],
            updated_count=result["updated_count"],
            total_count=result["total_count"],
            message=f"Synced {result['total_count']} games from Steam ({result['new_count']} new)"
        )
    except steam_service.SteamServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Steam sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal sync error: {e}"
        )


@router.post("/steam/import", response_model=ImportResponse)
def import_steam_games(
    request: ImportGamesRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import matched Steam games to user library.
    Aggregates playtime from all platforms.
    """
    try:
        # Convert Pydantic models to dicts for the service
        games_dict = [g.dict() for g in request.games]
        
        imported, skipped = platform_sync_service.import_games_to_library(
            db=db,
            user_id=current_user.id,
            platform='steam',
            games_data=games_dict
        )
        
        return ImportResponse(
            imported=imported,
            skipped=skipped,
            message=f"Imported {imported} games to library"
        )
    except Exception as e:
        logger.error(f"[Steam Import] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/steam/preferences/skip")
def skip_steam_game(
    request: SkipGameRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Hide a Steam game from sync."""
    game = platform_sync_service.update_game_status(
        db, current_user.id, 'steam', request.platform_id, 'hidden'
    )
    if not game:
        raise HTTPException(status_code=404, detail="Game not found in sync cache")
    return {"message": "Game hidden"}


@router.post("/steam/preferences/match")
def fix_steam_match(
    request: FixMatchRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Manually match a Steam game to IGDB."""
    game = platform_sync_service.update_game_match(
        db, current_user.id, 'steam', request.platform_id,
        request.igdb_id, request.igdb_name, request.igdb_cover_url
    )
    if not game:
        raise HTTPException(status_code=404, detail="Game not found in sync cache")
    return {"message": "Match saved"}


@router.delete("/steam/preferences/{platform_id}")
def restore_steam_game(
    platform_id: str,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Restore a hidden Steam game."""
    game = platform_sync_service.update_game_status(
        db, current_user.id, 'steam', platform_id, 'pending'
    )
    if not game:
        raise HTTPException(status_code=404, detail="Game not found in sync cache")
    return {"message": "Game restored"}


@router.delete("/steam/cache")
def clear_steam_cache(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clear cached Steam library data.
    
    Use this to force a fresh sync after data structure changes.
    The next sync will re-fetch all games from Steam and re-match to IGDB.
    """
    from ..models.user_platform_game import UserPlatformGame
    
    deleted_count = db.query(UserPlatformGame).filter(
        UserPlatformGame.user_id == current_user.id,
        UserPlatformGame.platform == 'steam'
    ).delete()
    
    db.commit()
    
    logger.info(f"[Steam] Cache cleared for user {current_user.id}: {deleted_count} entries deleted")
    return {"message": f"Cleared {deleted_count} cached games. Re-sync to fetch fresh data."}



# ═══════════════════════════════════════════════════════════════════
# PSN Endpoints
# ═══════════════════════════════════════════════════════════════════

class PSNProfilePreview(BaseModel):
    """PSN profile preview for linking confirmation."""
    online_id: str
    account_id: Optional[str] = None
    avatar_url: Optional[str] = None
    trophy_level: Optional[int] = None
    platinum: int = 0
    gold: int = 0
    silver: int = 0
    bronze: int = 0


@router.get("/psn/preview/{username}", response_model=PSNProfilePreview)
def preview_psn_profile(
    username: str,
    current_user: User = Depends(security.get_current_user)
):
    """
    Preview a PSN profile before linking.
    
    Returns profile info (avatar, online_id) for user confirmation.
    """
    if not settings.PSN_NPSSO:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PSN integration is not configured"
        )
    
    try:
        profile = psn_service.get_psn_profile(username)
        return PSNProfilePreview(
            online_id=profile.get("online_id", username),
            account_id=profile.get("account_id"),
            avatar_url=profile.get("avatar_url"),
            trophy_level=profile.get("trophy_level"),
            platinum=profile.get("platinum", 0),
            gold=profile.get("gold", 0),
            silver=profile.get("silver", 0),
            bronze=profile.get("bronze", 0),
        )
    except psn_service.PSNServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile not found or is private: {username}"
        )


@router.post("/psn/link")
def link_psn_account(
    request: PSNLinkRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link a PSN account using your PSN username (Online ID).
    
    Note: Your PSN profile must be set to public for this to work.
    Returns avatar URL for visual confirmation.
    """
    if not settings.PSN_NPSSO:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PSN integration is not configured"
        )
    
    try:
        link = psn_service.link_psn_account(db, current_user.id, request.username)
        
        # Fetch profile with avatar for visual confirmation
        profile = psn_service.get_psn_profile(request.username)
        
        return {
            "message": "PSN account linked successfully",
            "platform_username": link.platform_username,
            "platform_user_id": link.platform_user_id,
            "avatar_url": profile.get("avatar_url")
        }
    except psn_service.PSNServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/psn/library", response_model=List[PSNLibraryGame])
def get_psn_library(
    include_hidden: bool = Query(False, description="Include hidden/skipped games"),
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cached PSN library from database.
    
    Returns games from local cache. Use POST /psn/sync to refresh from PSN.
    Fast (~50ms) because it reads from database, not PSN API.
    
    Games with the same IGDB ID are aggregated (PS4/PS5 versions combined).
    """
    from ..services import platform_sync_service
    
    link = psn_service.get_psn_link(db, current_user.id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No PSN account linked. Go to Settings to link your PSN."
        )
    
    # Get cached games from database
    games = platform_sync_service.get_cached_games(
        db, current_user.id, 'psn', include_hidden=include_hidden
    )
    
    # Aggregate by IGDB ID to combine PS4/PS5 versions of the same game
    # Games without IGDB match (igdb_id=None) stay separate
    aggregated = {}
    unmatched = []
    
    for g in games:
        category = _get_platform_category(g.platform_id)
        
        if g.igdb_id is None:
            # Unmatched games stay separate
            unmatched.append((g, category))
        elif g.igdb_id in aggregated:
            # Combine with existing entry
            existing = aggregated[g.igdb_id]
            existing["playtime_minutes"] += g.playtime_minutes or 0
            
            # Track all platform categories
            if category not in existing["_categories"]:
                existing["_categories"].add(category)
            
            # Keep the latest last_played_at
            if g.last_played_at:
                if not existing["last_played_at"] or g.last_played_at > existing["last_played_at"]:
                    existing["last_played_at"] = g.last_played_at
            
            # Keep higher confidence match
            if g.match_confidence and (not existing["match_confidence"] or g.match_confidence > existing["match_confidence"]):
                existing["match_confidence"] = g.match_confidence
                existing["match_method"] = g.match_method
            
            # If any version is imported, mark as imported
            if g.status == 'imported':
                existing["status"] = 'imported'
            # If any version is hidden, mark as hidden (unless imported)
            elif g.status == 'hidden' and existing["status"] != 'imported':
                existing["status"] = 'hidden'
        else:
            # First entry for this IGDB ID
            aggregated[g.igdb_id] = {
                "platform_id": g.platform_id,
                "platform_name": g.platform_name,
                "_categories": {category},
                "igdb_id": g.igdb_id,
                "igdb_name": g.igdb_name,
                "igdb_cover_url": g.igdb_cover_url,
                "image_url": g.platform_image_url,
                "playtime_minutes": g.playtime_minutes or 0,
                "last_played_at": g.last_played_at,
                "match_confidence": g.match_confidence,
                "match_method": g.match_method if g.status != 'hidden' else 'skipped',
                "status": g.status
            }
    
    # Build result from aggregated + unmatched
    result = []
    
    # Add aggregated matched games
    for data in aggregated.values():
        # Convert categories set to comma-separated string
        categories = sorted(data["_categories"])
        platform_category = ",".join(categories)
        
        result.append(PSNLibraryGame(
            platform_id=data["platform_id"],
            platform_name=data["platform_name"],
            platform_category=platform_category,
            igdb_id=data["igdb_id"],
            igdb_name=data["igdb_name"],
            igdb_cover_url=data["igdb_cover_url"],
            image_url=data["image_url"],
            playtime_minutes=data["playtime_minutes"],
            last_played_at=data["last_played_at"],
            match_confidence=data["match_confidence"],
            match_method=data["match_method"],
            status=data["status"]
        ))
    
    # Add unmatched games
    for g, category in unmatched:
        result.append(PSNLibraryGame(
            platform_id=g.platform_id,
            platform_name=g.platform_name,
            platform_category=category,
            igdb_id=g.igdb_id,
            igdb_name=g.igdb_name,
            igdb_cover_url=g.igdb_cover_url,
            image_url=g.platform_image_url,
            playtime_minutes=g.playtime_minutes or 0,
            last_played_at=g.last_played_at,
            match_confidence=g.match_confidence,
            match_method=g.match_method if g.status != 'hidden' else 'skipped',
            status=g.status
        ))
    
    logger.info(f"[PSN] Library read for user {current_user.id}: {len(result)} games (aggregated from {len(games)} entries)")
    return result


@router.post("/psn/sync", response_model=SyncResponse)
def sync_psn_library(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sync PSN library from PlayStation Network.
    
    Fetches games from PSN API, matches to IGDB, and caches in database.
    Returns delta info (new games, updated games).
    
    This is the slow operation (~10-20s) that calls the PSN API.
    After syncing, GET /psn/library will be fast.
    """
    from ..services import platform_sync_service
    
    link = psn_service.get_psn_link(db, current_user.id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No PSN account linked. Go to Settings to link your PSN."
        )
    
    try:
        # Get user's existing library igdb_ids for filtering
        existing_igdb_ids = set(
            igdb_id for (igdb_id,) in db.query(GameModel.igdb_id).join(
                UserGame, UserGame.game_id == GameModel.id
            ).filter(UserGame.user_id == current_user.id).all()
        )
        
        # Migrate any old preferences first
        platform_sync_service.migrate_preferences(db, current_user.id)
        
        # Sync with PSN
        result = platform_sync_service.sync_psn_library(
            db=db,
            user_id=current_user.id,
            username=link.platform_username,
            existing_igdb_ids=existing_igdb_ids
        )
        
        # Update last synced timestamp
        psn_service.update_last_synced(db, current_user.id)
        
        return SyncResponse(
            new_count=result["new_count"],
            updated_count=result["updated_count"],
            total_count=result["total_count"],
            message=f"Synced {result['total_count']} games from PlayStation ({result['new_count']} new)"
        )
        
    except psn_service.PSNServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )


@router.delete("/psn/cache")
def clear_psn_cache(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clear cached PSN library data.
    
    Use this to force a fresh sync after data structure changes.
    The next sync will re-fetch all games from PSN and re-match to IGDB.
    """
    from ..models.user_platform_game import UserPlatformGame
    
    deleted_count = db.query(UserPlatformGame).filter(
        UserPlatformGame.user_id == current_user.id,
        UserPlatformGame.platform == 'psn'
    ).delete()
    
    db.commit()
    
    logger.info(f"[PSN] Cache cleared for user {current_user.id}: {deleted_count} entries deleted")
    return {"message": f"Cleared {deleted_count} cached games. Re-sync to fetch fresh data."}


@router.post("/psn/import", response_model=ImportResponse)
def import_psn_games(
    request: ImportGamesRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import matched PSN games to user library.
    Aggregates playtime from all platforms.
    """
    try:
        # Convert Pydantic models to dicts for the service
        games_dict = [g.dict() for g in request.games]
        
        imported, skipped = platform_sync_service.import_games_to_library(
            db=db,
            user_id=current_user.id,
            platform='psn',
            games_data=games_dict
        )
        
        return ImportResponse(
            imported=imported,
            skipped=skipped,
            message=f"Imported {imported} games to library"
        )
    except Exception as e:
        logger.error(f"[PSN Import] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/psn/health")
def psn_health():
    """Check if PSN integration is healthy (NPSSO token valid)."""
    return psn_service.check_psn_health()


# ═══════════════════════════════════════════════════════════════════
# PSN Endpoints
# ═══════════════════════════════════════════════════════════════════


@router.post("/psn/preferences/skip")
def skip_psn_game(
    request: SkipGameRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a PSN game as hidden.
    
    The game will not appear in library sync unless include_hidden=True.
    """
    
    game = platform_sync_service.update_game_status(
        db, current_user.id, 'psn', request.platform_id, 'hidden'
    )
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found in sync cache. Try syncing first."
        )
    return {"message": "Game hidden", "platform_id": request.platform_id}


@router.post("/psn/preferences/match")
def fix_psn_match(
    request: FixMatchRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save a manual IGDB match for a PSN game.
    
    This override will persist across re-syncs.
    """
    
    game = platform_sync_service.update_game_match(
        db, current_user.id, 'psn', request.platform_id,
        request.igdb_id, request.igdb_name, request.igdb_cover_url
    )
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found in sync cache. Try syncing first."
        )
    return {
        "message": "Match saved", 
        "platform_id": request.platform_id, 
        "igdb_id": request.igdb_id
    }


@router.delete("/psn/preferences/{platform_id}")
def restore_psn_game(
    platform_id: str,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restore a hidden game (change status back to pending).
    """
    
    game = platform_sync_service.update_game_status(
        db, current_user.id, 'psn', platform_id, 'pending'
    )
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found in sync cache"
        )
    return {"message": "Game restored", "platform_id": platform_id}

# ═══════════════════════════════════════════════════════════════════
# Status & Unlink (Shared)
# ═══════════════════════════════════════════════════════════════════

@router.get("/status", response_model=IntegrationStatusResponse)
def get_integration_status(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get the status of all platform integrations for the current user."""
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
    """Unlink a platform account and clear all cached data."""
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
    
    # CRITICAL: Clear cached games to prevent stale data when re-linking
    deleted_count = platform_sync_service.delete_platform_games(db, current_user.id, platform)
    logger.info(f"[Unlink] Cleared {deleted_count} cached {platform} games for user {current_user.id}")
    
    return {"message": f"{platform.upper()} account unlinked successfully"}

