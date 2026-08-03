"""
Public lists router for community list browsing.
Endpoints for discovering, viewing, and liking public game lists.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, select
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

# A list earns "featured" on merit instead of a manually set flag: it needs a
# description and enough games to be worth opening. This keeps the Featured tab
# distinct from Popular, which sorts the same pool without filtering it.
FEATURED_MIN_GAMES = 5


def apply_featured_criteria(query):
    """Narrow a UserList query to lists good enough to surface as editor's picks."""
    game_count = (
        select(func.count(user_list_games.c.game_id))
        .where(user_list_games.c.user_list_id == UserList.id)
        .scalar_subquery()
    )
    return query.filter(
        UserList.description.isnot(None),
        func.length(func.trim(UserList.description)) > 0,
        game_count >= FEATURED_MIN_GAMES,
    )


def build_public_games_info(db: Session, user_list: UserList, limit: int = None,
                            include_artwork: bool = False):
    """Build list of GameBasicInfo for public list display.

    include_artwork attaches landscape artwork and screenshots, which the featured
    hero uses as a backdrop. Left off elsewhere to keep grid payloads small.
    """
    games_info = []
    games_to_process = user_list.games[:limit] if limit else user_list.games
    
    if not games_to_process:
        return games_info
    
    # Batch fetch all added_at timestamps in one query
    game_ids = [game.id for game in games_to_process]
    added_at_records = db.query(
        user_list_games.c.game_id,
        user_list_games.c.added_at
    ).filter(
        and_(
            user_list_games.c.user_list_id == user_list.id,
            user_list_games.c.game_id.in_(game_ids)
        )
    ).all()
    
    # Create lookup dict
    added_at_map = {record.game_id: record.added_at for record in added_at_records}
    
    for game in games_to_process:
        game_added_at = added_at_map.get(game.id, datetime.now(timezone.utc))
        
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
                status="in_list",
                artworks=game.artworks if include_artwork else None,
                screenshots=game.screenshots if include_artwork else None
            )
        )
    
    return games_info


def build_list_public_response(
    db: Session, 
    user_list: UserList, 
    current_user_id: Optional[int] = None,
    include_games: bool = True,
    game_limit: int = None,
    include_artwork: bool = False
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
    games = (
        build_public_games_info(db, user_list, game_limit, include_artwork)
        if include_games else []
    )
    
    return schemas.UserListPublic(
        id=user_list.id,
        name=user_list.name,
        description=user_list.description,
        user_id=user_list.user_id,
        is_public=user_list.is_public,
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
    sort: str = Query("popular", pattern="^(popular|recent|featured)$"),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get paginated public lists.
    
    Sort options:
    - popular: By likes count (descending)
    - recent: By updated date (descending)
    - featured: Only lists meeting the editor's-pick bar, best first
    
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
        # Filter before counting so pagination reflects the narrowed pool.
        query = apply_featured_criteria(query).order_by(
            desc(UserList.likes_count), desc(UserList.updated_at)
        )
    
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
    """Get editor's-pick lists for the browse hero and homepage display."""
    lists = apply_featured_criteria(
        db.query(UserList).filter(UserList.is_public == True)
    ).order_by(
        desc(UserList.likes_count),
        desc(UserList.updated_at)
    ).limit(limit).all()
    
    current_user_id = current_user.id if current_user else None
    return [
        build_list_public_response(db, lst, current_user_id, include_games=True,
                                   game_limit=5, include_artwork=True)
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

    # Recompute from the like rows so the counter can't drift
    db.flush()
    user_list.likes_count = db.query(func.count(ListLike.id)).filter(
        ListLike.list_id == list_id
    ).scalar() or 0

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

    # Recompute from the like rows so the counter can't drift
    db.flush()
    user_list.likes_count = db.query(func.count(ListLike.id)).filter(
        ListLike.list_id == list_id
    ).scalar() or 0

    db.commit()
    
    return schemas.ListLikeResponse(
        liked=False,
        likes_count=user_list.likes_count
    )
