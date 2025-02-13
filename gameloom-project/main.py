import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI()

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

IGDB_CLIENT_ID = os.getenv("IGDB_CLIENT_ID")
IGDB_ACCESS_TOKEN = os.getenv("IGDB_ACCESS_TOKEN")
IGDB_URL = "https://api.igdb.com/v4/games"
IGDB_TIME_TO_BEAT_URL = "https://api.igdb.com/v4/game_time_to_beats"
if not IGDB_CLIENT_ID or not IGDB_ACCESS_TOKEN:
    raise ValueError("Missing IGDB API credentials. Check your .env file.")

current_timestamp = int(datetime.now().timestamp())

# List of anticipated games
@app.get("/anticipated-games")
def list_anticipated_games():
    """Fetch anticipated games from IGDB and return them to the frontend."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    body = f"""
        fields name, cover.url, cover.image_id, first_release_date, platforms.name, genres.name, summary, hypes;
        where first_release_date > {current_timestamp} & hypes != null & hypes > 10; 
        sort hypes desc;
        limit 6;
    """ 

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

    return response.json()

# List of highly rated games
@app.get("/highly-rated-games")
def list_highly_rated_games():
    """Fetch highly rated games using IGDB PopScore."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    body = """
        fields name, cover.url, cover.image_id, first_release_date, platforms.name, genres.name, summary, total_rating, total_rating_count;
        where cover != null & total_rating > 85 & total_rating_count > 500;
        sort total_rating desc;
        limit 6;
    """

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

    return response.json()

# List of latest game releases
@app.get("/latest-games")
def list_latest_games():
    """Fetch latest games using IGDB."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    body = f"""
        fields name, cover.url, cover.image_id, first_release_date, platforms.name, genres.name, summary, total_rating, total_rating_count;
        where cover != null & first_release_date <= {current_timestamp};
        sort first_release_date desc;
        limit 6;
    """

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

    return response.json()

# Game Details for a specific game
@app.get("/games/{game_id}")
def get_game(game_id: int):
    """Fetch a specific game's details from IGDB."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

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
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching game details: {str(e)}")

    game_data = response.json()

    if not game_data:
        raise HTTPException(status_code=404, detail="Game not found")

    release_date = game_data[0].get('first_release_date')
    if release_date and release_date > 0:
        game_data[0]['first_release_date'] = release_date * 1000
    else:
        game_data[0]['first_release_date'] = None

    return game_data[0]

# Fetch time to beat game
@app.get("/game-time-to-beat/{game_id}")
def get_game_time_to_beat(game_id: int):
    """Fetch a specific game's time to beat details from IGDB."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    body = f"""
        fields game_id, hastily, normally, completely;
        where game_id = {game_id};
    """

    try:
        response = requests.post(IGDB_TIME_TO_BEAT_URL, headers=headers, data=body)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching game time to beat: {str(e)}")

    time_to_beat_data = response.json()

    if not time_to_beat_data:
        return {}

    return time_to_beat_data[0]

# Fetch games developed by a specific company
@app.get("/games-by-developer/{company_id}")
def get_games_by_developer(company_id: int):
    """Fetch games developed by a specific company from IGDB."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    # Step 1: Get developer details
    company_body = f"fields developed; where id = {company_id};"

    
    try:
        company_response = requests.post("https://api.igdb.com/v4/companies", headers=headers, data=company_body)
        company_response.raise_for_status()
        company_data = company_response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching company details: {str(e)}")

    if not company_data or not company_data[0].get("developed"):
        return []

    developed_game_ids = company_data[0]["developed"][:8]

    # Step 2: Fetch game details for the developed games
    game_body = f"""
        fields id, name, genres.name, cover.image_id, rating;
        where id = ({','.join(map(str, developed_game_ids))});
    """

    try:
        game_response = requests.post(IGDB_URL, headers=headers, data=game_body)
        game_response.raise_for_status()
        game_data = game_response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games by developer: {str(e)}")

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

# List of trending games based on Steam's 24hr peak players
@app.get("/trending-games")
def list_trending_games():
    """Fetch trending games based on Steam 24hr peak players from IGDB."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

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
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trending games: {str(e)}")

    # Extract game IDs
    game_ids = [str(game["game_id"]) for game in popularity_data]

    if not game_ids:
        return []

    # Fetch detailed game info
    game_details_body = f"""
        fields id, name, cover.url, cover.image_id, genres.name, rating;
        where id = ({",".join(game_ids)});
    """

    try:
        response = requests.post(IGDB_URL, headers=headers, data=game_details_body)
        response.raise_for_status()
        game_details = response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching game details: {str(e)}")

    # Combine details with popularity score
    trending_games = []
    for game in game_details:
        popularity_entry = next((p for p in popularity_data if p["game_id"] == game["id"]), None)
        trending_score = round(popularity_entry["value"] * 100) if popularity_entry else 0

        trending_games.append({
        "id": game["id"],
        "name": game["name"],
        "genre": game.get("genres", [{}])[0].get("name", "Unknown"),
        "rating": f"{(game.get('rating', 0) / 20):.1f}" if game.get("rating") else "N/A",
        "cover": {
            "url": game.get("cover", {}).get("url", ""),
            "image_id": game.get("cover", {}).get("image_id", ""),
        },
        "steamPeakPlayers": trending_score,
        })

    return trending_games
