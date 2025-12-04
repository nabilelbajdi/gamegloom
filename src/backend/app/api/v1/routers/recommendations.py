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
from ..recommendations.ai_recommender import AIRecommender
from ..recommendations.semantic_analyzer import SemanticAnalyzer
from ..recommendations.preference_analyzer import PreferenceAnalyzer

logger = logging.getLogger(__name__)

# Initialize recommender and analyzers
ai_recommender = AIRecommender()
semantic_analyzer = SemanticAnalyzer()
preference_analyzer = PreferenceAnalyzer()

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

def calculate_game_score(game: Game, preferences: PreferenceAnalyzer, semantic_scores: Dict[int, float]) -> Dict[str, float]:
    """
    Calculate comprehensive game scores based on multiple factors.
    
    Returns:
        Dict[str, float]: Dictionary of scores for each category
    """
    scores = {key: 0.0 for key in [
        "genre", "theme", "keyword", "semantic", "platform", "game_modes",
        "perspective", "rating", "rating_reliability", "developer",
        "release", "franchise", "similar"
    ]}

    # Process fields with common pattern
    fields = {
        "genre": (game.genres, "genres"),
        "theme": (game.themes, "themes"),
        "keyword": (game.keywords, "keywords"),
        "platform": (game.platforms, "platforms"),
        "game_modes": (game.game_modes, "game_modes"),
        "perspective": (game.player_perspectives, "player_perspectives"),
        "developer": (game.developers, "developers"),
        "franchise": ([game.franchise] if game.franchise else [], "franchises")
    }

    for score_key, (value, pref_key) in fields.items():
        if isinstance(value, str):
            items = [item.strip() for item in value.split(',')]
        elif isinstance(value, list):
            items = value
        else:
            items = []
        scores[score_key] = preferences.calculate_preference_score(game, pref_key, items)

    # Special scores
    scores["semantic"] = semantic_scores.get(game.id, 0.0)
    scores["rating"] = game.total_rating / 100 if game.total_rating else 0.0
    scores["rating_reliability"] = min(1.0, (game.total_rating_count or 0) / 500)
    scores["release"] = calculate_release_date_score(game.first_release_date)
    scores["similar"] = min(1.0, len(game.similar_games or []) / 5)

    return scores

@router.get("/games", response_model=List[schemas.Game])
async def get_recommended_games(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    min_score: float = 0.3,
    min_rating: float = 3.5,
    ai_weight: float = 0.2
):
    """
    Get personalized game recommendations using enhanced scoring system:
    
    Content Matching (45% total):
    - Genre match (15%)
    - Theme match (10%)
    - Keyword match (10%)
    - Semantic similarity (10%)
    
    Technical Aspects (20% total):
    - Platform compatibility (10%)
    - Game modes match (5%)
    - Player perspective match (5%)
    
    Quality Indicators (20% total):
    - Rating score (10%)
    - Rating reliability (5%)
    - Developer track record (5%)
    
    Discovery Factors (15% total):
    - Release date relevance (5%)
    - Franchise/collection match (5%)
    - Similar games (5%)
    """
    user_games = (
        db.query(Game)
        .join(UserGame)
        .filter(UserGame.user_id == current_user.id)
        .all()
    )
    
    if not user_games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No games found in your collection. Add some games first!"
        )
    
    user_game_ids = [game.id for game in user_games]
    preference_analyzer.analyze_user_games(user_games)
    
    try:
        candidate_games = (
            db.query(Game)
            .filter(
                and_(
                    ~Game.id.in_(user_game_ids),
                    Game.game_type_id == 0,
                    Game.first_release_date <= datetime.utcnow(),
                    Game.total_rating >= min_rating,
                    Game.total_rating_count >= 50
                )
            )
            .all()
        )
        
        semantic_scores = semantic_analyzer.calculate_semantic_similarities(
            user_games, candidate_games
        )
        
        weights = {
            'genre': 0.15, 'theme': 0.10, 'keyword': 0.10, 'semantic': 0.10,  # Content (45%)
            'platform': 0.10, 'game_modes': 0.05, 'perspective': 0.05,  # Technical (20%)
            'rating': 0.10, 'rating_reliability': 0.05, 'developer': 0.05,  # Quality (20%)
            'release': 0.05, 'franchise': 0.05, 'similar': 0.05  # Discovery (15%)
        }
        
        scored_games = []
        for game in candidate_games:
            scores = calculate_game_score(game, preference_analyzer, semantic_scores)
            total_score = sum(weights[category] * score for category, score in scores.items())
            scored_games.append((game, total_score, scores))
        
        ai_scores = ai_recommender.calculate_ai_scores(user_games, candidate_games)
        sorted_games = sorted(
            scored_games,
            key=lambda x: (1 - ai_weight) * x[1] + ai_weight * ai_scores[x[0].id],
            reverse=True
        )
        
        recommended_games = []
        seen_franchises = set()
        
        for game, _, scores in sorted_games:
            if scores['genre'] < min_score:
                continue
                
            franchises = set()
            if game.franchise:
                franchises.add(game.franchise)
            if game.franchises:
                franchises.update(game.franchises)
                
            if not franchises or not (franchises & seen_franchises):
                recommended_games.append(game)
                seen_franchises.update(franchises)
            
            if len(recommended_games) >= limit:
                break
            
        if len(recommended_games) < limit:
            remaining_games = [
                game for game, _, scores in sorted_games 
                if game not in recommended_games 
                and scores['genre'] >= min_score
            ]
            recommended_games.extend(remaining_games[:limit - len(recommended_games)])
        
        logger.info(f"Generated {len(recommended_games)} recommendations for user {current_user.username}")
        return recommended_games
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating recommendations"
        )