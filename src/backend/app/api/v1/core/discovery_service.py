# discovery_service.py
"""Game discovery functions - trending, anticipated, highly rated, latest."""

from datetime import datetime, timedelta, UTC
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import game


def get_trending_games(db: Session, limit: int = 100) -> list[game.Game]:
    """Get trending games from the database"""
    current_time = datetime.now(UTC)
    six_months_ago = current_time - timedelta(days=180)
    
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.first_release_date.between(six_months_ago, current_time),
            game.Game.cover_image.is_not(None),
            game.Game.hypes > 0
        )
        .order_by(
            game.Game.hypes.desc(),
            game.Game.total_rating.desc().nulls_last(),
            game.Game.first_release_date.desc()
        )
        .limit(limit)
    ))


def get_anticipated_games(db: Session, limit: int = 100) -> list[game.Game]:
    """Get anticipated games from the database"""
    current_time = datetime.now(UTC)
    one_year_future = current_time + timedelta(days=365)
    
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.first_release_date.between(current_time, one_year_future),
            game.Game.cover_image.is_not(None)
        )
        .order_by(game.Game.hypes.desc().nulls_last(), game.Game.first_release_date.asc())
        .limit(limit)
    ))


def get_highly_rated_games(db: Session, limit: int = 100) -> list[game.Game]:
    """Get highly rated games from the database"""
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.total_rating.is_not(None),
            game.Game.total_rating > 85,
            game.Game.total_rating_count > 500,
            game.Game.cover_image.is_not(None)
        )
        .order_by(game.Game.total_rating.desc())
        .limit(limit)
    ))


def get_latest_games(db: Session, limit: int = 100) -> list[game.Game]:
    """Get latest released games from the database"""
    current_time = datetime.now(UTC)
    one_month_ago = current_time - timedelta(days=30)
    
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.first_release_date.between(one_month_ago, current_time),
            game.Game.first_release_date.is_not(None),
            game.Game.cover_image.is_not(None)
        )
        .order_by(game.Game.first_release_date.desc())
        .limit(limit)
    ))


def get_games_by_genre(db: Session, genre_slug: str, limit: int = 50, offset: int = 0):
    """Get games that match a specific genre slug with pagination"""
    from ..models.game import Game
    
    search_pattern = f"%{genre_slug}%"
    genre_name = " ".join(word.capitalize() for word in genre_slug.replace("-", " ").split())
    name_pattern = f"%{genre_name}%"
    
    query = db.query(Game).filter(
        (Game.genres.ilike(search_pattern) | Game.genres.ilike(name_pattern))
    ).order_by(Game.total_rating.desc().nulls_last())
    
    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)
        
    return query.all()


def count_games_by_genre(db: Session, genre_slug: str) -> int:
    """Count total games matching a genre slug"""
    from ..models.game import Game
    
    search_pattern = f"%{genre_slug}%"
    genre_name = " ".join(word.capitalize() for word in genre_slug.replace("-", " ").split())
    name_pattern = f"%{genre_name}%"
    
    return db.query(Game).filter(
        (Game.genres.ilike(search_pattern) | Game.genres.ilike(name_pattern))
    ).count()


def get_games_by_theme(db: Session, theme_slug: str, limit: int = 50, offset: int = 0):
    """Get games that match a specific theme slug with pagination"""
    from ..models.game import Game
    
    search_pattern = f"%{theme_slug}%"
    theme_name = " ".join(word.capitalize() for word in theme_slug.replace("-", " ").split())
    name_pattern = f"%{theme_name}%"
    
    query = db.query(Game).filter(
        (Game.themes.ilike(search_pattern) | Game.themes.ilike(name_pattern))
    ).order_by(Game.total_rating.desc().nulls_last())
    
    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)
        
    return query.all()


def count_games_by_theme(db: Session, theme_slug: str) -> int:
    """Count total games matching a theme slug"""
    from ..models.game import Game
    
    search_pattern = f"%{theme_slug}%"
    theme_name = " ".join(word.capitalize() for word in theme_slug.replace("-", " ").split())
    name_pattern = f"%{theme_name}%"
    
    return db.query(Game).filter(
        (Game.themes.ilike(search_pattern) | Game.themes.ilike(name_pattern))
    ).count()
