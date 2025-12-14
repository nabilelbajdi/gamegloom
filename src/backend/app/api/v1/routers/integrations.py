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
    username: str = Field(..., min_length=3, max_length=16, description="PSN Online ID (username)")


class SteamGame(BaseModel):
    """Steam game with playtime info."""
    appid: int
    name: str
    playtime_minutes: int
    img_icon_url: Optional[str] = None


class PSNGame(BaseModel):
    """PSN game from title stats with trophy mapping support."""
    title_id: str
    trophy_id: Optional[str] = None  # NPWR ID for mapping
    name: str  # Display name (IGDB name if mapped, otherwise PSN name)
    psn_name: Optional[str] = None  # Original PSN name
    igdb_id: Optional[int] = None  # Mapped IGDB ID if available
    igdb_name: Optional[str] = None  # Proper IGDB-formatted name
    image_url: Optional[str] = None
    play_duration_minutes: int = 0
    play_count: int = 0


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
def steam_callback():
    """
    Callback endpoint for Steam OpenID authentication.
    
    Note: Steam redirects here but frontend handles the actual callback since
    we need the JWT token context. This endpoint documents the expected flow.
    """
    return {
        "message": "Steam callback - frontend handles OpenID validation",
        "flow": "Frontend extracts OpenID params and calls POST /steam/link with full params"
    }


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


@router.post("/steam/link")
def link_steam_account(
    openid_params: OpenIDParams,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link a Steam account after OpenID authentication.
    
    Requires the full OpenID callback parameters for signature validation.
    This prevents malicious users from linking arbitrary Steam accounts.
    """
    if not settings.STEAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Steam integration is not configured"
        )
    
    # Convert Pydantic model to dict for validation
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
        # Validate OpenID response and extract Steam ID
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
    Link a PSN account using your PSN username (Online ID).
    
    Note: Your PSN profile must be set to public for this to work.
    """
    if not settings.PSN_NPSSO:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PSN integration is not configured"
        )
    
    try:
        link = psn_service.link_psn_account(db, current_user.id, request.username)
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
    Get all games from the user's linked PSN account.
    Uses trophy data for clean official game names.
    """
    link = psn_service.get_psn_link(db, current_user.id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No PSN account linked"
        )
    
    try:
        # Use new function that includes trophy IDs
        games = psn_service.get_games_with_trophy_ids(link.platform_username)
        
        # Look up existing mappings for each game
        from ..services import mapping_service
        
        result = []
        for g in games:
            # Check if we have a mapping for this trophy ID
            igdb_id = None
            igdb_name = None
            if g.get("trophy_id"):
                mapping_info = mapping_service.get_mapping_with_game_info(db, g["trophy_id"])
                if mapping_info:
                    igdb_id = mapping_info["igdb_id"]
                    igdb_name = mapping_info["igdb_name"]
            
            # Use IGDB name if available, otherwise use cleaned PSN name
            display_name = igdb_name if igdb_name else g["name"]
            
            result.append(PSNGame(
                title_id=g["title_id"],
                trophy_id=g.get("trophy_id"),
                name=display_name,
                psn_name=g.get("psn_name"),
                igdb_id=igdb_id,
                igdb_name=igdb_name,
                image_url=g.get("image_url"),
                play_duration_minutes=g.get("play_duration_minutes", 0),
                play_count=g.get("play_count", 0)
            ))
        
        return result
    except psn_service.PSNServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )


class SaveMappingRequest(BaseModel):
    """Request to save a PSN trophy ID to IGDB game ID mapping."""
    trophy_id: str
    igdb_id: int
    psn_name: str


@router.post("/psn/mapping")
def save_psn_mapping(
    request: SaveMappingRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save a PSN trophy ID to IGDB game ID mapping.
    Called after a successful game import to cache the match.
    """
    from ..services import mapping_service
    
    mapping = mapping_service.save_mapping(
        db=db,
        trophy_id=request.trophy_id,
        igdb_id=request.igdb_id,
        psn_name=request.psn_name,
        verified=False  # Auto-matched
    )
    
    return {"status": "saved", "trophy_id": request.trophy_id, "igdb_id": request.igdb_id}



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


