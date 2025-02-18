# schemas.py
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class SimilarGame(BaseModel):
    """Schema for similar games linked to a main game."""
    id: int
    name: str
    cover_image: Optional[str] = None
    rating: Optional[float] = None
    genres: Optional[str] = None

class GameBase(BaseModel):
    """Base schema for game models."""
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
    developers: Optional[str] = None
    game_modes: Optional[str] = None
    player_perspectives: Optional[str] = None
    themes: Optional[str] = None
    
    first_release_date: Optional[datetime] = None
    
    screenshots: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    similar_games: Optional[List[SimilarGame]] = None

class GameCreate(GameBase):
    """Schema for creating a new game entry."""
    raw_data: Optional[Dict] = None

class GameUpdate(GameBase):
    """Schema for updating an existing game entry."""
    pass

class Game(GameBase):
    """Schema for reading game data, including timestamps."""
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
