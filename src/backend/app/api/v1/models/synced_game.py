# models/synced_game.py
"""
Synced Game model - stores games fetched from PSN/Steam before import.

This is the persistent sync layer:
- Sync fetches games from platform → stores here
- User reviews and confirms/skips
- Confirmed games get imported to library
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
import enum

from ...db_setup import Base


class SyncStatus(str, enum.Enum):
    """Status of a synced game."""
    PENDING = "pending"      # Newly synced, awaiting user action
    CONFIRMED = "confirmed"  # User confirmed, ready to import
    IMPORTED = "imported"    # Already imported to library
    SKIPPED = "skipped"      # User chose to skip (won't re-appear)
    WRONG = "wrong"          # Match is wrong, needs correction


class TargetList(str, enum.Enum):
    """Which list to import the game to."""
    PLAYED = "played"
    PLAYING = "playing"
    WANT_TO_PLAY = "want_to_play"


class SyncedGame(Base):
    """
    A game fetched from PSN/Steam, stored for user review before import.
    """
    __tablename__ = "synced_games"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Platform info
    platform = Column(String, nullable=False)  # 'psn' | 'steam'
    platform_id = Column(String, nullable=False)  # CUSA00634_00, Steam appid
    platform_name = Column(String, nullable=False)  # Name from platform
    
    # IGDB matching
    igdb_id = Column(Integer, nullable=True)  # Matched IGDB ID (null if unmatched)
    igdb_name = Column(String, nullable=True)  # Matched IGDB game name
    igdb_cover_url = Column(String, nullable=True)  # IGDB cover image URL
    match_confidence = Column(Float, nullable=True)  # 0.0-1.0
    match_method = Column(String, nullable=True)  # 'exact', 'slug', 'manual', etc.
    
    # User action
    status = Column(String, default=SyncStatus.PENDING.value, nullable=False)
    target_list = Column(String, default=TargetList.PLAYED.value, nullable=True)
    
    # Platform metadata
    playtime_minutes = Column(Integer, nullable=True)
    image_url = Column(String, nullable=True)
    
    # Timestamps
    last_synced_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", backref="synced_games")
    
    # Indexes for common queries
    __table_args__ = (
        Index('ix_synced_games_user_platform', 'user_id', 'platform'),
        Index('ix_synced_games_user_platform_id', 'user_id', 'platform', 'platform_id', unique=True),
        Index('ix_synced_games_status', 'user_id', 'status'),
    )
    
    def __repr__(self):
        return f"<SyncedGame {self.platform}:{self.platform_id} → {self.igdb_name or 'unmatched'} [{self.status}]>"
