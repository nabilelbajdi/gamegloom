# game_service.py
"""Game CRUD operations and database queries."""

from datetime import datetime, UTC
from sqlalchemy import select
from sqlalchemy.orm import Session
import logging

from ..models import game
from . import schemas
from .igdb_service import (
    fetch_from_igdb, process_igdb_data, meets_quality_requirements, IGDB_GAME_FIELDS
)

logger = logging.getLogger(__name__)


def get_game_by_id(db: Session, game_id: int) -> game.Game | None:
    """Fetch a game from the database by ID"""
    return db.scalar(select(game.Game).where(game.Game.id == game_id))


def get_game_by_igdb_id(db: Session, igdb_id: int) -> game.Game | None:
    """Fetch a game from the database by IGDB ID"""
    return db.scalar(select(game.Game).where(game.Game.igdb_id == igdb_id))


def get_game_by_slug(db: Session, slug: str) -> game.Game | None:
    """Fetch a game from the database by slug"""
    return db.scalar(select(game.Game).where(game.Game.slug == slug))


def create_game(db: Session, game_data: schemas.GameCreate) -> game.Game:
    """Create a new game in the database"""
    db_game = game.Game(**game_data.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


def update_game(db: Session, game_id: int, game_update: schemas.GameUpdate) -> game.Game | None:
    """Update an existing game in the database"""
    db_game = get_game_by_id(db, game_id)
    if not db_game:
        return None
    
    game_data = game_update.model_dump(exclude_unset=True)
    for key, value in game_data.items():
        setattr(db_game, key, value)
    
    db.commit()
    db.refresh(db_game)
    return db_game


def mark_game_as_deleted(db: Session, igdb_id: int) -> game.Game | None:
    """Mark a game as deleted in the database"""
    db_game = get_game_by_igdb_id(db, igdb_id)
    if not db_game:
        return None
    
    db_game.is_deleted = True
    db.commit()
    db.refresh(db_game)
    return db_game


def get_games_by_ids(db: Session, game_ids: list):
    """Get games by their IDs"""
    from ..models.game import Game
    return db.query(Game).filter(Game.id.in_(game_ids)).all()


def get_recent_games(db: Session, limit: int = None):
    """Get recent games ordered by release date"""
    from ..models.game import Game
    
    query = db.query(Game).order_by(Game.first_release_date.desc())
    
    if limit:
        query = query.limit(limit)
        
    return query.all()


async def sync_games_from_igdb(db: Session, query: str) -> tuple[int, int]:
    """Sync games from IGDB to database"""
    try:
        igdb_data = fetch_from_igdb(query=query)
        new_count = 0
        update_count = 0
        skipped_count = 0
        
        for game_data in igdb_data:
            try:
                if not game_data.get('name'):
                    continue
                    
                processed_data = process_igdb_data(game_data)
                
                existing_game = get_game_by_igdb_id(db, game_data['id'])
                
                if existing_game:
                    update_game(db, existing_game.id, processed_data)
                    update_count += 1
                else:
                    if meets_quality_requirements(processed_data):
                        create_game(db, processed_data)
                        new_count += 1
                    else:
                        skipped_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing game {game_data.get('name', 'Unknown')}: {str(e)}")
                continue
        
        if skipped_count > 0:
            logger.info(f"[Quality] Skipped {skipped_count} games that didn't meet quality requirements")
                
        return new_count, update_count

        
    except Exception as e:
        logger.error(f"Error syncing games from IGDB: {str(e)}")
        return 0, 0


async def sync_similar_games(db: Session, game_id: int) -> tuple[int, int]:
    """Fetches and stores similar games for a given game"""
    try:
        game_obj = get_game_by_id(db, game_id)
        if not game_obj or not game_obj.similar_games:
            return 0, 0
            
        similar_ids = [similar["id"] for similar in game_obj.similar_games if "id" in similar]
        if not similar_ids:
            return 0, 0

        ids_string = ",".join(str(id) for id in similar_ids)
        query = f"{IGDB_GAME_FIELDS} where id = ({ids_string}); limit {len(similar_ids)};"
        
        return await sync_games_from_igdb(db, query)
        
    except Exception as e:
        logger.error(f"Error syncing similar games for game {game_id}: {str(e)}")
        return 0, 0


async def fetch_related_game_types(db: Session, game_id: int):
    """Fetch games that are episodes, seasons, or packs of the given game."""
    try:
        db_game = get_game_by_id(db, game_id)
        if not db_game:
            logger.error(f"Game with ID {game_id} not found when fetching related game types")
            return
            
        game_types = {
            6: "episodes",
            7: "seasons",
            13: "packs"
        }
        
        for type_id, field_name in game_types.items():
            query = f"""
                fields name, cover.image_id, slug;
                where parent_game = {db_game.igdb_id} & game_type = {type_id};
                limit 50;
            """
            
            try:
                related_games = fetch_from_igdb(query=query)
                
                if related_games and len(related_games) > 0:
                    related_data = []
                    for g in related_games:
                        if g.get('name'):
                            game_data = {
                                "id": g.get('id'),
                                "name": g.get('name'),
                                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{g['cover']['image_id']}.jpg" 
                                if g.get('cover', {}).get('image_id') else None,
                                "slug": g.get('slug')
                            }
                            related_data.append(game_data)
                    
                    if related_data:
                        setattr(db_game, field_name, related_data)
                        db.commit()
                        logger.info(f"Updated {len(related_data)} {field_name} for game {db_game.name}")
            
            except Exception as e:
                logger.error(f"Error fetching {field_name} for game {db_game.name}: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error in fetch_related_game_types: {str(e)}")


async def fetch_game_editions_and_bundles(db: Session, game_id: int):
    """Fetch different editions and bundles that include this game."""
    try:
        db_game = get_game_by_id(db, game_id)
        if not db_game:
            logger.error(f"Game with ID {game_id} not found when fetching game editions and bundles")
            return
        
        # Fetch editions
        try:
            if getattr(db_game, 'version_title', None):
                logger.info(f"Game {db_game.name} is an edition with title: {db_game.version_title}")
            
            editions_query = f"""
                fields name, cover.image_id, slug, version_title, game_type;
                where version_parent = {db_game.igdb_id};
                limit 50;
            """
            
            editions = fetch_from_igdb(query=editions_query)
            
            if editions and len(editions) > 0:
                editions_data = []
                for g in editions:
                    if g.get('name'):
                        edition_data = {
                            "id": g.get('id'),
                            "name": g.get('name'),
                            "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{g['cover']['image_id']}.jpg" 
                            if g.get('cover', {}).get('image_id') else None,
                            "slug": g.get('slug'),
                            "edition_title": g.get('version_title', "Edition")
                        }
                        editions_data.append(edition_data)
                
                if editions_data:
                    db_game.editions = editions_data
                    db.commit()
                    logger.info(f"Updated {len(editions_data)} editions for game {db_game.name}")
        
        except Exception as e:
            logger.error(f"Error fetching editions for game {db_game.name}: {str(e)}")
        
        # Fetch bundles containing this game
        try:
            bundles_query = f"""
                fields name, cover.image_id, slug, games.name, games.cover.image_id;
                where games = [{db_game.igdb_id}] & id != {db_game.igdb_id};
                limit 50;
            """
            
            bundles = fetch_from_igdb(query=bundles_query)
            
            if bundles and len(bundles) > 0:
                bundles_data = []
                for bundle in bundles:
                    if bundle.get('name'):
                        bundle_data = {
                            "id": bundle.get('id'),
                            "name": bundle.get('name'),
                            "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{bundle['cover']['image_id']}.jpg" 
                            if bundle.get('cover', {}).get('image_id') else None,
                            "slug": bundle.get('slug')
                        }
                        bundles_data.append(bundle_data)
                
                if bundles_data:
                    db_game.in_bundles = bundles_data
                    db.commit()
                    logger.info(f"Updated {len(bundles_data)} bundles containing {db_game.name}")
        
        except Exception as e:
            logger.error(f"Error fetching bundles for game {db_game.name}: {str(e)}")
                
    except Exception as e:
        logger.error(f"Error in fetch_game_editions_and_bundles: {str(e)}")
