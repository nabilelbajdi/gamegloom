from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.core.models import Game
from app.api.v1.core.schemas import GameCreate


def get_game_by_igdb_id(db: Session, igdb_id: int) -> Optional[Game]:
    return db.scalar(select(Game).where(Game.igdb_id == igdb_id))


def get_game(db: Session, game_id: int) -> Optional[Game]:
    return db.get(Game, game_id)


def get_games(db: Session, skip: int = 0, limit: int = 100) -> List[Game]:
    return db.scalars(select(Game).offset(skip).limit(limit)).all()


def create_game(db: Session, game: GameCreate) -> Game:
    db_game = Game(**game.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


def update_game(db: Session, game_id: int, game_data: dict) -> Optional[Game]:
    db_game = get_game(db, game_id)
    if db_game:
        for key, value in game_data.items():
            setattr(db_game, key, value)
        db_game.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_game)
    return db_game


def delete_game(db: Session, game_id: int) -> bool:
    db_game = get_game(db, game_id)
    if db_game:
        db.delete(db_game)
        db.commit()
        return True
    return False 