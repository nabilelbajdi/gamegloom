from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class GameBase(BaseModel):
    igdb_id: int
    name: str
    summary: Optional[str] = None
    storyline: Optional[str] = None
    first_release_date: Optional[datetime] = None
    rating: Optional[float] = None
    aggregated_rating: Optional[float] = None
    total_rating: Optional[float] = None
    total_rating_count: Optional[int] = None
    hypes: Optional[int] = None
    cover: Optional[dict] = None
    screenshots: Optional[List[dict]] = None
    videos: Optional[List[dict]] = None
    genres: Optional[List[dict]] = None
    platforms: Optional[List[dict]] = None
    themes: Optional[List[dict]] = None
    similar_games: Optional[List[int]] = None
    involved_companies: Optional[List[dict]] = None
    game_modes: Optional[List[dict]] = None
    player_perspectives: Optional[List[dict]] = None


class GameCreate(GameBase):
    pass


class Game(GameBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) 