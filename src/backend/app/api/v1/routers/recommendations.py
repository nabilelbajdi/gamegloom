from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from ..core import schemas, recommendation_service, cache
from ..models.user import User
from ...db_setup import get_db
from ...settings import settings
from ..core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)


@router.get("/games", response_model=List[schemas.Game])
async def get_recommended_games(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    """Content-based recommendations from the user's onboarding picks + library.

    Scores candidates by genre/theme overlap and IGDB-similarity, excluding games
    already in the library; falls back to top-rated when there's no taste signal.
    A fixed top slice is cached per user (invalidated when preferences change).
    """
    try:
        async def producer():
            games = recommendation_service.recommend_games(
                db, current_user.id, current_user.preferences, limit=50
            )
            return [schemas.Game.model_validate(g).model_dump(mode="json") for g in games]

        cached = await cache.cached_json(
            f"recs:user:{current_user.id}", settings.DISCOVERY_CACHE_TTL, producer
        )
        return cached[:limit]
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating recommendations",
        )
