# search_service.py
"""Game search functionality."""

from difflib import SequenceMatcher
from sqlalchemy import or_, case, String
from sqlalchemy.orm import Session

from ..models import game


def string_similarity(a, b):
    """Calculate similarity ratio between two strings"""
    if not a or not b:
        return 0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def search_games_in_db(db: Session, query: str, limit: int = 50, offset: int = 0, category: str = "all") -> list[game.Game]:
    """
    Search for games in database matching the query.
    
    Parameters:
    - query: The search term
    - limit: Maximum number of results to return
    - offset: Number of results to skip (for pagination)
    - category: Category to search in. Options: "all", "games", "developers", "platforms", "keywords"
    """
    search_pattern = f"%{query}%"
    category = category.lower()
    
    # Build where clause based on category
    if category == "games":
        where_clause = or_(
            game.Game.name.ilike(search_pattern),
            game.Game.alternative_names.cast(String).ilike(search_pattern)
        )
    elif category == "developers":
        where_clause = game.Game.developers.ilike(search_pattern)
    elif category == "platforms":
        where_clause = game.Game.platforms.ilike(search_pattern)
    elif category == "keywords":
        where_clause = game.Game.keywords.cast(String).ilike(search_pattern)
    else:
        where_clause = or_(
            game.Game.name.ilike(search_pattern),
            game.Game.alternative_names.cast(String).ilike(search_pattern),
            game.Game.summary.ilike(search_pattern),
            game.Game.storyline.ilike(search_pattern),
            game.Game.genres.ilike(search_pattern),
            game.Game.themes.ilike(search_pattern),
            game.Game.developers.ilike(search_pattern),
            game.Game.keywords.cast(String).ilike(search_pattern)
        )
    
    from sqlalchemy import select
    
    # Exact matching with offset support
    exact_matches = list(db.scalars(
        select(game.Game)
        .where(where_clause)
        .order_by(
            case(
                (game.Game.name.ilike(search_pattern), 0),
                else_=1
            ),
            game.Game.total_rating.desc().nulls_last()
        )
        .offset(offset)
        .limit(limit)
    ))
    
    return exact_matches


def count_search_results(db: Session, query: str, category: str = "all") -> int:
    """Count total search results for a query."""
    search_pattern = f"%{query}%"
    category = category.lower()
    
    if category == "games":
        where_clause = or_(
            game.Game.name.ilike(search_pattern),
            game.Game.alternative_names.cast(String).ilike(search_pattern)
        )
    elif category == "developers":
        where_clause = game.Game.developers.ilike(search_pattern)
    elif category == "platforms":
        where_clause = game.Game.platforms.ilike(search_pattern)
    elif category == "keywords":
        where_clause = game.Game.keywords.cast(String).ilike(search_pattern)
    else:
        where_clause = or_(
            game.Game.name.ilike(search_pattern),
            game.Game.alternative_names.cast(String).ilike(search_pattern),
            game.Game.summary.ilike(search_pattern),
            game.Game.storyline.ilike(search_pattern),
            game.Game.genres.ilike(search_pattern),
            game.Game.themes.ilike(search_pattern),
            game.Game.developers.ilike(search_pattern),
            game.Game.keywords.cast(String).ilike(search_pattern)
        )
    
    return db.query(game.Game).filter(where_clause).count()
