from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timezone

from ..core import schemas
from ..models.user_list import UserList, user_list_games
from ..models.game import Game
from ..models.user import User
from ...db_setup import get_db
from ..core.security import get_current_user

router = APIRouter(
    prefix="/user-lists",
    tags=["user-lists"]
)

# Helper function to build game info with proper timestamps
def build_games_info(db: Session, user_list: UserList, list_id: int, newly_added_game_id: Optional[int] = None):
    """
    Build list of GameBasicInfo objects with proper timestamps for all games in a list.
    
    Args:
        db: Database session
        user_list: UserList object
        list_id: ID of the list
        newly_added_game_id: Optional ID of a newly added game
    
    Returns:
        List of GameBasicInfo objects
    """
    current_time = datetime.now(timezone.utc)
    games_info = []
    
    for game in user_list.games:
        if newly_added_game_id and game.igdb_id == newly_added_game_id:
            game_added_at = current_time
        else:
            game_in_list = db.query(user_list_games).filter(
                and_(
                    user_list_games.c.user_list_id == list_id,
                    user_list_games.c.game_id == game.id
                )
            ).first()
            game_added_at = game_in_list.added_at if game_in_list else current_time
        
        games_info.append(
            schemas.GameBasicInfo(
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
                added_at=game_added_at,
                updated_at=current_time,
                status="in_list"
            )
        )
    
    return games_info

@router.post("", response_model=schemas.UserList)
async def create_user_list(
    list_data: schemas.UserListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new user list."""
    db_list = UserList(
        name=list_data.name,
        description=list_data.description,
        user_id=current_user.id
    )
    
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    
    return schemas.UserList(
        id=db_list.id,
        name=db_list.name,
        description=db_list.description,
        user_id=db_list.user_id,
        created_at=db_list.created_at,
        updated_at=db_list.updated_at,
        games=[]
    )

@router.get("", response_model=schemas.UserListsResponse)
async def get_user_lists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lists for the current user."""
    user_lists = db.query(UserList).filter(UserList.user_id == current_user.id).all()
    
    lists_response = []
    for user_list in user_lists:
        lists_response.append(
            schemas.UserList(
                id=user_list.id,
                name=user_list.name,
                description=user_list.description,
                user_id=user_list.user_id,
                created_at=user_list.created_at,
                updated_at=user_list.updated_at,
                games=[]
            )
        )
    
    return {"lists": lists_response}

@router.get("/{list_id}", response_model=schemas.UserList)
async def get_user_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific user list."""
    user_list = db.query(UserList).filter(
        and_(
            UserList.id == list_id,
            UserList.user_id == current_user.id
        )
    ).first()
    
    if not user_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )
    
    games_info = build_games_info(db, user_list, list_id)
    
    return schemas.UserList(
        id=user_list.id,
        name=user_list.name,
        description=user_list.description,
        user_id=user_list.user_id,
        created_at=user_list.created_at,
        updated_at=user_list.updated_at,
        games=games_info
    )

@router.patch("/{list_id}", response_model=schemas.UserList)
async def update_user_list(
    list_id: int,
    list_data: schemas.UserListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a user list."""
    user_list = db.query(UserList).filter(
        and_(
            UserList.id == list_id,
            UserList.user_id == current_user.id
        )
    ).first()
    
    if not user_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )
    
    if list_data.name is not None:
        user_list.name = list_data.name
    if list_data.description is not None:
        user_list.description = list_data.description
    
    db.commit()
    db.refresh(user_list)
    
    games_info = build_games_info(db, user_list, list_id)
    
    return schemas.UserList(
        id=user_list.id,
        name=user_list.name,
        description=user_list.description,
        user_id=user_list.user_id,
        created_at=user_list.created_at,
        updated_at=user_list.updated_at,
        games=games_info
    )

@router.delete("/{list_id}", status_code=status.HTTP_200_OK)
async def delete_user_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user list."""
    user_list = db.query(UserList).filter(
        and_(
            UserList.id == list_id,
            UserList.user_id == current_user.id
        )
    ).first()
    
    if not user_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )
    
    db.delete(user_list)
    db.commit()
    return {"message": "List successfully deleted"}

@router.post("/{list_id}/games", response_model=schemas.UserList)
async def add_game_to_list(
    list_id: int,
    game_data: schemas.AddGameToListRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a game to a user list."""
    user_list = db.query(UserList).filter(
        and_(
            UserList.id == list_id,
            UserList.user_id == current_user.id
        )
    ).first()
    
    if not user_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )
    
    game = db.query(Game).filter(Game.igdb_id == game_data.game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    if game in user_list.games:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game already in list"
        )
    
    user_list.games.append(game)
    db.commit()
    db.refresh(user_list)
    
    games_info = build_games_info(db, user_list, list_id, game.igdb_id)
    
    return schemas.UserList(
        id=user_list.id,
        name=user_list.name,
        description=user_list.description,
        user_id=user_list.user_id,
        created_at=user_list.created_at,
        updated_at=user_list.updated_at,
        games=games_info
    )

@router.delete("/{list_id}/games/{game_id}", response_model=schemas.UserList)
async def remove_game_from_list(
    list_id: int,
    game_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a game from a user list."""
    user_list = db.query(UserList).filter(
        and_(
            UserList.id == list_id,
            UserList.user_id == current_user.id
        )
    ).first()
    
    if not user_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )
    
    game = db.query(Game).filter(Game.igdb_id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    if game not in user_list.games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found in list"
        )
    
    user_list.games.remove(game)
    db.commit()
    db.refresh(user_list)
    
    games_info = build_games_info(db, user_list, list_id)
    
    return schemas.UserList(
        id=user_list.id,
        name=user_list.name,
        description=user_list.description,
        user_id=user_list.user_id,
        created_at=user_list.created_at,
        updated_at=user_list.updated_at,
        games=games_info
    ) 