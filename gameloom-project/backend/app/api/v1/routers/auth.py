# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, and_, desc, union_all, select
from datetime import datetime, timedelta
from typing import List
import uuid

from ..core import schemas, security
from ..models.user import User
from ..models.user_game import UserGame, GameStatus
from ..models.review import Review, ReviewLike, ReviewComment
from ..models.game import Game
from ...db_setup import get_db

router = APIRouter(tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse)
async def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        # Create user with hashed password
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=security.get_password_hash(user_data.password)
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

@router.post("/login", response_model=schemas.TokenResponse)
async def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login and get an access token."""
    # Find user
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Verify password
    if not security.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create token
    token = security.create_token(db, user.id)
    return token

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user: User = Depends(security.get_current_user)):
    """Test endpoint to verify authentication."""
    return current_user

@router.patch("/me/profile", response_model=schemas.UserResponse)
async def update_user_profile(
    profile_data: schemas.UserProfileUpdate,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile information."""
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users/stats", response_model=schemas.UserStats)
async def get_user_stats(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics for the current user."""
    # Count games by status
    game_counts = db.query(
        UserGame.status, 
        func.count(UserGame.id).label("count")
    ).filter(
        UserGame.user_id == current_user.id
    ).group_by(
        UserGame.status
    ).all()
    
    # Initialize with default values
    stats = {
        "total_games": 0,
        "want_to_play_count": 0,
        "playing_count": 0,
        "played_count": 0,
        "reviews_count": 0,
        "average_rating": None,
        "lists_count": 0
    }
    
    # Update with actual counts
    for status, count in game_counts:
        stats["total_games"] += count
        if status == GameStatus.WANT_TO_PLAY:
            stats["want_to_play_count"] = count
        elif status == GameStatus.PLAYING:
            stats["playing_count"] = count
        elif status == GameStatus.PLAYED:
            stats["played_count"] = count
    
    # Get review stats
    reviews_count = db.query(func.count(Review.id)).filter(
        Review.user_id == current_user.id
    ).scalar()
    
    stats["reviews_count"] = reviews_count
    
    # Get average rating if user has reviews
    if reviews_count > 0:
        avg_rating = db.query(func.avg(Review.rating)).filter(
            Review.user_id == current_user.id
        ).scalar()
        stats["average_rating"] = round(avg_rating, 1) if avg_rating else None
    
    return schemas.UserStats(**stats)

@router.get("/users/activities", response_model=schemas.UserActivityResponse)
async def get_user_activities(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activities for the current user."""
    activities = []
    
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    # User games with their statuses
    user_games = (
        db.query(UserGame, Game)
        .join(Game, UserGame.game_id == Game.id)
        .filter(
            UserGame.user_id == current_user.id,
            UserGame.added_at >= thirty_days_ago
        )
        .order_by(desc(UserGame.updated_at))
        .all()
    )
    
    # Add game status activities
    for user_game, game in user_games:
        activities.append(schemas.UserActivity(
            id=f"game_status_{user_game.id}_{user_game.updated_at.timestamp()}",
            activity_type=schemas.ActivityType.GAME_STATUS_UPDATED,
            timestamp=user_game.updated_at,
            game=schemas.ActivityGameInfo(
                id=game.id,
                igdb_id=game.igdb_id,
                name=game.name,
                slug=game.slug,
                cover_image=game.cover_image
            ),
            game_status=user_game.status.value
        ))
    
    # User reviews
    reviews_created = (
        db.query(Review, Game)
        .join(Game, Review.game_id == Game.id)
        .filter(
            Review.user_id == current_user.id,
            Review.created_at >= thirty_days_ago
        )
        .order_by(desc(Review.created_at))
        .limit(20)
        .all()
    )
    
    # Add review activities
    for review, game in reviews_created:
        activities.append(schemas.UserActivity(
            id=f"review_created_{review.id}",
            activity_type=schemas.ActivityType.REVIEW_CREATED,
            timestamp=review.created_at,
            game=schemas.ActivityGameInfo(
                id=game.id,
                igdb_id=game.igdb_id,
                name=game.name,
                slug=game.slug,
                cover_image=game.cover_image
            ),
            review=schemas.ActivityReviewInfo(
                id=review.id,
                rating=review.rating,
                content=review.content,
                game=None
            ),
            review_content=review.content[:100] + ('...' if review.content and len(review.content) > 100 else '') if review.content else None
        ))
    
    # User comments on reviews
    comments = (
        db.query(ReviewComment, Review, Game, User)
        .join(Review, ReviewComment.review_id == Review.id)
        .join(Game, Review.game_id == Game.id)
        .join(User, Review.user_id == User.id)
        .filter(
            ReviewComment.user_id == current_user.id,
            ReviewComment.created_at >= thirty_days_ago
        )
        .order_by(desc(ReviewComment.created_at))
        .limit(20)
        .all()
    )
    
    # Add comment activities
    for comment, review, game, review_user in comments:
        activities.append(schemas.UserActivity(
            id=f"review_comment_{comment.id}",
            activity_type=schemas.ActivityType.REVIEW_COMMENTED,
            timestamp=comment.created_at,
            game=schemas.ActivityGameInfo(
                id=game.id,
                igdb_id=game.igdb_id,
                name=game.name,
                slug=game.slug,
                cover_image=game.cover_image
            ),
            review=schemas.ActivityReviewInfo(
                id=review.id,
                rating=review.rating,
                game=None
            ),
            comment_content=comment.content[:100] + ('...' if len(comment.content) > 100 else ''),
            target_username=review_user.username
        ))
    
    # Sort activities by timestamp (newest first) and apply limit
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    activities = activities[:limit]
    
    return schemas.UserActivityResponse(activities=activities) 