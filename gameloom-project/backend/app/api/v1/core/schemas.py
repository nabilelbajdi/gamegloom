from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class GameBase(BaseModel):
    igdb_id: int
    name: str = Field(..., min_length=1, max_length=100)
    summary: Optional[str] = None
    storyline: Optional[str] = None
    cover_image: Optional[str] = None
    rating: Optional[float] = None
    aggregated_rating: Optional[float] = None
    total_rating: Optional[float] = None
    total_rating_count: Optional[int] = None
    hypes: Optional[int] = None
    genres: Optional[str] = None
    platforms: Optional[str] = None
    first_release_date: Optional[datetime] = None
    screenshots: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    similar_games: Optional[List[int]] = None
    developers: Optional[str] = None
    game_modes: Optional[str] = None
    player_perspectives: Optional[str] = None
    themes: Optional[str] = None

class GameCreate(GameBase):
    raw_data: Optional[dict] = None

class GameUpdate(GameBase):
    pass

class Game(GameBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # For SQLAlchemy compatibility
