from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Dict, Tuple
from collections import Counter
import logging
from datetime import datetime

from ..core import schemas
from ..models.user import User
from ..models.game import Game
from ..models.user_game import UserGame, GameStatus
from ...db_setup import get_db
from ..core.security import get_current_user

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)

def get_user_genre_preferences(db: Session, user_id: int) -> Dict[str, int]:
    """
    Analyze user's game collection to build a genre preference profile.
    Returns a dictionary of genres and their counts.
    """
    user_games = (
        db.query(Game)
        .join(UserGame)
        .filter(UserGame.user_id == user_id)
        .all()
    )
    
    genre_counts = Counter()
    for game in user_games:
        if game.genres:
            genres = [g.strip() for g in game.genres.split(',')]
            genre_counts.update(genres)
    
    logger.debug(f"User {user_id} genre preferences: {dict(genre_counts)}")
    return dict(genre_counts)

def get_user_platform_preferences(db: Session, user_id: int) -> Dict[str, int]:
    """
    Analyze user's game collection to build a platform preference profile.
    Returns a dictionary of platforms and their counts.
    """
    user_games = (
        db.query(Game)
        .join(UserGame)
        .filter(UserGame.user_id == user_id)
        .all()
    )
    
    platform_counts = Counter()
    for game in user_games:
        if game.platforms:
            platforms = [p.strip() for p in game.platforms.split(',')]
            platform_counts.update(platforms)
    
    logger.debug(f"User {user_id} platform preferences: {dict(platform_counts)}")
    return dict(platform_counts)

def calculate_release_date_score(release_date: datetime | None) -> float:
    """
    Calculate a score based on the game's release date.
    Recent games get higher scores, with a gradual decrease for older games.
    
    Args:
        release_date: The game's release date
        
    Returns:
        float: Score between 0 and 1, where 1 is most recent
    """
    if not release_date:
        return 0.5
    
    now = datetime.utcnow()
    years_old = (now - release_date).days / 365.25
    
    if years_old <= 2:
        return 1.0
    elif years_old <= 10:
        return 0.8 - (years_old - 2) * 0.05
    else:
        return 0.4 - min(0.3, (years_old - 10) * 0.02)

def calculate_platform_score(game: Game, platform_preferences: Dict[str, int], max_count: int) -> float:
    """
    Calculate a score based on platform compatibility.
    Games available on user's preferred platforms get higher scores.
    
    Args:
        game: The game to score
        platform_preferences: Dictionary of user's platform preferences and their counts
        max_count: The count of the most preferred platform (used for normalization)
        
    Returns:
        float: Score between 0 and 1, where 1 is best match
    """
    if not game.platforms:
        return 0.0
    
    game_platforms = [p.strip() for p in game.platforms.split(',')]
    platform_score = 0.0
    
    for platform in game_platforms:
        if platform in platform_preferences:
            platform_weight = platform_preferences[platform] / max_count
            platform_score += platform_weight
    
    if len(game_platforms) > 0:
        platform_score = platform_score / len(game_platforms)
    
    return platform_score

def calculate_game_score(game: Game, genre_preferences: Dict[str, int], platform_preferences: Dict[str, int], max_genre_count: int, max_platform_count: int) -> Tuple[float, float, float, float]:
    """
    Calculate scores for a game based on genre preferences, platform preferences, release date, and ratings.
    
    Args:
        game: The game to score
        genre_preferences: Dictionary of user's genre preferences and their counts
        platform_preferences: Dictionary of user's platform preferences and their counts
        max_genre_count: The count of the most preferred genre (used for normalization)
        max_platform_count: The count of the most preferred platform (used for normalization)
        
    Returns:
        Tuple[float, float, float, float]: (genre_score, platform_score, release_date_score, rating_score)
        All scores are between 0 and 1, where 1 is the best match
    """
    if not game.genres:
        genre_score = 0.0
    else:
        game_genres = [g.strip() for g in game.genres.split(',')]
        genre_score = 0.0
        
        for genre in game_genres:
            if genre in genre_preferences:
                genre_weight = genre_preferences[genre] / max_genre_count
                genre_score += genre_weight
        
        if len(game_genres) > 0:
            genre_score = genre_score / len(game_genres)
    
    platform_score = calculate_platform_score(game, platform_preferences, max_platform_count)
    release_date_score = calculate_release_date_score(game.first_release_date)
    
    rating_score = 0.0
    if game.total_rating and game.total_rating_count:
        normalized_rating = game.total_rating / 100
        rating_reliability = min(1.0, game.total_rating_count / 500)
        rating_score = normalized_rating * rating_reliability
    
    return (genre_score, platform_score, release_date_score, rating_score)

