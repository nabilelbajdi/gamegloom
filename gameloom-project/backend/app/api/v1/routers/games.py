# endpoints/games.py
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..models import game
from ..core import services, schemas
from ...db_setup import get_db

router = APIRouter(tags=["games"])

@router.get("/games/{igdb_id}", response_model=schemas.Game)
async def get_game(igdb_id: int, db: Session = Depends(get_db)):
    """Get game details, first checking database then IGDB"""
    # Try to get from database first
    db_game = services.get_game_by_igdb_id(db, igdb_id)
    if db_game:
        return db_game

    # If not in database, fetch from IGDB
    try:
        igdb_data = services.fetch_from_igdb(game_id=igdb_id)
        game_data = services.process_igdb_data(igdb_data)
        return services.create_game(db, game_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trending-games", response_model=List[schemas.Game])
async def get_trending_games(db: Session = Depends(get_db)):
    """Get trending games based on popularity and ratings"""
    try:
        # Get games with high hype/popularity with complete details
        time_6_months_ago = int((datetime.now() - timedelta(days=180)).timestamp())
        time_now = int(datetime.now().timestamp())
        
        popularity_query = f"{services.IGDB_GAME_FIELDS} where first_release_date >= {time_6_months_ago} & first_release_date <= {time_now} & hypes > 0 & cover != null; sort hypes desc; limit 12;"
        
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
    # Check database first
    db_games = services.get_anticipated_games(db)
    if len(db_games) >= 12:
        return db_games

    # If no games in database, fetch from IGDB
    current_timestamp = int(datetime.now().timestamp())
    one_year_future = current_timestamp + (365 * 24 * 60 * 60)  # 1 year from now
    
    query = f"{services.IGDB_GAME_FIELDS} where first_release_date > {current_timestamp} & first_release_date < {one_year_future} & hypes > 0 & cover != null; sort hypes desc; limit 12;"
    
    try:
        await services.sync_games_from_igdb(db, query)
        return services.get_anticipated_games(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/highly-rated-games", response_model=List[schemas.Game])
async def get_highly_rated_games(db: Session = Depends(get_db)):
    """Get highly rated games"""
    # Check database first
    db_games = services.get_highly_rated_games(db)
    if len(db_games) >= 12:
        return db_games

    query = f"{services.IGDB_GAME_FIELDS} where total_rating != null & total_rating_count > 500 & total_rating > 85 & cover != null; sort total_rating desc; limit 12;"
    
    try:
        await services.sync_games_from_igdb(db, query)
        return services.get_highly_rated_games(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest-games", response_model=List[schemas.Game])
async def get_latest_games(db: Session = Depends(get_db)):
    """Get latest games"""
    # Check database first
    db_games = services.get_latest_games(db)
    if len(db_games) >= 12:
        return db_games

    # If no games in database, fetch from IGDB
    current_timestamp = int(datetime.now().timestamp())
    one_month_ago = current_timestamp - (30 * 24 * 60 * 60)  # 30 days ago
    
    query = f"{services.IGDB_GAME_FIELDS} where first_release_date >= {one_month_ago} & first_release_date <= {current_timestamp} & first_release_date != null & cover != null; sort first_release_date desc; limit 12;"
    
    try:
        await services.sync_games_from_igdb(db, query)
        return services.get_latest_games(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/update-similar-games")
async def update_similar_games(db: Session = Depends(get_db)):
    """Update all existing games with their similar games data"""
    try:
        # Get all games from database
        all_games = db.query(game.Game).all()
        updated_count = 0

        for db_game in all_games:
            try:
                # Fetch fresh data from IGDB
                igdb_data = services.fetch_from_igdb(game_id=db_game.igdb_id)
                if not igdb_data or not igdb_data.get("similar_games"):
                    continue

                # Process similar games in a single API call
                similar_ids = ",".join(str(id) for id in igdb_data["similar_games"])
                query = f"{services.IGDB_SIMILAR_GAME_FIELDS} where id = ({similar_ids}); limit 10;"
                similar_games_data = services.fetch_from_igdb(query=query)
                
                # Process similar games using the service function
                similar_games = services.process_similar_games(similar_games_data)

                # Update the game with new similar games data
                db_game.similar_games = similar_games
                db_game.updated_at = datetime.utcnow()
                db.add(db_game)
                updated_count += 1

                # Commit every 10 games to avoid long transactions
                if updated_count % 10 == 0:
                    db.commit()

            except Exception:
                continue

        # Final commit for remaining games
        db.commit()
        return {"message": f"Successfully updated similar games for {updated_count} games"}

    except Exception as e:
        db.rollback()
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
