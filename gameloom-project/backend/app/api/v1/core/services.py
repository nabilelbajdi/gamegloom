# services.py
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import game
from . import schemas
from ...settings import settings
import requests
import logging

logger = logging.getLogger(__name__)

# IGDB Constants
IGDB_GAME_FIELDS = """
    fields name, summary, storyline, first_release_date, 
           genres.name, platforms.name, cover.image_id, 
           screenshots.image_id, videos.video_id, rating, 
           aggregated_rating, total_rating, total_rating_count, hypes,
           similar_games.name, similar_games.cover.image_id, similar_games.rating,
           similar_games.total_rating, similar_games.genres.name,
           involved_companies.company.name, involved_companies.developer, game_modes.name, 
           player_perspectives.name, themes.name, artworks.image_id;
"""

IGDB_SIMILAR_GAME_FIELDS = "fields id, name, cover.image_id, total_rating, rating, genres.name;"

# IGDB Service Functions
def fetch_from_igdb(game_id: int = None, query: str = None, endpoint: str = "games") -> dict | list:
    """Fetch data from IGDB API"""
    headers = {
        "Client-ID": settings.IGDB_CLIENT_ID,
        "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
    }

    if game_id:
        # Make sure to explicitly request artworks for individual game fetches
        body = f"{IGDB_GAME_FIELDS} where id = {game_id};"
    else:
        body = query

    url = f"https://api.igdb.com/v4/{endpoint}"
    response = requests.post(url, headers=headers, data=body)
    response.raise_for_status()
    data = response.json()

    return data[0] if game_id else data

def process_similar_games(similar_games_data: list) -> list:
    """Process similar games data into our format"""
    similar_games = []
    for similar_data in similar_games_data:
        if similar_data.get('cover'):
            similar_games.append({
                "id": similar_data["id"],
                "name": similar_data["name"],
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{similar_data['cover']['image_id']}.jpg"
                if similar_data.get("cover") else None,
                "rating": similar_data.get("total_rating", similar_data.get("rating")),
                "genres": ", ".join(g['name'] for g in similar_data.get('genres', []))
            })
    return similar_games

def process_igdb_data(igdb_data: dict) -> schemas.GameCreate:
    """Process IGDB data into our schema format"""
    release_date = datetime.fromtimestamp(igdb_data.get('first_release_date', 0)) if igdb_data.get('first_release_date') else None
    
    cover_image = None
    if igdb_data.get('cover', {}).get('image_id'):
        cover_image = f"https://images.igdb.com/igdb/image/upload/t_1080p/{igdb_data['cover']['image_id']}.jpg"
    
    screenshots = [
        f"https://images.igdb.com/igdb/image/upload/t_screenshot_big/{s['image_id']}.jpg"
        for s in igdb_data.get('screenshots', [])
    ]
    
    # Process artworks
    artworks = [
        f"https://images.igdb.com/igdb/image/upload/t_1080p/{a['image_id']}.jpg"
        for a in igdb_data.get('artworks', [])
    ]

    similar_games = process_similar_games(igdb_data.get('similar_games', []))

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
        artworks=artworks,
        videos=[f"https://www.youtube.com/embed/{v['video_id']}" for v in igdb_data.get('videos', [])],
        similar_games=similar_games,
        developers=", ".join(c['company']['name'] for c in igdb_data.get('involved_companies', []) if c.get('developer')),
        game_modes=", ".join(m['name'] for m in igdb_data.get('game_modes', [])),
        player_perspectives=", ".join(p['name'] for p in igdb_data.get('player_perspectives', [])),
        themes=", ".join(t['name'] for t in igdb_data.get('themes', [])),
        raw_data=igdb_data
    )