# ============ MATCHING ENDPOINT ============

class MatchGameRequest(BaseModel):
    """Request to match a game to IGDB."""
    platform: str = Field(..., description="Platform: 'steam' or 'psn'")
    platform_id: str = Field(..., description="Platform's game ID (appid or title_id)")
    name: str = Field(..., description="Game name from platform")
    original_name: Optional[str] = None
    trophy_id: Optional[str] = None  # PSN trophy list ID for mapping


class MatchGameResponse(BaseModel):
    """Response with matched IGDB game info."""
    igdb_id: Optional[int] = None
    igdb_name: Optional[str] = None
    match_method: str  # cached, external_id, slug, search, fuzzy, none
    match_confidence: float  # 0.0 - 1.0
    matched: bool


class BatchGameItem(BaseModel):
    """Single game in a batch match request (uses top-level platform)."""
    platform_id: str = Field(..., description="Platform's game ID (appid or title_id)")
    name: str = Field(..., description="Game name from platform")
    original_name: Optional[str] = None
    trophy_id: Optional[str] = None  # PSN trophy list ID for mapping


class BatchMatchRequest(BaseModel):
    """Request to match multiple games."""
    platform: str = Field(..., description="Platform: 'steam' or 'psn'")
    games: list[BatchGameItem]


class BatchMatchResponse(BaseModel):
    """Response with batch match results."""
    results: list[MatchGameResponse]
    total: int
    matched: int
    unmatched: int


@router.post("/match", response_model=MatchGameResponse)
def match_game(
    request: MatchGameRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Match a single game to IGDB using enhanced matching.
    
    Priority order:
    1. Cache (psn_igdb_mappings table)
    2. External ID (IGDB external_games API)
    3. Slug lookup (local DB)
    4. Name search (local DB)
    5. Fuzzy matching (Levenshtein distance)
    """
    import logging
    logger = logging.getLogger(__name__)
    
    from ..integrations.igdb.matcher import IGDBMatcher
    from ..integrations.base import PlatformGame
    
    # Build PlatformGame object
    platform_game = PlatformGame(
        platform_id=request.platform_id,
        name=request.name,
        original_name=request.original_name,
        extra={"trophy_id": request.trophy_id} if request.trophy_id else {}
    )
    
    matcher = IGDBMatcher(db)
    result = matcher.match(platform_game, request.platform)
    
    # Log result for debugging
    if result.igdb_id:
        logger.info(f"[Match] ✓ '{request.name}' → {result.igdb_name} (method: {result.match_method}, conf: {result.match_confidence:.2f})")
    else:
        logger.warning(f"[Match] ✗ '{request.name}' - No match found (platform_id: {request.platform_id})")
    
    return MatchGameResponse(
        igdb_id=result.igdb_id,
        igdb_name=result.igdb_name,
        match_method=result.match_method,
        match_confidence=result.match_confidence,
        matched=result.igdb_id is not None
    )


@router.post("/match/batch", response_model=BatchMatchResponse)
def match_games_batch(
    request: BatchMatchRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Match multiple games to IGDB in a single request.
    
    More efficient than calling /match for each game individually.
    """
    from ..integrations.igdb.matcher import IGDBMatcher
    from ..integrations.base import PlatformGame
    
    matcher = IGDBMatcher(db)
    results = []
    matched_count = 0
    
    for game in request.games:
        platform_game = PlatformGame(
            platform_id=game.platform_id,
            name=game.name,
            original_name=game.original_name,
            extra={"trophy_id": game.trophy_id} if game.trophy_id else {}
        )
        
        result = matcher.match(platform_game, request.platform)
        results.append(MatchGameResponse(
            igdb_id=result.igdb_id,
            igdb_name=result.igdb_name,
            match_method=result.match_method,
            match_confidence=result.match_confidence,
            matched=result.igdb_id is not None
        ))
        
        if result.igdb_id is not None:
            matched_count += 1
    
    return BatchMatchResponse(
        results=results,
        total=len(request.games),
        matched=matched_count,
        unmatched=len(request.games) - matched_count
    )
