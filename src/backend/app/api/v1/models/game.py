# models/game.py
from datetime import datetime, UTC
from sqlalchemy import Integer, String, Float, JSON, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from ...db_setup import Base
import sqlalchemy as sa

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
    aggregated_rating_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
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
    bundles: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of bundles this game is a part of"
    )
    ports: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of ports of this game"
    )
    standalone_expansions: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of standalone expansions of this game"
    )
    episodes: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of episodes of this game"
    )
    seasons: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of seasons of this game"
    )
    packs: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="List of packs/add-ons for this game"
    )
    editions: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="Different editions of this game"
    )
    in_bundles: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="Bundles that this game is included in"
    )
    version_parent: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="Parent game if this is a specific edition"
    )
    version_title: Mapped[str | None] = mapped_column(
        String, nullable=True, comment="Title of this edition (e.g., 'Gold Edition')"
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
    
    # Time to beat data
    time_to_beat: Mapped[dict | None] = mapped_column(JSON, nullable=True, comment="Time to beat data (hastily, normally, completely)")
    
    raw_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Store full IGDB response
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    is_deleted: Mapped[bool] = mapped_column(sa.Boolean, default=False, nullable=False, server_default=sa.text('false'))

    def __repr__(self):
        return f"<Game(id={self.id}, name={self.name}, rating={self.rating})>"
