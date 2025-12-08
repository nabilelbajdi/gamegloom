from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
import logging
from datetime import datetime

from ..core import schemas
from ..models.user import User
from ..models.game import Game
from ..models.user_game import UserGame
from ...db_setup import get_db
from ..core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)

@router.get("/games", response_model=List[schemas.Game])
def get_recommended_games(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    """
    Get recommended games for the user.
    
    Currently uses a simplified heuristic (Top Rated games not in user's library)
    to ensure performance and stability.

    TODO: Restore AI-based recommendations in the future.
    The previous implementation used:
    - AIRecommender (SentenceTransformer)
    - SemanticAnalyzer (TF-IDF)
    - PreferenceAnalyzer
    
    This was temporarily removed to resolve blocking I/O and "stuck" recommendation issues.
    When restoring, ensure:
    1. Model inference runs in a separate thread/process (non-blocking).
    2. Caching is robust and correctly keyed.
    3. Randomization is applied to prevent stale results.
    """
    try:
        # Get user's existing game IDs to exclude them
        user_game_ids = (
            db.query(UserGame.game_id)
            .filter(UserGame.user_id == current_user.id)
            .all()
        )
        user_game_ids = [gid for (gid,) in user_game_ids]
        
        # Query for high-rated games not in user's library
        recommended_games = (
            db.query(Game)
            .filter(
                and_(
                    ~Game.id.in_(user_game_ids) if user_game_ids else True,
                    Game.total_rating >= 80,  # Only high quality games
                    Game.total_rating_count >= 50,  # Reliable ratings only
                    Game.first_release_date != None  # Released games only
                )
            )
            .order_by(Game.total_rating.desc())
            .limit(limit)
            .all()
        )
        
        # Shuffle specifically for recommendations to give some variety if we have enough
        import random
        if len(recommended_games) > 0:
            # Deterministic shuffle seeded by user_id + date to keep it consistent for the session
            # but different between users
            random.seed(current_user.id + datetime.now().toordinal())
            random.shuffle(recommended_games)

        logger.info(f"Returning {len(recommended_games)} simplified recommendations for user {current_user.username}")
        return recommended_games

    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating recommendations"
        )