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

@router.get("/games/count")
async def get_games_count(
    db: Session = Depends(get_db),
    genre: str = None,
    theme: str = None
):
    """Get total count of games for a genre or theme."""
    if genre:
        return {"total": services.count_games_by_genre(db, genre)}
    if theme:
        return {"total": services.count_games_by_theme(db, theme)}
    return {"total": 0}


@router.get("/search/count")
async def get_search_count(
    query: str,
    category: str = "all",
    db: Session = Depends(get_db)
):
    """Get total count of search results."""
    return {"total": services.count_search_results(db, query, category)}


@router.get("/games/{identifier}", response_model=schemas.Game)
async def get_game(identifier: str, db: Session = Depends(get_db)):
    """Get game details by IGDB ID or slug.
    
    Uses Stale-While-Revalidate (SWR) pattern:
    - Returns cached data immediately
    - If data is stale (>24h old), triggers background refresh
    - If game not in DB, fetches from IGDB and stores
    """
    db_game = None
    
    if identifier.isdigit():
        igdb_id = int(identifier)
        db_game = services.get_game_by_igdb_id(db, igdb_id)
        
        if not db_game:
            try:
                igdb_data = services.fetch_from_igdb(game_id=igdb_id)
                game_data = services.process_igdb_data(igdb_data)
                
                # Only store games that meet quality requirements
                if services.meets_quality_requirements(game_data):
                    db_game = services.create_game(db, game_data)
                else:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Game doesn't meet quality requirements (missing cover or description)"
                    )
            except HTTPException:
                raise
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
                    
                    # Only store games that meet quality requirements
                    if services.meets_quality_requirements(game_data):
                        db_game = services.create_game(db, game_data)
                    else:
                        raise HTTPException(
                            status_code=404, 
                            detail=f"Game doesn't meet quality requirements (missing cover or description)"
                        )
                else:
                    raise HTTPException(status_code=404, detail=f"Game with slug '{slug}' not found")
            except HTTPException:
                raise
            except Exception as e:
                if "not found" in str(e).lower():
                    raise HTTPException(status_code=404, detail=f"Game with slug '{slug}' not found")
                raise HTTPException(status_code=500, detail=str(e))
    
    # SWR Pattern: Check if game data is stale and needs background refresh
    if db_game and services.is_stale(db_game, max_age_hours=24):
        logger.info(f"[SWR] Game {db_game.name} is stale, triggering background refresh")
        try:
            # Trigger background refresh - doesn't block the response
            # Note: refresh_game_async creates its own DB session
            asyncio.create_task(services.refresh_game_async(db_game.igdb_id))
        except Exception as e:
            logger.error(f"[SWR] Error starting background refresh: {str(e)}")



    
    # Also refresh related data if stale
    if db_game and services.is_stale(db_game, max_age_hours=24):
        # Sync similar games in background
        if db_game.similar_games:
            try:
                asyncio.create_task(services.sync_similar_games(db, db_game.id))
            except Exception as e:
                logger.error(f"Error starting similar games sync: {str(e)}")
        
        # Fetch related game types in background
        try:
            asyncio.create_task(services.fetch_related_game_types(db, db_game.id))
        except Exception as e:
            logger.error(f"Error starting related game types fetch: {str(e)}")
        
        # Fetch editions and bundles in background
        try:
            asyncio.create_task(services.fetch_game_editions_and_bundles(db, db_game.id))
        except Exception as e:
            logger.error(f"Error starting editions and bundles fetch: {str(e)}")
        
        # Fetch time to beat (this one is quick, do it synchronously)
        try:
            time_to_beat = services.fetch_time_to_beat(db_game.igdb_id)
            if time_to_beat:
                db_game.time_to_beat = time_to_beat
                db.commit()
                db.refresh(db_game)
        except Exception as e:
            logger.error(f"Error fetching time to beat data: {str(e)}")
    
    return db_game


