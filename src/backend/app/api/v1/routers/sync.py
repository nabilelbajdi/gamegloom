# routers/sync.py
"""
Sync Router - API endpoints for syncing external platform games.

Endpoints:
- POST /sync/import - Import confirmed games to library
- PATCH /sync/games/{id} - Update game status/fix match
- POST /sync/{platform} - Sync games from platform
- GET /sync/{platform}/games - List synced games

NOTE: Static routes (/import, /games/{id}) MUST be defined before dynamic /{platform}
to prevent FastAPI from matching "import" or "games" as platform names.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from ...db_setup import get_db
from ..models.synced_game import SyncedGame, SyncStatus, TargetList
from ..models.user_game import UserGame, GameStatus
from ..services.sync_service import SyncService
from ..core.security import get_current_user


router = APIRouter(prefix="/sync", tags=["sync"])


# === Schemas ===

class SyncResponse(BaseModel):
    total: int
    new: int
    updated: int


class SyncedGameResponse(BaseModel):
    id: int
    platform: str
    platform_id: str
    platform_name: str
    igdb_id: Optional[int]
    igdb_name: Optional[str]
    igdb_cover_url: Optional[str]
    match_confidence: Optional[float]
    match_method: Optional[str]
    status: str
    target_list: Optional[str]
    playtime_minutes: Optional[int]
    image_url: Optional[str]
    
    class Config:
        from_attributes = True


class UpdateGameRequest(BaseModel):
    status: Optional[str] = None
    target_list: Optional[str] = None
    igdb_id: Optional[int] = None  # For fixing wrong matches


class ImportRequest(BaseModel):
    game_ids: List[int]


class ImportResponse(BaseModel):
    imported: int
    failed: int


# === Endpoints ===
# IMPORTANT: Static routes must come BEFORE dynamic /{platform} routes!

@router.post("/import", response_model=ImportResponse)
def import_confirmed_games(
    request: ImportRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Import confirmed synced games to user's library."""
    from ..models.game import Game
    from ..core import igdb_service as services
    
    imported = 0
    failed = 0
    
    for game_id in request.game_ids:
        synced = db.query(SyncedGame).filter(
            SyncedGame.id == game_id,
            SyncedGame.user_id == current_user.id,
            SyncedGame.status.in_([SyncStatus.CONFIRMED.value, SyncStatus.PENDING.value])
        ).first()
        
        if not synced or not synced.igdb_id:
            failed += 1
            continue
        
        # Look up the game in our database by igdb_id
        game = db.query(Game).filter(Game.igdb_id == synced.igdb_id).first()
        
        if not game:
            # Game not in our DB yet - fetch from IGDB and create
            try:
                igdb_data = services.fetch_from_igdb(game_id=synced.igdb_id)
                if igdb_data:
                    processed_data = services.process_igdb_data(igdb_data)
                    game = services.create_game(db, processed_data)
            except Exception as e:
                print(f"[Import] Failed to fetch IGDB data for {synced.igdb_id}: {e}")
                failed += 1
                continue
        
        if not game:
            failed += 1
            continue
        
        # Check if already in library (using game.id, not igdb_id)
        existing = db.query(UserGame).filter(
            UserGame.user_id == current_user.id,
            UserGame.game_id == game.id
        ).first()
        
        if existing:
            # Already in library, just mark as imported
            synced.status = SyncStatus.IMPORTED.value
            imported += 1
            continue
        
        # Add to library using game.id (foreign key to games table)
        try:
            game_status = GameStatus(synced.target_list) if synced.target_list else GameStatus.PLAYED
        except ValueError:
            game_status = GameStatus.PLAYED
        
        user_game = UserGame(
            user_id=current_user.id,
            game_id=game.id,
            status=game_status
        )
        db.add(user_game)
        
        # Mark as imported
        synced.status = SyncStatus.IMPORTED.value
        imported += 1
    
    db.commit()
    return ImportResponse(imported=imported, failed=failed)


@router.patch("/games/{game_id}", response_model=SyncedGameResponse)
def update_synced_game(
    game_id: int,
    request: UpdateGameRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update synced game status, target list, or fix wrong match."""
    service = SyncService(db)
    
    game = service.update_game_status(
        game_id=game_id,
        user_id=current_user.id,
        **request.model_dump(exclude_none=True)
    )
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return game


@router.delete("/games/{game_id}")
def delete_synced_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Permanently remove a game from sync list."""
    game = db.query(SyncedGame).filter(
        SyncedGame.id == game_id,
        SyncedGame.user_id == current_user.id
    ).first()
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    db.delete(game)
    db.commit()
    return {"deleted": True, "id": game_id}


# Dynamic routes with path parameters - MUST come after static routes!

@router.post("/{platform}", response_model=SyncResponse)
def sync_platform(
    platform: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Sync games from PSN or Steam.
    Fetches games, matches to IGDB, stores in synced_games table.
    """
    if platform not in ["psn", "steam"]:
        raise HTTPException(status_code=400, detail="Invalid platform. Use 'psn' or 'steam'")
    
    service = SyncService(db)
    
    if platform == "psn":
        # Get PSN username from user's linked account
        from ..models.user_platform_link import UserPlatformLink, PlatformType
        
        link = db.query(UserPlatformLink).filter(
            UserPlatformLink.user_id == current_user.id,
            UserPlatformLink.platform == PlatformType.PSN.value
        ).first()
        
        if not link or not link.platform_username:
            raise HTTPException(status_code=400, detail="PSN account not linked")
        
        result = service.sync_psn(current_user.id, link.platform_username)
        return SyncResponse(**result)
    
    # TODO: Implement Steam sync
    raise HTTPException(status_code=501, detail="Steam sync not yet implemented")


@router.get("/{platform}/games", response_model=List[SyncedGameResponse])
def get_synced_games(
    platform: str,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all synced games for a platform, optionally filtered by status."""
    service = SyncService(db)
    games = service.get_synced_games(current_user.id, platform, status)
    return games


