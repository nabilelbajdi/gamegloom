# services.py
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from . import models, schemas

def get_game_by_id(db: Session, game_id: int) -> models.Game | None:
    """Fetch a game from the database by ID"""
    return db.scalar(select(models.Game).where(models.Game.id == game_id))

def get_game_by_igdb_id(db: Session, igdb_id: int) -> models.Game | None:
    """Fetch a game from the database by IGDB ID"""
    return db.scalar(select(models.Game).where(models.Game.igdb_id == igdb_id))

def create_game(db: Session, game: schemas.GameCreate) -> models.Game:
    """Create a new game in the database"""
    db_game = models.Game(**game.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

def update_game(db: Session, game_id: int, game: schemas.GameUpdate) -> models.Game | None:
    """Update an existing game in the database"""
    db_game = get_game_by_id(db, game_id)
    if not db_game:
        return None
    
    game_data = game.model_dump(exclude_unset=True)
    for key, value in game_data.items():
        setattr(db_game, key, value)
    
    db_game.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_game)
    return db_game

def get_trending_games(db: Session, limit: int = 6) -> list[models.Game]:
    """Get trending games from the database"""
    current_time = datetime.utcnow()
    one_year_ago = current_time - timedelta(days=365)
    
    return list(db.scalars(
        select(models.Game)
        .where(
            models.Game.first_release_date >= one_year_ago,
            models.Game.cover_image.is_not(None),
            models.Game.total_rating.is_not(None),
            models.Game.total_rating_count > 100
        )
        .order_by(
            models.Game.total_rating.desc(),
            models.Game.first_release_date.desc()
        )
        .limit(limit)
    ))

def get_anticipated_games(db: Session, limit: int = 6) -> list[models.Game]:
    """Get anticipated games from the database"""
    current_time = datetime.utcnow()
    one_year_future = current_time + timedelta(days=365)
    
    return list(db.scalars(
        select(models.Game)
        .where(
            models.Game.first_release_date.between(current_time, one_year_future),
            models.Game.cover_image.is_not(None)
        )
        .order_by(models.Game.hypes.desc().nulls_last(), models.Game.first_release_date.asc())
        .limit(limit)
    ))

def get_highly_rated_games(db: Session, limit: int = 6) -> list[models.Game]:
    """Get highly rated games from the database"""
    return list(db.scalars(
        select(models.Game)
        .where(
            models.Game.total_rating.is_not(None),
            models.Game.total_rating > 85,
            models.Game.total_rating_count > 500,
            models.Game.cover_image.is_not(None)
        )
        .order_by(models.Game.total_rating.desc())
        .limit(limit)
    ))

def get_latest_games(db: Session, limit: int = 6) -> list[models.Game]:
    """Get latest released games from the database"""
    current_time = datetime.utcnow()
    one_month_ago = current_time - timedelta(days=30)
    
    return list(db.scalars(
        select(models.Game)
        .where(
            models.Game.first_release_date.between(one_month_ago, current_time),
            models.Game.cover_image.is_not(None)
        )
        .order_by(models.Game.first_release_date.desc())
        .limit(limit)
    ))