@router.get("/trending-games", response_model=List[schemas.Game])
async def get_trending_games(db: Session = Depends(get_db)):
    """Get trending games based on popularity and ratings"""
    try:
        # First try to get recent trending games from our database
        db_games = services.get_trending_games(db)
        
        if len(db_games) >= 20:
            return db_games
            
        # Otherwise, sync with IGDB
        time_6_months_ago = int((datetime.now() - timedelta(days=180)).timestamp())
        time_now = int(datetime.now().timestamp())
        
        popularity_query = f"{services.IGDB_GAME_FIELDS} where first_release_date >= {time_6_months_ago} & first_release_date <= {time_now} & hypes > 0 & cover != null; sort hypes desc; limit 100;"
        
        # Fetch and sync the trending games
        await services.sync_games_from_igdb(db, popularity_query)
        
        # Get the updated trending games from the database
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
        # First try to get recent anticipated games from the database
        db_games = services.get_anticipated_games(db)
        
        if len(db_games) >= 20:
            return db_games
            
        # Otherwise, sync with IGDB
        current_timestamp = int(datetime.now().timestamp())
        one_year_future = current_timestamp + (365 * 24 * 60 * 60)  # 1 year from now
        
        query = f"{services.IGDB_GAME_FIELDS} where first_release_date > {current_timestamp} & first_release_date < {one_year_future} & hypes > 0 & cover != null; sort hypes desc; limit 100;"
        
        # Fetch and sync the anticipated games
        await services.sync_games_from_igdb(db, query)
        
        # Get the updated anticipated games from our database
        return services.get_anticipated_games(db)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching anticipated games: {str(e)}")

@router.get("/highly-rated-games", response_model=List[schemas.Game])
async def get_highly_rated_games(db: Session = Depends(get_db)):
    """Get highly rated games"""
    try:
        # First try to get recent highly rated games from our database
        db_games = services.get_highly_rated_games(db)
        
        if len(db_games) >= 20:
            return db_games
            
        # Otherwise, sync with IGDB
        query = f"{services.IGDB_GAME_FIELDS} where total_rating_count > 50 & total_rating > 85 & cover != null; sort total_rating desc; limit 100;"
        
        # Fetch and sync the highly rated games
        await services.sync_games_from_igdb(db, query)
        
        # Get the updated highly rated games from our database
        return services.get_highly_rated_games(db)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching highly rated games: {str(e)}"
        )

@router.get("/latest-games", response_model=List[schemas.Game])
async def get_latest_games(db: Session = Depends(get_db)):
    """Get latest released games"""
    try:
        # First try to get recent latest games from our database
        db_games = services.get_latest_games(db)
        
        if len(db_games) >= 20:
            return db_games
            
        # Otherwise, sync with IGDB
        time_3_months_ago = int((datetime.now() - timedelta(days=90)).timestamp())
        time_now = int(datetime.now().timestamp())
        
        query = f"{services.IGDB_GAME_FIELDS} where first_release_date >= {time_3_months_ago} & first_release_date <= {time_now} & cover != null; sort first_release_date desc; limit 100;"
        
        # Fetch and sync the latest games
        await services.sync_games_from_igdb(db, query)
        
        # Get the updated latest games from our database
        return services.get_latest_games(db)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching latest games: {str(e)}"
        )

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
async def search_games(
    query: str, 
    category: str = "all",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Search for games with pagination.
    
    Parameters:
    - query: The search term
    - category: Category to search in. Options: "all", "games", "developers", "platforms"
    - limit: Maximum number of results to return (default: 50)
    - offset: Number of results to skip (default: 0)
    """
    # First check if we have matching games in our database
    db_games = services.search_games_in_db(db, query, category=category, limit=limit, offset=offset)
    
    # If we have enough results, return them immediately (fast path)
    if len(db_games) >= limit:
        return db_games[:limit]
    
    # If we have some results but they're paginated (offset > 0), just return what we have
    if offset > 0:
        return db_games
    
    # Only fetch from IGDB if we have NO results and it's a game/all search (first page only)
    if len(db_games) == 0 and (category.lower() == "all" or category.lower() == "games"):
        try:
            search_query = f"""
                {services.IGDB_GAME_FIELDS}
                search "{query}";
                where version_parent = null & cover != null;
                limit {limit};
            """
            
            await services.sync_games_from_igdb(db, search_query)
            
            # Search again after importing from IGDB
            db_games = services.search_games_in_db(db, query, category=category, limit=limit, offset=0)
        except Exception as e:
            print(f"Error fetching from IGDB: {str(e)}")
    
    return db_games

@router.get("/games", response_model=List[schemas.Game])
async def get_games(
    db: Session = Depends(get_db), 
    genre: str = None, 
    theme: str = None, 
    ids: str = None,
    limit: int = 50,
    offset: int = 0
):
    """Get games with optional filtering by genre, theme, or IDs. Supports pagination."""
    if ids:
        game_ids = [int(id) for id in ids.split(",")]
        return services.get_games_by_ids(db, game_ids)
    
    if genre:
        db_games = services.get_games_by_genre(db, genre, limit, offset)
        return db_games
    
    if theme:
        db_games = services.get_games_by_theme(db, theme, limit, offset)
        return db_games
    
    return services.get_recent_games(db, limit=limit)
