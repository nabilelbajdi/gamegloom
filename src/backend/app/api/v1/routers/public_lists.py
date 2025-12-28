"""
Public lists router for community list browsing.
Endpoints for discovering, viewing, and liking public game lists.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import List, Optional
from datetime import datetime, timezone

from ..core import schemas
from ..models.user_list import UserList, user_list_games, ListLike
from ..models.game import Game
from ..models.user import User
from ...db_setup import get_db
from ..core.security import get_current_user, get_current_user_optional

router = APIRouter(
    prefix="/lists",
    tags=["lists"]
)


def build_public_games_info(db: Session, user_list: UserList, limit: int = None):
    """Build list of GameBasicInfo for public list display."""
    games_info = []
    games_to_process = user_list.games[:limit] if limit else user_list.games
    
    for game in games_to_process:
        # Get added_at from association table
        game_in_list = db.query(user_list_games).filter(
            and_(
                user_list_games.c.user_list_id == user_list.id,
                user_list_games.c.game_id == game.id
            )
        ).first()
        game_added_at = game_in_list.added_at if game_in_list else datetime.now(timezone.utc)
        
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
                updated_at=datetime.now(timezone.utc),
                status="in_list"
            )
        )
    
    return games_info


def build_list_public_response(
    db: Session, 
    user_list: UserList, 
    current_user_id: Optional[int] = None,
    include_games: bool = True,
    game_limit: int = None
) -> schemas.UserListPublic:
    """Build a UserListPublic response with creator info and like status."""
    # Get creator info
    creator = db.query(User).filter(User.id == user_list.user_id).first()
    creator_info = schemas.UserListCreator(
        id=creator.id,
        username=creator.username,
        avatar=creator.avatar
    ) if creator else None
    
    # Check if current user liked this list
    user_liked = False
    if current_user_id:
        like = db.query(ListLike).filter(
            and_(
                ListLike.list_id == user_list.id,
                ListLike.user_id == current_user_id
            )
        ).first()
        user_liked = like is not None
    
    # Get games if requested
    games = build_public_games_info(db, user_list, game_limit) if include_games else []
    
    return schemas.UserListPublic(
        id=user_list.id,
        name=user_list.name,
        description=user_list.description,
        user_id=user_list.user_id,
        is_public=user_list.is_public,
        is_featured=user_list.is_featured,
        likes_count=user_list.likes_count,
        created_at=user_list.created_at,
        updated_at=user_list.updated_at,
        games=games,
        creator=creator_info,
        user_liked=user_liked,
        game_count=len(user_list.games)
    )


@router.get("", response_model=schemas.PublicListsResponse)
async def get_public_lists(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    sort: str = Query("popular", regex="^(popular|recent|featured)$"),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get paginated public lists.
    
    Sort options:
    - popular: By likes count (descending)
    - recent: By updated date (descending)
    - featured: Featured lists first, then by likes
    
    Search:
    - Searches list name and description (case-insensitive)
    """
    # Base query for public lists
    query = db.query(UserList).filter(UserList.is_public == True)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            func.lower(UserList.name).like(search_term) |
            func.lower(UserList.description).like(search_term)
        )
    
    # Apply sorting
    if sort == "popular":
        query = query.order_by(desc(UserList.likes_count), desc(UserList.updated_at))
    elif sort == "recent":
        query = query.order_by(desc(UserList.updated_at))
    elif sort == "featured":
        query = query.order_by(desc(UserList.is_featured), desc(UserList.likes_count))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * per_page
    lists = query.offset(offset).limit(per_page).all()
    
    # Build response with creator info
    current_user_id = current_user.id if current_user else None
    lists_response = [
        build_list_public_response(db, lst, current_user_id, include_games=True, game_limit=5)
        for lst in lists
    ]
    
    return schemas.PublicListsResponse(
        lists=lists_response,
        total=total,
        page=page,
        per_page=per_page,
        has_more=(offset + len(lists)) < total
    )


@router.get("/featured", response_model=List[schemas.UserListPublic])
async def get_featured_lists(
    limit: int = Query(10, ge=1, le=20),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get featured/popular lists for homepage display."""
    lists = db.query(UserList).filter(
        UserList.is_public == True
    ).order_by(
        desc(UserList.is_featured),
        desc(UserList.likes_count)
    ).limit(limit).all()
    
    current_user_id = current_user.id if current_user else None
    return [
        build_list_public_response(db, lst, current_user_id, include_games=True, game_limit=5)
        for lst in lists
    ]


@router.get("/{list_id}", response_model=schemas.UserListPublic)
async def get_public_list(
    list_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get a single public list by ID."""
    user_list = db.query(UserList).filter(
        and_(
            UserList.id == list_id,
            UserList.is_public == True
        )
    ).first()
    
    if not user_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found or not public"
        )
    
    current_user_id = current_user.id if current_user else None
    return build_list_public_response(db, user_list, current_user_id, include_games=True)


@router.post("/{list_id}/like", response_model=schemas.ListLikeResponse)
async def like_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like a public list."""
    # Check if list exists and is public
    user_list = db.query(UserList).filter(
        and_(
            UserList.id == list_id,
            UserList.is_public == True
        )
    ).first()
    
    if not user_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found or not public"
        )
    
    # Check if already liked
    existing_like = db.query(ListLike).filter(
        and_(
            ListLike.list_id == list_id,
            ListLike.user_id == current_user.id
        )
    ).first()
    
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already liked this list"
        )
    
    # Create like
    new_like = ListLike(
        user_id=current_user.id,
        list_id=list_id
    )
    db.add(new_like)
    
    # Increment likes count
    user_list.likes_count += 1
    
    db.commit()
    
    return schemas.ListLikeResponse(
        liked=True,
        likes_count=user_list.likes_count
    )


@router.delete("/{list_id}/like", response_model=schemas.ListLikeResponse)
async def unlike_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlike a public list."""
    # Check if list exists
    user_list = db.query(UserList).filter(UserList.id == list_id).first()
    
    if not user_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )
    
    # Find the like
    existing_like = db.query(ListLike).filter(
        and_(
            ListLike.list_id == list_id,
            ListLike.user_id == current_user.id
        )
    ).first()
    
    if not existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Haven't liked this list"
        )
    
    # Remove like
    db.delete(existing_like)
    
    # Decrement likes count (ensure it doesn't go below 0)
    user_list.likes_count = max(0, user_list.likes_count - 1)
    
    db.commit()
    
    return schemas.ListLikeResponse(
        liked=False,
        likes_count=user_list.likes_count
    )
