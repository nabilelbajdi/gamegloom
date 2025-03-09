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
    publishers: Mapped[str | None] = mapped_column(String, nullable=True)
    game_modes: Mapped[str | None] = mapped_column(String, nullable=True)
    player_perspectives: Mapped[str | None] = mapped_column(String, nullable=True)
    themes: Mapped[str | None] = mapped_column(String, nullable=True)

    first_release_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    screenshots: Mapped[list | None] = mapped_column(JSON, nullable=True)
    artworks: Mapped[list | None] = mapped_column(JSON, nullable=True)
    videos: Mapped[list | None] = mapped_column(JSON, nullable=True)
    similar_games: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of similar games with details (id, name, cover_image, rating, genres)"
    )
    
    # New fields as JSON
    dlcs: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of DLCs for this game"
    )
    expansions: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of expansions for this game"
    )
    remakes: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of remakes for this game"
    )
    remasters: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of remasters for this game"
    )
    parent_game: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="Parent game if this is DLC/expansion"
    )
    
    # New queryable fields
    slug: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    game_status_id: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Game status ID")
    game_status_name: Mapped[str | None] = mapped_column(String, nullable=True, comment="Game status name (released, alpha, beta, etc)")
    game_type_id: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Game type ID")
    game_type_name: Mapped[str | None] = mapped_column(String, nullable=True, comment="Game type name (main_game, dlc_addon, etc)")
    
    # New detailed info fields
    age_ratings: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="Age ratings (PEGI, ESRB)"
    )
    game_engines: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="Game engines used"
    )
    multiplayer_modes: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="Multiplayer features"
    )
    language_supports: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="Supported languages"
    )
    
    # Remaining fields in JSON format
    franchise: Mapped[str | None] = mapped_column(String, nullable=True)
    franchises: Mapped[list | None] = mapped_column(JSON, nullable=True)
    collections: Mapped[list | None] = mapped_column(JSON, nullable=True)
    alternative_names: Mapped[list | None] = mapped_column(JSON, nullable=True)
    keywords: Mapped[list | None] = mapped_column(JSON, nullable=True)
    
    raw_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Store full IGDB response
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Game(id={self.id}, name={self.name}, rating={self.rating})>"
