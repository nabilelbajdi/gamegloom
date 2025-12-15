# models/user_psn_preference.py
"""
User preferences for PSN games.

Stores user decisions about PSN games that should persist across sessions:
- 'skipped': User wants to hide this game from sync
- 'matched': User manually matched this game to an IGDB entry
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from ...db_setup import Base


class UserPsnPreference(Base):
    """User preference for a PSN game (skip or manual match)."""
    
    __tablename__ = "user_psn_preferences"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform_id = Column(String(50), nullable=False)  # PSN title_id (e.g., "CUSA00634_00")
    igdb_id = Column(Integer, nullable=True)  # Manual match override (NULL for skipped)
    action = Column(String(20), nullable=False)  # 'skipped' | 'matched'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", backref="psn_preferences")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'platform_id', name='uq_user_psn_pref'),
        Index('ix_user_psn_prefs_user', 'user_id'),
    )
    
    def __repr__(self):
        return f"<UserPsnPreference(user_id={self.user_id}, platform_id={self.platform_id}, action={self.action})>"
