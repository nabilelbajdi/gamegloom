# endpoints/games.py
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import asyncio
import logging

from ..models import game
from ..core import services, schemas
from ...db_setup import get_db

router = APIRouter(tags=["games"])

logger = logging.getLogger(__name__)

@router.get("/games/{identifier}", response_model=schemas.Game)
async def get_game(identifier: str, db: Session = Depends(get_db)):
    """Get game details by IGDB ID or slug, first checking database then IGDB"""
    db_game = None
    
    if identifier.isdigit():
        igdb_id = int(identifier)
        db_game = services.get_game_by_igdb_id(db, igdb_id)
        
        if not db_game:
            try:
                igdb_data = services.fetch_from_igdb(game_id=igdb_id)
                game_data = services.process_igdb_data(igdb_data)
                
                db_game = services.create_game(db, game_data)
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
    else:
        slug = identifier
        db_game = services.get_game_by_slug(db, slug)
        
        if not db_game:
            try:
                search_query = f"{services.IGDB_GAME_FIELDS} where slug = \"{slug}\"; limit 1;"
                search_results = services.fetch_from_igdb(query=search_query)
                
                if search_results and len(search_results) > 0:
                    game_data = services.process_igdb_data(search_results[0])
                    db_game = services.create_game(db, game_data)
                else:
                    raise HTTPException(status_code=404, detail=f"Game with slug '{slug}' not found")
            except Exception as e:
                if "not found" in str(e).lower():
                    raise HTTPException(status_code=404, detail=f"Game with slug '{slug}' not found")
                raise HTTPException(status_code=500, detail=str(e))
    
    if db_game and db_game.similar_games:
        try:
            asyncio.create_task(services.sync_similar_games(db, db_game.id))
        except Exception as e:
            logger.error(f"Error starting similar games sync: {str(e)}")
    
    return db_game

@router.get("/trending-games", response_model=List[schemas.Game])
async def get_trending_games(db: Session = Depends(get_db)):
    """Get trending games based on popularity and ratings"""
    try:
        # Get games with high hype/popularity with complete details
        time_6_months_ago = int((datetime.now() - timedelta(days=180)).timestamp())
        time_now = int(datetime.now().timestamp())
        
        popularity_query = f"{services.IGDB_GAME_FIELDS} where first_release_date >= {time_6_months_ago} & first_release_date <= {time_now} & hypes > 0 & cover != null; sort hypes desc; limit 100;"
        
        # Fetch and sync the trending games
        await services.sync_games_from_igdb(db, popularity_query)
        
        # Get the trending games from our database
        return services.get_trending_games(db)
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching trending games: {str(e)}"
        )

@router.get("/anticipated-games", response_model=List[schemas.Game])
async def get_anticipated_games(db: Session = Depends(get_db)):
    """Get anticipated games"""
    try:
        # Get upcoming games with high hypes
        current_timestamp = int(datetime.now().timestamp())
        one_year_future = current_timestamp + (365 * 24 * 60 * 60)  # 1 year from now
        
        query = f"{services.IGDB_GAME_FIELDS} where first_release_date > {current_timestamp} & first_release_date < {one_year_future} & hypes > 0 & cover != null; sort hypes desc; limit 100;"
        
        # Fetch and sync the anticipated games
        await services.sync_games_from_igdb(db, query)
        
        # Get the anticipated games from our database
        return services.get_anticipated_games(db)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching anticipated games: {str(e)}")

@router.get("/highly-rated-games", response_model=List[schemas.Game])
async def get_highly_rated_games(db: Session = Depends(get_db)):
    """Get highly rated games"""
    try:
        # Get games with high ratings
        query = f"{services.IGDB_GAME_FIELDS} where total_rating != null & total_rating_count > 500 & total_rating > 85 & cover != null; sort total_rating desc; limit 100;"
        
        # Fetch and sync the highly rated games
        await services.sync_games_from_igdb(db, query)
        
        # Get the highly rated games from our database
        return services.get_highly_rated_games(db)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching highly rated games: {str(e)}")

@router.get("/latest-games", response_model=List[schemas.Game])
async def get_latest_games(db: Session = Depends(get_db)):
    """Get latest games"""
    try:
        # Get recently released games
        current_timestamp = int(datetime.now().timestamp())
        one_month_ago = current_timestamp - (30 * 24 * 60 * 60)  # 30 days ago
        
        query = f"{services.IGDB_GAME_FIELDS} where first_release_date >= {one_month_ago} & first_release_date <= {current_timestamp} & first_release_date != null & cover != null; sort first_release_date desc; limit 100;"
        
        # Fetch and sync the latest games
        await services.sync_games_from_igdb(db, query)
        
        # Get the latest games from our database
        return services.get_latest_games(db)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching latest games: {str(e)}")

@router.get("/update-similar-games")
async def update_similar_games(db: Session = Depends(get_db)):
    """Update all existing games with their similar games data as full game entries"""
    try:
        # Get all games from database
        all_games = db.query(game.Game).all()
        total_new = 0
        total_updated = 0
        processed_count = 0

        for db_game in all_games:
            try:
                # Sync similar games for this game
                new_count, update_count = await services.sync_similar_games(db, db_game.id)
                total_new += new_count
                total_updated += update_count
                processed_count += 1
                
                # Log progress every 10 games
                if processed_count % 10 == 0:
                    logger.info(f"Processed {processed_count}/{len(all_games)} games")
                
            except Exception as e:
                logger.error(f"Error processing game {db_game.id}: {str(e)}")
                continue

        return {
            "message": "Successfully updated similar games",
            "stats": {
                "games_processed": processed_count,
                "total_games": len(all_games),
                "new_games_added": total_new,
                "games_updated": total_updated
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating similar games: {str(e)}"
        )

@router.get("/search")
async def search_games(query: str, db: Session = Depends(get_db)):
    """Search for games using IGDB API"""
    # First check if we have matching games in our database
    db_games = services.search_games_in_db(db, query)
    if len(db_games) >= 6:
        return db_games[:6]

    # If not enough results in database, search IGDB
    search_query = f"""
        {services.IGDB_GAME_FIELDS}
        search "{query}";
        where version_parent = null & cover != null;
        limit 6;
    """
    
    try:
        await services.sync_games_from_igdb(db, search_query)
        return services.search_games_in_db(db, query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
