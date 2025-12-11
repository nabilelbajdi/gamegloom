# models/user_platform_link.py
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ...db_setup import Base


class PlatformType(str, Enum):
    STEAM = "steam"
    PSN = "psn"


class UserPlatformLink(Base):
    """Stores linked gaming platform accounts (Steam, PSN) for a user."""
    __tablename__ = "user_platform_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    platform: Mapped[PlatformType] = mapped_column(String(20), nullable=False)
    platform_user_id: Mapped[str] = mapped_column(String(100), nullable=False)  # Steam64 ID or PSN ID
    platform_username: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Display name
    
    # Token storage (primarily for PSN - Steam uses OpenID so no persistent token needed)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)  # Encrypted
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)  # Encrypted
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Sync tracking
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="platform_links")

    def __repr__(self):
        return f"<UserPlatformLink(user_id={self.user_id}, platform={self.platform}, platform_user_id={self.platform_user_id})>"
