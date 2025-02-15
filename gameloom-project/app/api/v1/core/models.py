from datetime import datetime
from typing import List, Optional

from sqlalchemy import ARRAY, JSON, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    igdb_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    storyline: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    first_release_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    aggregated_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_rating_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hypes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # JSON fields for arrays and complex data
    cover: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    screenshots: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    videos: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    genres: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    platforms: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    themes: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    similar_games: Mapped[Optional[List[int]]] = mapped_column(ARRAY(Integer), nullable=True)
    involved_companies: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    game_modes: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    player_perspectives: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<Game(id={self.id}, name={self.name})>" 