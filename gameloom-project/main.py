import os
import requests
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.core.models import Game
from app.api.v1.core.schemas import GameCreate
from app.api.v1.core.services import create_game, get_game_by_igdb_id
from app.db_setup import get_db, init_db
from app.settings import settings

# Funktion som körs när vi startar FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IGDB_URL = "https://api.igdb.com/v4/games"
IGDB_TIME_TO_BEAT_URL = "https://api.igdb.com/v4/game_time_to_beats"

def get_igdb_headers():
    return {
        "Client-ID": settings.IGDB_CLIENT_ID,
        "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

# List of anticipated games
@app.get("/anticipated-games")
def list_anticipated_games():
    """Fetch anticipated games from IGDB and store them in the database."""
    db = next(get_db())
    current_timestamp = int(datetime.now().timestamp())
    
    headers = get_igdb_headers()
    body = f"""
        fields name, cover.url, cover.image_id, first_release_date, platforms.name, genres.name, summary, hypes;
        where first_release_date > {current_timestamp} & hypes != null & hypes > 10; 
        sort hypes desc;
        limit 6;
    """

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
        games_data = response.json()
        
        result = []
        for game_data in games_data:
            # Check if game exists in database
            db_game = get_game_by_igdb_id(db, game_data["id"])
            if not db_game:
                # Create game in database
                game_create = GameCreate(
                    igdb_id=game_data["id"],
                    name=game_data["name"],
                    summary=game_data.get("summary"),
                    first_release_date=datetime.fromtimestamp(game_data["first_release_date"]) if game_data.get("first_release_date") else None,
                    hypes=game_data.get("hypes"),
                    cover=game_data.get("cover"),
                    genres=[{"name": g["name"]} for g in game_data.get("genres", [])],
                    platforms=[{"name": p["name"]} for p in game_data.get("platforms", [])]
                )
                db_game = create_game(db, game_create)
            
            # Format response
            result.append({
                "id": db_game.igdb_id,  # Use IGDB ID for frontend
                "name": db_game.name,
                "genre": db_game.genres[0]["name"] if db_game.genres else "Unknown",
                "rating": f"{(db_game.rating / 20):.1f}" if db_game.rating else "N/A",
                "coverImage": f"https://images.igdb.com/igdb/image/upload/t_1080p/{db_game.cover['image_id']}.jpg" if db_game.cover and db_game.cover.get("image_id") else None
            })
            
        return result
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

# List of highly rated games
@app.get("/highly-rated-games")
def list_highly_rated_games():
    """Fetch highly rated games using IGDB."""
    db = next(get_db())
    headers = get_igdb_headers()

    body = """
        fields name, cover.url, cover.image_id, first_release_date, platforms.name, genres.name, summary, total_rating, total_rating_count;
        where cover != null & total_rating > 85 & total_rating_count > 500;
        sort total_rating desc;
        limit 6;
    """

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
        games_data = response.json()
        
        result = []
        for game_data in games_data:
            # Check if game exists in database
            db_game = get_game_by_igdb_id(db, game_data["id"])
            if not db_game:
                # Create game in database
                game_create = GameCreate(
                    igdb_id=game_data["id"],
                    name=game_data["name"],
                    summary=game_data.get("summary"),
                    first_release_date=datetime.fromtimestamp(game_data["first_release_date"]) if game_data.get("first_release_date") else None,
                    total_rating=game_data.get("total_rating"),
                    total_rating_count=game_data.get("total_rating_count"),
                    cover=game_data.get("cover"),
                    genres=[{"name": g["name"]} for g in game_data.get("genres", [])],
                    platforms=[{"name": p["name"]} for p in game_data.get("platforms", [])]
                )
                db_game = create_game(db, game_create)
            
            # Format response
            result.append({
                "id": db_game.igdb_id,
                "name": db_game.name,
                "genre": db_game.genres[0]["name"] if db_game.genres else "Unknown",
                "rating": f"{(db_game.total_rating / 20):.1f}" if db_game.total_rating else "N/A",
                "coverImage": f"https://images.igdb.com/igdb/image/upload/t_1080p/{db_game.cover['image_id']}.jpg" if db_game.cover and db_game.cover.get("image_id") else None
            })
            
        return result
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

# List of latest game releases
@app.get("/latest-games")
def list_latest_games():
    """Fetch latest games using IGDB."""
    db = next(get_db())
    current_timestamp = int(datetime.now().timestamp())
    headers = get_igdb_headers()

    body = f"""
        fields name, cover.url, cover.image_id, first_release_date, platforms.name, genres.name, summary, total_rating, total_rating_count;
        where cover != null & first_release_date <= {current_timestamp};
        sort first_release_date desc;
        limit 6;
    """

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
        games_data = response.json()
        
        result = []
        for game_data in games_data:
            # Check if game exists in database
            db_game = get_game_by_igdb_id(db, game_data["id"])
            if not db_game:
                # Create game in database
                game_create = GameCreate(
                    igdb_id=game_data["id"],
                    name=game_data["name"],
                    summary=game_data.get("summary"),
                    first_release_date=datetime.fromtimestamp(game_data["first_release_date"]) if game_data.get("first_release_date") else None,
                    total_rating=game_data.get("total_rating"),
                    total_rating_count=game_data.get("total_rating_count"),
                    cover=game_data.get("cover"),
                    genres=[{"name": g["name"]} for g in game_data.get("genres", [])],
                    platforms=[{"name": p["name"]} for p in game_data.get("platforms", [])]
                )
                db_game = create_game(db, game_create)
            
            # Format response
            result.append({
                "id": db_game.igdb_id,
                "name": db_game.name,
                "genre": db_game.genres[0]["name"] if db_game.genres else "Unknown",
                "rating": f"{(db_game.total_rating / 20):.1f}" if db_game.total_rating else "N/A",
                "coverImage": f"https://images.igdb.com/igdb/image/upload/t_1080p/{db_game.cover['image_id']}.jpg" if db_game.cover and db_game.cover.get("image_id") else None
            })
            
        return result
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

# Game Details for a specific game
@app.get("/games/{game_id}")
def get_game(game_id: int):
    """Fetch a specific game's details from IGDB and store in database."""
    db = next(get_db())
    
    # First check if game exists in database
    db_game = get_game_by_igdb_id(db, game_id)
    if db_game:
        # Format and return the database game
        return format_game_response(db_game)
    
    # If not in database, fetch from IGDB
    headers = get_igdb_headers()
    body = f"""
        fields name, summary, storyline, first_release_date, 
               genres.name, platforms.name, cover.image_id, 
               screenshots.image_id, videos.video_id, rating, 
               aggregated_rating, total_rating, total_rating_count, hypes, similar_games,
               involved_companies.company.name, involved_companies.developer, game_modes.name, 
               player_perspectives.name, themes.name;
        where id = {game_id};
    """

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
        game_data = response.json()

        if not game_data:
            raise HTTPException(status_code=404, detail="Game not found")

        game_data = game_data[0]
        
        # Create game in database
        game_create = GameCreate(
            igdb_id=game_data["id"],
            name=game_data["name"],
            summary=game_data.get("summary"),
            storyline=game_data.get("storyline"),
            first_release_date=datetime.fromtimestamp(game_data["first_release_date"]) if game_data.get("first_release_date") else None,
            rating=game_data.get("rating"),
            aggregated_rating=game_data.get("aggregated_rating"),
            total_rating=game_data.get("total_rating"),
            total_rating_count=game_data.get("total_rating_count"),
            hypes=game_data.get("hypes"),
            cover={"image_id": game_data["cover"]["image_id"]} if game_data.get("cover") else None,
            screenshots=[{"image_id": s["image_id"]} for s in game_data.get("screenshots", [])],
            videos=[{"video_id": v["video_id"]} for v in game_data.get("videos", [])],
            genres=[{"name": g["name"]} for g in game_data.get("genres", [])],
            platforms=[{"name": p["name"]} for p in game_data.get("platforms", [])],
            themes=[{"name": t["name"]} for t in game_data.get("themes", [])],
            similar_games=game_data.get("similar_games", []),
            involved_companies=[{
                "company": {"name": c["company"]["name"]},
                "developer": c["developer"]
            } for c in game_data.get("involved_companies", [])],
            game_modes=[{"name": m["name"]} for m in game_data.get("game_modes", [])],
            player_perspectives=[{"name": p["name"]} for p in game_data.get("player_perspectives", [])]
        )
        
        db_game = create_game(db, game_create)
        
        # Format and return response
        return format_game_response(db_game)
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching game details: {str(e)}")

def format_game_response(game: Game) -> dict:
    """Format a database game object for API response."""
    return {
        "id": game.igdb_id,
        "name": game.name,
        "summary": game.summary,
        "storyline": game.storyline,
        "releaseDate": game.first_release_date.strftime("%B %d, %Y") if game.first_release_date else "TBA",
        "coverImage": f"https://images.igdb.com/igdb/image/upload/t_1080p/{game.cover['image_id']}.jpg" if game.cover and game.cover.get("image_id") else None,
        "screenshots": [f"https://images.igdb.com/igdb/image/upload/t_screenshot_big/{s['image_id']}.jpg" for s in game.screenshots] if game.screenshots else [],
        "videos": [f"https://www.youtube.com/embed/{v['video_id']}" for v in game.videos] if game.videos else [],
        "genres": ", ".join(g["name"] for g in game.genres) if game.genres else None,
        "platforms": ", ".join(p["name"] for p in game.platforms) if game.platforms else None,
        "rating": f"{(game.rating / 20):.1f}" if game.rating else "N/A",
        "aggregatedRating": f"{(game.aggregated_rating / 20):.1f}" if game.aggregated_rating else "N/A",
        "totalRatings": game.total_rating_count,
        "hypes": game.hypes,
        "similarGames": game.similar_games,
        "developers": " • ".join(c["company"]["name"] for c in game.involved_companies if c.get("developer")) if game.involved_companies else None,
        "gameModes": ", ".join(m["name"] for m in game.game_modes) if game.game_modes else None,
        "playerPerspectives": ", ".join(p["name"] for p in game.player_perspectives) if game.player_perspectives else None,
        "themes": ", ".join(t["name"] for t in game.themes) if game.themes else None,
    }

# Fetch time to beat game
@app.get("/game-time-to-beat/{game_id}")
def get_game_time_to_beat(game_id: int):
    """Fetch a specific game's time to beat details from IGDB."""
    headers = get_igdb_headers()
    body = f"""
        fields game_id, hastily, normally, completely;
        where game_id = {game_id};
    """

    try:
        response = requests.post(IGDB_TIME_TO_BEAT_URL, headers=headers, data=body)
        response.raise_for_status()
        time_to_beat_data = response.json()

        if not time_to_beat_data:
            return {}

        return time_to_beat_data[0]
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching game time to beat: {str(e)}")

# Fetch games developed by a specific company
@app.get("/games-by-developer/{company_id}")
def get_games_by_developer(company_id: int):
    """Fetch games developed by a specific company from IGDB."""
    headers = get_igdb_headers()
    company_body = f"fields developed; where id = {company_id};"

    try:
        company_response = requests.post("https://api.igdb.com/v4/companies", headers=headers, data=company_body)
        company_response.raise_for_status()
        company_data = company_response.json()

        if not company_data or not company_data[0].get("developed"):
            return []

        developed_game_ids = company_data[0]["developed"][:8]
        game_body = f"""
            fields id, name, genres.name, cover.image_id, rating;
            where id = ({','.join(map(str, developed_game_ids))});
        """

        game_response = requests.post(IGDB_URL, headers=headers, data=game_body)
        game_response.raise_for_status()
        game_data = game_response.json()

        return [
            {
                "id": game["id"],
                "title": game["name"],
                "genre": game.get("genres", [{}])[0].get("name", "Unknown"),
                "rating": f"{(game.get('rating', 0) / 20):.1f}" if game.get("rating") else "N/A",
                "coverImage": f"https://images.igdb.com/igdb/image/upload/t_1080p/{game['cover']['image_id']}.jpg"
                if game.get("cover") else None,
            }
            for game in game_data
        ]
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games by developer: {str(e)}")

# List of trending games based on Steam's 24hr peak players
@app.get("/trending-games")
def list_trending_games():
    """Fetch trending games based on Steam 24hr peak players from IGDB."""
    db = next(get_db())
    headers = get_igdb_headers()

    body = """
        fields game_id, value, popularity_type;
        where popularity_type = 5;
        sort value desc;
        limit 6;
    """

    try:
        response = requests.post("https://api.igdb.com/v4/popularity_primitives", headers=headers, data=body)
        response.raise_for_status()
        popularity_data = response.json()

        # Extract game IDs
        game_ids = [str(game["game_id"]) for game in popularity_data]

        if not game_ids:
            return []

        # Fetch detailed game info
        game_details_body = f"""
            fields id, name, cover.url, cover.image_id, genres.name, rating;
            where id = ({",".join(game_ids)});
        """

        response = requests.post(IGDB_URL, headers=headers, data=game_details_body)
        response.raise_for_status()
        games_data = response.json()

        result = []
        for game_data in games_data:
            # Check if game exists in database
            db_game = get_game_by_igdb_id(db, game_data["id"])
            if not db_game:
                # Create game in database
                game_create = GameCreate(
                    igdb_id=game_data["id"],
                    name=game_data["name"],
                    rating=game_data.get("rating"),
                    cover=game_data.get("cover"),
                    genres=[{"name": g["name"]} for g in game_data.get("genres", [])]
                )
                db_game = create_game(db, game_create)
            
            # Get popularity value
            popularity_entry = next((p for p in popularity_data if p["game_id"] == game_data["id"]), None)
            trending_score = round(popularity_entry["value"] * 100) if popularity_entry else 0
            
            # Format response
            result.append({
                "id": db_game.igdb_id,
                "name": db_game.name,
                "genre": db_game.genres[0]["name"] if db_game.genres else "Unknown",
                "rating": f"{(db_game.rating / 20):.1f}" if db_game.rating else "N/A",
                "coverImage": f"https://images.igdb.com/igdb/image/upload/t_1080p/{db_game.cover['image_id']}.jpg" if db_game.cover and db_game.cover.get("image_id") else None,
                "steamPeakPlayers": trending_score
            })

        return result
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trending games: {str(e)}")
