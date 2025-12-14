# models/psn_igdb_mapping.py
"""
Mapping table that links PSN trophy IDs to IGDB game IDs.
Enables accurate matching and caching of successful imports.
"""
from datetime import datetime, timezone
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ...db_setup import Base


class PsnIgdbMapping(Base):
    """
    Stores mappings between PSN trophy list IDs (NPWR...) and IGDB game IDs.
    
    This enables:
    - Instant matching for previously imported games
    - Community-built mapping database over time
    - Display of proper IGDB names instead of PSN names
    """
    __tablename__ = "psn_igdb_mappings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # PSN trophy list ID (e.g., "NPWR04936_00" for Destiny)
    trophy_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    
    # IGDB game ID that this trophy list maps to
    igdb_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    
    # Original PSN name (for reference/debugging)
    psn_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Whether this mapping was manually verified or auto-matched
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Number of times this mapping has been used (popularity tracking)
    use_count: Mapped[int] = mapped_column(Integer, default=1)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self):
        return f"<PsnIgdbMapping(trophy_id={self.trophy_id}, igdb_id={self.igdb_id}, psn_name={self.psn_name})>"
