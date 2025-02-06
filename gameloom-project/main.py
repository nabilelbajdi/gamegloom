import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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

if not IGDB_CLIENT_ID or not IGDB_ACCESS_TOKEN:
    raise ValueError("Missing IGDB API credentials. Check your .env file.")

@app.get("/games")
def list_games():
    """Fetch games from IGDB and return them to the frontend."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    body = "fields name,genres.name,rating,cover.url; limit 7;"

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

    return response.json()


@app.get("/games/{game_id}")
def get_game(game_id: int):
    """Fetch a specific game's details from IGDB."""
    headers = {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    body = f"fields name,genres.name,rating,cover.url; where id = {game_id};"

    try:
        response = requests.post(IGDB_URL, headers=headers, data=body)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

    return response.json()