# endpoints/games.py
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core import services, schemas, models
from ...db_setup import get_db
from ...settings import settings
import requests

router = APIRouter(tags=["games"])

def fetch_from_igdb(game_id: int = None, query: str = None, endpoint: str = "games") -> dict | list:
    """Fetch data from IGDB API
    
    Args:
        game_id: Optional game ID to fetch specific game
        query: Optional query string for custom queries
        endpoint: IGDB endpoint to query (default: "games")
    """
    headers = {
        "Client-ID": settings.IGDB_CLIENT_ID,
        "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
    }

    if game_id:
        body = f"""
            fields name, summary, storyline, first_release_date, 
                   genres.name, platforms.name, cover.image_id, 
                   screenshots.image_id, videos.video_id, rating, 
                   aggregated_rating, total_rating, total_rating_count, hypes,
                   similar_games.name, similar_games.cover.image_id, similar_games.rating,
                   similar_games.total_rating, similar_games.genres.name,
                   involved_companies.company.name, involved_companies.developer, game_modes.name, 
                   player_perspectives.name, themes.name;
            where id = {game_id};
        """
    else:
        body = query

    url = f"https://api.igdb.com/v4/{endpoint}"
    response = requests.post(url, headers=headers, data=body)
    response.raise_for_status()
    data = response.json()

    if game_id and not data:
        raise HTTPException(status_code=404, detail="Game not found in IGDB")
    
    return data[0] if game_id else data

def process_igdb_data(igdb_data: dict) -> schemas.GameCreate:
    """Process IGDB data into our schema format"""
    release_date = datetime.fromtimestamp(igdb_data.get('first_release_date', 0)) if igdb_data.get('first_release_date') else None
    
    # Process cover image
    cover_image = None
    if igdb_data.get('cover', {}).get('image_id'):
        cover_image = f"https://images.igdb.com/igdb/image/upload/t_1080p/{igdb_data['cover']['image_id']}.jpg"
    
    # Process screenshots
    screenshots = [
        f"https://images.igdb.com/igdb/image/upload/t_screenshot_big/{s['image_id']}.jpg"
        for s in igdb_data.get('screenshots', [])
    ]

    # Process similar games from expanded data
    similar_games = []
    if igdb_data.get('similar_games'):
        for similar_data in igdb_data['similar_games']:
            if similar_data.get('cover'):  # Only include games with cover images
                similar_games.append({
                    "id": similar_data["id"],
                    "name": similar_data["name"],
                    "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big/{similar_data['cover']['image_id']}.jpg"
                    if similar_data.get("cover") else None,
                    "rating": similar_data.get("total_rating", similar_data.get("rating")),
                    "genres": ", ".join(g['name'] for g in similar_data.get('genres', []))
                })

    return schemas.GameCreate(
        igdb_id=igdb_data['id'],
        name=igdb_data['name'],
        summary=igdb_data.get('summary'),
        storyline=igdb_data.get('storyline'),
        cover_image=cover_image,
        rating=igdb_data.get('rating'),
        aggregated_rating=igdb_data.get('aggregated_rating'),
        total_rating=igdb_data.get('total_rating'),
        total_rating_count=igdb_data.get('total_rating_count'),
        hypes=igdb_data.get('hypes'),
        genres=", ".join(g['name'] for g in igdb_data.get('genres', [])),
        platforms=", ".join(p['name'] for p in igdb_data.get('platforms', [])),
        first_release_date=release_date,
        screenshots=screenshots,
        videos=[f"https://www.youtube.com/embed/{v['video_id']}" for v in igdb_data.get('videos', [])],
        similar_games=similar_games,
        developers=", ".join(c['company']['name'] for c in igdb_data.get('involved_companies', []) if c.get('developer')),
        game_modes=", ".join(m['name'] for m in igdb_data.get('game_modes', [])),
        player_perspectives=", ".join(p['name'] for p in igdb_data.get('player_perspectives', [])),
        themes=", ".join(t['name'] for t in igdb_data.get('themes', [])),
        raw_data=igdb_data
    )

