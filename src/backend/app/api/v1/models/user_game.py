from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Integer, String, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ...db_setup import Base


class GameStatus(str, Enum):
    WANT_TO_PLAY = "want_to_play"
    PLAYING = "playing"
    PLAYED = "played"
    IN_LIST = "in_list"


class ImportSource(str, Enum):
    """Source of the game entry - manual or imported from a platform."""
    MANUAL = "manual"
    STEAM = "steam"
    PSN = "psn"


class UserGame(Base):
    __tablename__ = "user_games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), nullable=False)
    status: Mapped[GameStatus] = mapped_column(SQLAlchemyEnum(GameStatus), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Platform import tracking
    playtime_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Imported from Steam/PSN
    import_source: Mapped[ImportSource | None] = mapped_column(String(20), nullable=True, default=None)  # Where this entry came from
    
    # Relationships
    game = relationship("Game")

    def __repr__(self):
        return f"<UserGame(user_id={self.user_id}, game_id={self.game_id}, status={self.status})>" 