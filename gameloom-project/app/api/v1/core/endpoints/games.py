from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.core.schemas import Game, GameCreate
from app.api.v1.core.services import (create_game, get_game, get_game_by_igdb_id,
                                    get_games)
from app.db_setup import get_db

router = APIRouter(tags=["games"], prefix="/games")


@router.get("", response_model=List[Game])
def list_games(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    games = get_games(db, skip=skip, limit=limit)
    return games


@router.get("/{game_id}", response_model=Game)
def get_game_details(game_id: int, db: Session = Depends(get_db)):
    db_game = get_game(db, game_id)
    if db_game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return db_game


@router.get("/igdb/{igdb_id}", response_model=Game)
def get_game_by_igdb(igdb_id: int, db: Session = Depends(get_db)):
    db_game = get_game_by_igdb_id(db, igdb_id)
    if db_game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return db_game


@router.post("", response_model=Game)
def create_new_game(game: GameCreate, db: Session = Depends(get_db)):
    db_game = get_game_by_igdb_id(db, game.igdb_id)
    if db_game:
        raise HTTPException(status_code=400, detail="Game already exists")
    return create_game(db, game) 