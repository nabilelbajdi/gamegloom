# models/user_platform_game.py
"""
Cached PSN/Steam library data.

Stores the user's platform library with IGDB matches cached.
This eliminates the need to re-fetch from PSN and re-match on every page load.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from ...db_setup import Base


class UserPlatformGame(Base):
    """Cached platform game with IGDB match data."""
    
    __tablename__ = "user_platform_games"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(20), nullable=False)  # 'psn' | 'steam'
    platform_id = Column(String(50), nullable=False)  # PSN title_id or Steam app_id
    platform_name = Column(String(255), nullable=False)  # Name from platform
    platform_image_url = Column(String(500), nullable=True)  # Cover from platform
    
    # IGDB Match (cached)
    igdb_id = Column(Integer, nullable=True)  # May be NULL if unmatched
    igdb_name = Column(String(255), nullable=True)
    igdb_cover_url = Column(String(500), nullable=True)
    match_confidence = Column(Float, nullable=True)
    match_method = Column(String(30), nullable=True)  # 'exact' | 'fuzzy' | 'user_match' | 'none'
    
    # Status
    status = Column(String(20), nullable=False, default='pending')  # 'pending' | 'imported' | 'hidden'
    
    # Metadata
    playtime_minutes = Column(Integer, default=0)
    first_played = Column(DateTime, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", backref="platform_games")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'platform', 'platform_id', name='uq_user_platform_game'),
        Index('ix_user_platform_games_user', 'user_id', 'platform'),
        Index('ix_user_platform_games_status', 'user_id', 'platform', 'status'),
    )
    
    def __repr__(self):
        return f"<UserPlatformGame(user_id={self.user_id}, platform={self.platform}, platform_id={self.platform_id}, status={self.status})>"
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "platform_id": self.platform_id,
            "platform_name": self.platform_name,
            "platform_image_url": self.platform_image_url,
            "igdb_id": self.igdb_id,
            "igdb_name": self.igdb_name,
            "igdb_cover_url": self.igdb_cover_url,
            "match_confidence": self.match_confidence,
            "match_method": self.match_method,
            "status": self.status,
            "playtime_minutes": self.playtime_minutes,
            "last_synced_at": self.last_synced_at.isoformat() if self.last_synced_at else None,
        }
