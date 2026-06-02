# models/user_preference.py
from datetime import datetime, UTC
from sqlalchemy import Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ...db_setup import Base


class UserPreference(Base):
    """Per-user personalization captured during onboarding.

    One row per user. `onboarded_at` is null until the user finishes (or skips
    through) onboarding — that's how the frontend decides whether to route a
    fresh user into the onboarding flow.
    """
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)

    favorite_genres: Mapped[list | None] = mapped_column(JSON, nullable=True)   # list of genre slugs
    favorite_themes: Mapped[list | None] = mapped_column(JSON, nullable=True)   # list of theme slugs
    playstyles: Mapped[list | None] = mapped_column(JSON, nullable=True)        # e.g. ["story", "cozy"]
    theme_key: Mapped[str] = mapped_column(String(40), nullable=False, default="obsidian", server_default="obsidian")

    onboarded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    # Relationships
    user = relationship("User", back_populates="preferences")

    def __repr__(self):
        return f"<UserPreference(user_id={self.user_id}, theme={self.theme_key}, onboarded={self.onboarded_at is not None})>"
