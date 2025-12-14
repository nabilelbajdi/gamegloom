# models/psn_title_lookup.py
"""
PSN Title Lookup table for mapping title_id → concept_id → game name.

Data sourced from: https://github.com/andshrew/PlayStation-Titles
"""
from sqlalchemy import Column, Integer, String, Index
from ...db_setup import Base


class PsnTitleLookup(Base):
    """
    Lookup table for PlayStation title_id to concept_id and game name.
    
    This enables accurate matching of PSN games to IGDB by using Sony's
    Concept ID which uniquely identifies games across all regional versions.
    """
    __tablename__ = "psn_title_lookup"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title_id = Column(String, nullable=False, unique=True, index=True)  # e.g., "CUSA00634_00"
    concept_id = Column(Integer, nullable=True, index=True)  # e.g., 213119
    name = Column(String, nullable=False)  # e.g., "STAR WARS™ Battlefront™"
    region = Column(String, nullable=True)  # e.g., "EP", "UP", "JP"
    
    # Index for fast lookup by title_id (primary use case)
    __table_args__ = (
        Index('ix_psn_title_lookup_title_id_concept', 'title_id', 'concept_id'),
    )
    
    def __repr__(self):
        return f"<PsnTitleLookup {self.title_id} → {self.concept_id}: {self.name}>"