@router.get("/games", response_model=List[schemas.GameBasicInfo])
async def get_recommended_games(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10,
    min_score: float = 0.3,  # Minimum genre match score (0-1)
    min_rating: float = 3.5  # Minimum rating required (0-100)
):
    """
    Get personalized game recommendations based on genre preferences, platform preferences, ratings, and release date.
    
    Args:
        current_user: The authenticated user requesting recommendations
        db: Database session
        limit: Maximum number of recommendations to return (default: 10)
        min_score: Minimum genre match score required (default: 0.3)
        min_rating: Minimum rating required (default: 3.5)
        
    Returns:
        List[GameBasicInfo]: List of recommended games
        
    Raises:
        HTTPException: If no genre preferences are found or if there's an error
    """
    genre_preferences = get_user_genre_preferences(db, current_user.id)
    platform_preferences = get_user_platform_preferences(db, current_user.id)
    
    if not genre_preferences:
        logger.info(f"No genre preferences found for user: {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No genre preferences found. Try adding some games to your collection first!"
        )
    
    user_game_ids = (
        db.query(Game.id)
        .join(UserGame)
        .filter(UserGame.user_id == current_user.id)
        .all()
    )
    user_game_ids = [g[0] for g in user_game_ids]
    
    max_genre_count = max(genre_preferences.values())
    max_platform_count = max(platform_preferences.values()) if platform_preferences else 1
    
    genre_conditions = [Game.genres.like(f"%{genre}%") for genre in genre_preferences.keys()]
    
    try:
        candidate_games = (
            db.query(Game)
            .filter(
                and_(
                    or_(*genre_conditions),
                    ~Game.id.in_(user_game_ids),
                    Game.game_type_id == 0,
                    Game.first_release_date <= datetime.utcnow(),
                    Game.total_rating >= min_rating,
                    Game.total_rating_count >= 50
                )
            )
            .all()
        )
        
        scored_games = [
            (
                game,
                *calculate_game_score(game, genre_preferences, platform_preferences, max_genre_count, max_platform_count)
            )
            for game in candidate_games
        ]
        
        recommended_games = [
            game for game, genre_score, platform_score, release_score, rating_score in sorted(
                scored_games,
                key=lambda x: (0.25 * x[1] + 0.25 * x[2] + 0.3 * x[3] + 0.2 * x[4], x[0].total_rating or 0),
                reverse=True
            )
            if genre_score >= min_score and platform_score > 0
        ][:limit]
        
        formatted_recommendations = []
        current_time = datetime.utcnow()
        
        for game in recommended_games:
            formatted_game = schemas.GameBasicInfo(
                id=game.id,
                igdb_id=game.igdb_id,
                name=game.name,
                slug=game.slug,
                coverImage=game.cover_image,
                genres=game.genres,
                themes=game.themes,
                platforms=game.platforms,
                game_modes=game.game_modes,
                player_perspectives=game.player_perspectives,
                rating=str(game.total_rating) if game.total_rating else None,
                first_release_date=game.first_release_date,
                added_at=current_time,
                updated_at=current_time,
                status=GameStatus.WANT_TO_PLAY
            )
            formatted_recommendations.append(formatted_game)
        
        logger.info(f"Generated {len(formatted_recommendations)} recommendations for user {current_user.username}")
        return formatted_recommendations
        
    except Exception as e:
        logger.error(f"Error generating recommendations for user {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating recommendations"
        ) 