from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List

from ..core import schemas
from ..models.user_game import UserGame, GameStatus
from ..models.game import Game
from ..models.user import User
from ...db_setup import get_db
from ..core.security import get_current_user

router = APIRouter(
    prefix="/user-games",
    tags=["user-games"]
)

@router.post("", response_model=schemas.UserGame)
def add_game_to_collection(
    game_data: schemas.UserGameCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a game to user's collection."""
    # Find game by IGDB ID
    game = db.query(Game).filter(Game.igdb_id == game_data.game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # Check if game is already in collection
    existing = db.query(UserGame).filter(
        and_(
            UserGame.user_id == current_user.id,
            UserGame.game_id == game.id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game already in collection"
        )
    
    # Create new user_game relationship
    db_user_game = UserGame(
        user_id=current_user.id,
        game_id=game.id,
        status=game_data.status
    )
    
    db.add(db_user_game)
    db.commit()
    db.refresh(db_user_game)
    return db_user_game

@router.get("/collection", response_model=schemas.UserGameResponse)
def get_user_collection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's game collection."""
    import sqlalchemy as sa
    user_games = db.query(UserGame, Game).options(
        sa.orm.joinedload(UserGame.game)
    ).join(
        Game, UserGame.game_id == Game.id
    ).filter(
        UserGame.user_id == current_user.id
    ).all()
    
    collection = schemas.UserGameResponse()
    
    for user_game, game in user_games:
        game_info = schemas.GameBasicInfo(
            id=game.igdb_id,
            igdb_id=game.igdb_id,
            name=game.name,
            slug=game.slug,
            coverImage=game.cover_image,
            genres=game.genres,
            themes=game.themes,
            platforms=game.platforms,
            game_modes=game.game_modes,
            player_perspectives=game.player_perspectives,
            rating="N/A" if not game.total_rating else format(float(game.total_rating) / 20, ".1f"),
            first_release_date=game.first_release_date,
            added_at=user_game.added_at,
            updated_at=user_game.updated_at,
            status=user_game.status,
            game_type_name=game.game_type_name,
            playtime_minutes=user_game.playtime_minutes,
            last_played_at=user_game.last_played_at
        )
        
        if user_game.status == GameStatus.WANT_TO_PLAY:
            collection.want_to_play.append(game_info)
        elif user_game.status == GameStatus.PLAYING:
            collection.playing.append(game_info)
        elif user_game.status == GameStatus.PLAYED:
            collection.played.append(game_info)
    
    return collection

@router.patch("/{igdb_id}", response_model=schemas.UserGame)
def update_game_status(
    igdb_id: int,
    game_data: schemas.UserGameUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the status of a game in user's collection."""
    game = db.query(Game).filter(Game.igdb_id == igdb_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )

    user_game = db.query(UserGame).filter(
        and_(
            UserGame.user_id == current_user.id,
            UserGame.game_id == game.id
        )
    ).first()
    
    if not user_game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found in collection"
        )
    
    user_game.status = game_data.status
    db.commit()
    db.refresh(user_game)
    return user_game

@router.delete("/all", status_code=status.HTTP_200_OK)
def clear_all_games(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove all games from user's collection."""
    deleted_count = db.query(UserGame).filter(
        UserGame.user_id == current_user.id
    ).delete()
    
    db.commit()
    return {"message": f"Cleared {deleted_count} games from your library", "count": deleted_count}


@router.delete("/{igdb_id}", status_code=status.HTTP_200_OK)
def remove_game_from_collection(
    igdb_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a game from user's collection."""
    game = db.query(Game).filter(Game.igdb_id == igdb_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )

    user_game = db.query(UserGame).filter(
        and_(
            UserGame.user_id == current_user.id,
            UserGame.game_id == game.id
        )
    ).first()
    
    if not user_game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found in collection"
        )
    
    db.delete(user_game)
    
    # Keep platform cache as-is; re-sync will reset to pending if needed

    db.commit()
    return {"message": "Game successfully removed from collection"} 