# Database Service Functions
async def sync_games_from_igdb(db: Session, query: str) -> tuple[int, int]:
    """Sync games from IGDB to database using provided query
    Returns: (new_games_count, updated_games_count)
    """
    try:
        games_data = fetch_from_igdb(query=query)
        new_count = update_count = 0
        
        for game_data in games_data:
            try:
                processed_data = process_igdb_data(game_data)
                existing_game = get_game_by_igdb_id(db, game_data['id'])
                
                if existing_game:
                    # Only update if there are actual changes
                    has_changes = False
                    for key, value in processed_data.model_dump(exclude={'raw_data'}).items():
                        if getattr(existing_game, key) != value:
                            has_changes = True
                            break
                    
                    if has_changes:
                        update_game(db, existing_game.id, processed_data)
                        update_count += 1
                else:
                    create_game(db, processed_data)
                    new_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing game {game_data.get('name', 'Unknown')}: {str(e)}")
                continue
                
        return new_count, update_count
        
    except Exception as e:
        logger.error(f"Error syncing games from IGDB: {str(e)}")
        return 0, 0

def get_game_by_id(db: Session, game_id: int) -> game.Game | None:
    """Fetch a game from the database by ID"""
    return db.scalar(select(game.Game).where(game.Game.id == game_id))

def get_game_by_igdb_id(db: Session, igdb_id: int) -> game.Game | None:
    """Fetch a game from the database by IGDB ID"""
    return db.scalar(select(game.Game).where(game.Game.igdb_id == igdb_id))

def create_game(db: Session, game_data: schemas.GameCreate) -> game.Game:
    """Create a new game in the database"""
    db_game = game.Game(**game_data.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

def update_game(db: Session, game_id: int, game: schemas.GameUpdate) -> game.Game | None:
    """Update an existing game in the database"""
    db_game = get_game_by_id(db, game_id)
    if not db_game:
        return None
    
    game_data = game.model_dump(exclude_unset=True)
    for key, value in game_data.items():
        setattr(db_game, key, value)
    
    db_game.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_game)
    return db_game

def get_trending_games(db: Session, limit: int = 100) -> list[game.Game]:
    """Get trending games from the database"""
    current_time = datetime.utcnow()
    six_months_ago = current_time - timedelta(days=180)
    
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.first_release_date.between(six_months_ago, current_time),
            game.Game.cover_image.is_not(None),
            game.Game.hypes > 0
        )
        .order_by(
            game.Game.hypes.desc(),
            game.Game.total_rating.desc().nulls_last(),
            game.Game.first_release_date.desc()
        )
        .limit(limit)
    ))

def get_anticipated_games(db: Session, limit: int = 100) -> list[game.Game]:
    """Get anticipated games from the database"""
    current_time = datetime.utcnow()
    one_year_future = current_time + timedelta(days=365)
    
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.first_release_date.between(current_time, one_year_future),
            game.Game.cover_image.is_not(None)
        )
        .order_by(game.Game.hypes.desc().nulls_last(), game.Game.first_release_date.asc())
        .limit(limit)
    ))

def get_highly_rated_games(db: Session, limit: int = 20) -> list[game.Game]:
    """Get highly rated games from the database"""
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.total_rating.is_not(None),
            game.Game.total_rating > 85,
            game.Game.total_rating_count > 500,
            game.Game.cover_image.is_not(None)
        )
        .order_by(game.Game.total_rating.desc())
        .limit(limit)
    ))

def get_latest_games(db: Session, limit: int = 20) -> list[game.Game]:
    """Get latest released games from the database"""
    current_time = datetime.utcnow()
    one_month_ago = current_time - timedelta(days=30)
    
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.first_release_date.between(one_month_ago, current_time),
            game.Game.first_release_date.is_not(None),
            game.Game.cover_image.is_not(None)
        )
        .order_by(game.Game.first_release_date.desc())
        .limit(limit)
    ))

def search_games_in_db(db: Session, query: str, limit: int = 6) -> list[game.Game]:
    """Search for games in database matching the query"""
    return list(db.scalars(
        select(game.Game)
        .where(
            game.Game.name.ilike(f"%{query}%")
        )
        .order_by(game.Game.total_rating.desc().nulls_last())
        .limit(limit)
    ))