def ensure_games_in_db(db: Session, igdb_data_list: list) -> list:
    """Ensure all games from IGDB are stored in database"""
    result = []
    for game_data in igdb_data_list:
        # Check if game exists in database
        db_game = services.get_game_by_igdb_id(db, game_data['id'])
        if not db_game:
            # If not in database, process and store it
            game_create = process_igdb_data(game_data)
            db_game = services.create_game(db, game_create)
        result.append(db_game)
    return result

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
        popularity_query = """
            fields name, summary, storyline, first_release_date, 
                   genres.name, platforms.name, cover.image_id, 
                   screenshots.image_id, videos.video_id, rating, 
                   aggregated_rating, total_rating, total_rating_count, hypes,
                   similar_games.name, similar_games.cover.image_id, similar_games.rating,
                   similar_games.total_rating, similar_games.genres.name,
                   involved_companies.company.name, involved_companies.developer,
                   game_modes.name, player_perspectives.name, themes.name;
            where first_release_date >= {time_6_months_ago} 
            & first_release_date <= {time_now}
            & hypes > 0
            & cover != null;
            sort hypes desc;
            limit 12;
        """.format(
            time_6_months_ago=int((datetime.now() - timedelta(days=180)).timestamp()),
            time_now=int(datetime.now().timestamp())
        )
        
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
    
    query = f"""
        fields name, summary, storyline, first_release_date, 
               genres.name, platforms.name, cover.image_id, 
               screenshots.image_id, videos.video_id, rating, 
               aggregated_rating, total_rating, total_rating_count, hypes,
               similar_games.name, similar_games.cover.image_id, similar_games.rating,
               similar_games.total_rating, similar_games.genres.name,
               involved_companies.company.name, involved_companies.developer, game_modes.name, 
               player_perspectives.name, themes.name;
        where first_release_date > {current_timestamp} 
        & first_release_date < {one_year_future}
        & hypes > 0 
        & cover != null;
        sort hypes desc;
        limit 12;
    """
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

    query = """
        fields name, summary, storyline, first_release_date, 
               genres.name, platforms.name, cover.image_id, 
               screenshots.image_id, videos.video_id, rating, 
               aggregated_rating, total_rating, total_rating_count, hypes,
               similar_games.name, similar_games.cover.image_id, similar_games.rating,
               similar_games.total_rating, similar_games.genres.name,
               involved_companies.company.name, involved_companies.developer, game_modes.name, 
               player_perspectives.name, themes.name;
        where total_rating != null 
        & total_rating_count > 500
        & total_rating > 85
        & cover != null;
        sort total_rating desc;
        limit 12;
    """
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
    
    query = f"""
        fields name, summary, storyline, first_release_date, 
               genres.name, platforms.name, cover.image_id, 
               screenshots.image_id, videos.video_id, rating, 
               aggregated_rating, total_rating, total_rating_count, hypes,
               similar_games.name, similar_games.cover.image_id, similar_games.rating,
               similar_games.total_rating, similar_games.genres.name,
               involved_companies.company.name, involved_companies.developer, game_modes.name, 
               player_perspectives.name, themes.name;
        where first_release_date >= {one_month_ago}
        & first_release_date <= {current_timestamp}
        & first_release_date != null
        & cover != null;
        sort first_release_date desc;
        limit 12;
    """
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
        all_games = db.query(models.Game).all()
        updated_count = 0

        for game in all_games:
            try:
                # Fetch fresh data from IGDB
                igdb_data = services.fetch_from_igdb(game_id=game.igdb_id)
                if not igdb_data or not igdb_data.get('similar_games'):
                    continue

                # Process similar games in a single API call
                similar_games = []
                similar_ids = ','.join(str(id) for id in igdb_data['similar_games'])
                query = f"""
                    fields id, name, cover.image_id, total_rating, rating, genres.name;
                    where id = ({similar_ids});
                    limit 10;
                """
                similar_games_data = services.fetch_from_igdb(query=query)
                
                for similar_data in similar_games_data:
                    similar_games.append({
                        "id": similar_data["id"],
                        "name": similar_data["name"],
                        "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big/{similar_data['cover']['image_id']}.jpg"
                        if similar_data.get("cover") else None,
                        "rating": similar_data.get("total_rating", similar_data.get("rating")),
                        "genres": ", ".join(g['name'] for g in similar_data.get('genres', []))
                    })

                # Update the game with new similar games data
                game.similar_games = similar_games
                game.updated_at = datetime.utcnow()
                db.add(game)
                updated_count += 1

                # Commit every 10 games to avoid long transactions
                if updated_count % 10 == 0:
                    db.commit()

            except Exception as e:
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

# Manual trigger endpoints for testing
@router.post("/manual/update-latest")
async def trigger_latest_games_update():
    """Manually trigger the latest games update task"""
    try:
        from ...scheduler import update_latest_games
        await update_latest_games()
        return {"message": "Latest games update completed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating latest games: {str(e)}"
        )

@router.post("/manual/update-trending")
async def trigger_trending_games_update():
    """Manually trigger the trending games update task"""
    try:
        from ...scheduler import update_trending_games
        await update_trending_games()
        return {"message": "Trending games update completed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating trending games: {str(e)}"
        )
