from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Integer, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column
from ...db_setup import Base

class GameStatus(str, Enum):
    WANT_TO_PLAY = "want_to_play"
    PLAYING = "playing"
    PLAYED = "played"
    IN_LIST = "in_list"

class UserGame(Base):
    __tablename__ = "user_games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), nullable=False)
    status: Mapped[GameStatus] = mapped_column(SQLAlchemyEnum(GameStatus), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<UserGame(user_id={self.user_id}, game_id={self.game_id}, status={self.status})>" 