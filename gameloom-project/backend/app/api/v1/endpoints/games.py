# endpoints/games.py
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core import services, schemas
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
                   aggregated_rating, total_rating, total_rating_count, hypes, similar_games,
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
    screenshots = []
    if igdb_data.get('screenshots'):
        screenshots = [
            f"https://images.igdb.com/igdb/image/upload/t_screenshot_big/{s['image_id']}.jpg"
            for s in igdb_data['screenshots']
        ]
    
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
        similar_games=igdb_data.get('similar_games', []),
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
        igdb_data = fetch_from_igdb(game_id=igdb_id)
        game_data = process_igdb_data(igdb_data)
        return services.create_game(db, game_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trending-games", response_model=List[schemas.Game])
async def get_trending_games(db: Session = Depends(get_db)):
    """Get trending games based on Steam's 24hr peak players"""
    # Check database first
    db_games = services.get_trending_games(db)
    if len(db_games) >= 6:  # Only use DB results if we have enough games
        return db_games

    try:
        # Get games with high Steam 24hr peak players (popularity_type = 5)
        steam_query = """
            fields game_id, value;
            where popularity_type = 5;
            sort value desc;
            limit 50;
        """
        steam_data = fetch_from_igdb(query=steam_query, endpoint="popularity_primitives")
        
        # Debug logging
        print("Steam popularity data:")
        for item in steam_data:
            print(f"Game ID: {item['game_id']}, Value: {item['value']}")
        
        game_ids = [str(item['game_id']) for item in steam_data]
        
        if game_ids:
            # First, get games that have cover images
            games_query = f"""
                fields id, name, cover.url, cover.image_id, first_release_date, 
                       platforms.name, genres.name, summary, rating, 
                       aggregated_rating, total_rating, total_rating_count,
                       screenshots.image_id, videos.video_id,
                       involved_companies.company.name, involved_companies.developer;
                where id = ({','.join(game_ids)}) & cover != null;
                limit 12;
            """
            igdb_data = fetch_from_igdb(query=games_query)
            
            if not igdb_data:
                print("No games found with cover images")
                return []
            
            # Create a mapping of game_id to popularity value
            popularity_map = {str(item['game_id']): item['value'] for item in steam_data}
            
            # Sort the games based on their popularity value
            igdb_data.sort(key=lambda x: popularity_map.get(str(x['id']), 0), reverse=True)
            
            # Debug logging
            print("\nSorted games by popularity:")
            for game in igdb_data:
                print(f"Game: {game['name']}, Popularity: {popularity_map.get(str(game['id']), 0)}")
            
            return ensure_games_in_db(db, igdb_data)
        
        print("No popularity data found")
        return []
        
    except Exception as e:
        print(f"Error in trending games: {str(e)}")  # Add logging
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching trending games: {str(e)}"
        )

@router.get("/anticipated-games", response_model=List[schemas.Game])
async def get_anticipated_games(db: Session = Depends(get_db)):
    """Get anticipated games"""
    # Check database first
    db_games = services.get_anticipated_games(db)
    if len(db_games) >= 6:  # Only use DB results if we have enough games
        return db_games

    # If no games in database, fetch from IGDB
    current_timestamp = int(datetime.now().timestamp())
    one_year_future = current_timestamp + (365 * 24 * 60 * 60)  # 1 year from now
    
    query = f"""
        fields name, cover.url, cover.image_id, first_release_date, 
               platforms.name, genres.name, summary, hypes,
               screenshots.image_id, videos.video_id,
               involved_companies.company.name, involved_companies.developer;
        where first_release_date > {current_timestamp} 
        & first_release_date < {one_year_future}
        & hypes > 0 
        & cover != null;
        sort hypes desc;
        limit 6;
    """
    try:
        igdb_data = fetch_from_igdb(query=query)
        if not igdb_data:  # If no games with hype, try without hype filter
            query = f"""
                fields name, cover.url, cover.image_id, first_release_date, 
                       platforms.name, genres.name, summary, hypes,
                       screenshots.image_id, videos.video_id,
                       involved_companies.company.name, involved_companies.developer;
                where first_release_date > {current_timestamp} 
                & first_release_date < {one_year_future}
                & cover != null;
                sort first_release_date asc;
                limit 6;
            """
            igdb_data = fetch_from_igdb(query=query)
        return ensure_games_in_db(db, igdb_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/highly-rated-games", response_model=List[schemas.Game])
async def get_highly_rated_games(db: Session = Depends(get_db)):
    """Get highly rated games"""
    # Check database first
    db_games = services.get_highly_rated_games(db)
    if len(db_games) >= 6:  # Only use DB results if we have enough games
        return db_games

    # If no games in database, fetch from IGDB
    query = """
        fields name, cover.url, cover.image_id, first_release_date, 
               platforms.name, genres.name, summary, total_rating, total_rating_count,
               screenshots.image_id, videos.video_id,
               involved_companies.company.name, involved_companies.developer;
        where total_rating != null 
        & total_rating_count > 500
        & total_rating > 85
        & cover != null;
        sort total_rating desc;
        limit 6;
    """
    try:
        igdb_data = fetch_from_igdb(query=query)
        return ensure_games_in_db(db, igdb_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest-games", response_model=List[schemas.Game])
async def get_latest_games(db: Session = Depends(get_db)):
    """Get latest games"""
    # Check database first
    db_games = services.get_latest_games(db)
    if len(db_games) >= 6:  # Only use DB results if we have enough games
        return db_games

    # If no games in database, fetch from IGDB
    current_timestamp = int(datetime.now().timestamp())
    one_month_ago = current_timestamp - (30 * 24 * 60 * 60)  # 30 days ago
    
    query = f"""
        fields name, cover.url, cover.image_id, first_release_date, 
               platforms.name, genres.name, summary, rating, total_rating,
               screenshots.image_id, videos.video_id,
               involved_companies.company.name, involved_companies.developer;
        where first_release_date >= {one_month_ago}
        & first_release_date <= {current_timestamp}
        & cover != null;
        sort first_release_date desc;
        limit 6;
    """
    try:
        igdb_data = fetch_from_igdb(query=query)
        return ensure_games_in_db(db, igdb_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
