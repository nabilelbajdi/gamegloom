# models/game.py
from datetime import datetime
from sqlalchemy import Integer, String, Float, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from ...db_setup import Base

class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    igdb_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    summary: Mapped[str | None] = mapped_column(String, nullable=True)
    storyline: Mapped[str | None] = mapped_column(String, nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String, nullable=True)
    
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    aggregated_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_rating_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hypes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    genres: Mapped[str | None] = mapped_column(String, nullable=True)
    platforms: Mapped[str | None] = mapped_column(String, nullable=True)
    developers: Mapped[str | None] = mapped_column(String, nullable=True)
    game_modes: Mapped[str | None] = mapped_column(String, nullable=True)
    player_perspectives: Mapped[str | None] = mapped_column(String, nullable=True)
    themes: Mapped[str | None] = mapped_column(String, nullable=True)

    first_release_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    screenshots: Mapped[list | None] = mapped_column(JSON, nullable=True)
    videos: Mapped[list | None] = mapped_column(JSON, nullable=True)
    similar_games: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of similar games with details (id, name, cover_image, rating, genres)"
    )
    
    raw_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Store full IGDB response
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Game(id={self.id}, name={self.name}, rating={self.rating})>"
