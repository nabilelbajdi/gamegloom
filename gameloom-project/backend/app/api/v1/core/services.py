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
           involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
           game_modes.name, player_perspectives.name, themes.name, artworks.image_id,
           dlcs.name, dlcs.cover.image_id, 
           expansions.name, expansions.cover.image_id,
           remakes.name, remakes.cover.image_id,
           remasters.name, remasters.cover.image_id,
           parent_game.name, parent_game.cover.image_id,
           slug, game_status, game_type,
           franchise.name, franchises.name,
           collections.name,
           alternative_names.name, keywords.name,
           age_ratings.category, age_ratings.rating,
           game_engines.name,
           multiplayer_modes.campaigncoop, multiplayer_modes.dropin, multiplayer_modes.lancoop,
           multiplayer_modes.offlinecoop, multiplayer_modes.offlinecoopmax, multiplayer_modes.offlinemax,
           multiplayer_modes.onlinecoop, multiplayer_modes.onlinecoopmax, multiplayer_modes.onlinemax,
           multiplayer_modes.splitscreen,
           language_supports.language.name, language_supports.language.native_name;
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
    
    # Process DLCs
    dlcs = []
    for dlc in igdb_data.get('dlcs', []):
        if dlc.get('name'):
            dlc_data = {
                "id": dlc.get('id'),
                "name": dlc.get('name'),
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{dlc['cover']['image_id']}.jpg" 
                if dlc.get('cover', {}).get('image_id') else None
            }
            dlcs.append(dlc_data)
    
    # Process expansions
    expansions = []
    for expansion in igdb_data.get('expansions', []):
        if expansion.get('name'):
            expansion_data = {
                "id": expansion.get('id'),
                "name": expansion.get('name'),
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{expansion['cover']['image_id']}.jpg" 
                if expansion.get('cover', {}).get('image_id') else None
            }
            expansions.append(expansion_data)
    
    # Process remakes
    remakes = []
    for remake in igdb_data.get('remakes', []):
        if remake.get('name'):
            remake_data = {
                "id": remake.get('id'),
                "name": remake.get('name'),
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{remake['cover']['image_id']}.jpg" 
                if remake.get('cover', {}).get('image_id') else None
            }
            remakes.append(remake_data)
    
    # Process remasters
    remasters = []
    for remaster in igdb_data.get('remasters', []):
        if remaster.get('name'):
            remaster_data = {
                "id": remaster.get('id'),
                "name": remaster.get('name'),
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{remaster['cover']['image_id']}.jpg"
                if remaster.get('cover', {}).get('image_id') else None
            }
            remasters.append(remaster_data)
    
    # Process bundles
    bundles = []
    for bundle in igdb_data.get('bundles', []):
        if bundle.get('name'):
            bundle_data = {
                "id": bundle.get('id'),
                "name": bundle.get('name'),
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{bundle['cover']['image_id']}.jpg"
                if bundle.get('cover', {}).get('image_id') else None
            }
            bundles.append(bundle_data)
    
    # Process parent game
    parent_game = None
    if igdb_data.get('parent_game', {}).get('name'):
        parent_game = {
            "id": igdb_data['parent_game'].get('id'),
            "name": igdb_data['parent_game'].get('name'),
            "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{igdb_data['parent_game']['cover']['image_id']}.jpg" 
            if igdb_data['parent_game'].get('cover', {}).get('image_id') else None
        }
    
    # Process franchise and franchises
    franchise = igdb_data.get('franchise', {}).get('name') if igdb_data.get('franchise') else None
    franchises = [f['name'] for f in igdb_data.get('franchises', []) if f.get('name')]
    
    # Process collections
    collections = [c['name'] for c in igdb_data.get('collections', []) if c.get('name')]
    
    # Process alternative names
    alternative_names = [a['name'] for a in igdb_data.get('alternative_names', []) if a.get('name')]
    
    # Process keywords
    keywords = [k['name'] for k in igdb_data.get('keywords', []) if k.get('name')]

    # Process age ratings (new)
    age_ratings = []
    for rating in igdb_data.get('age_ratings', []):
        if rating.get('category') is not None and rating.get('rating') is not None:
            age_ratings.append({
                "category": rating['category'],  # 1=ESRB, 2=PEGI
                "rating": rating['rating']
            })

    # Process game engines (new)
    game_engines = [engine['name'] for engine in igdb_data.get('game_engines', []) if engine.get('name')]

    # Process publishers (new)
    publishers = ", ".join(c['company']['name'] for c in igdb_data.get('involved_companies', []) 
                           if c.get('publisher') and c.get('company', {}).get('name'))

    # Process multiplayer modes (new)
    multiplayer_modes = {}
    if igdb_data.get('multiplayer_modes'):
        mode = igdb_data['multiplayer_modes'][0] if isinstance(igdb_data['multiplayer_modes'], list) else igdb_data['multiplayer_modes']
        multiplayer_modes = {
            "campaigncoop": mode.get('campaigncoop'),
            "dropin": mode.get('dropin'),
            "lancoop": mode.get('lancoop'),
            "offlinecoop": mode.get('offlinecoop'),
            "offlinecoopmax": mode.get('offlinecoopmax'),
            "offlinemax": mode.get('offlinemax'),
            "onlinecoop": mode.get('onlinecoop'),
            "onlinecoopmax": mode.get('onlinecoopmax'),
            "onlinemax": mode.get('onlinemax'),
            "splitscreen": mode.get('splitscreen')
        }

    # Process language supports (new)
    language_supports = []
    for lang in igdb_data.get('language_supports', []):
        if lang.get('language', {}).get('name'):
            language_supports.append({
                "name": lang['language']['name'],
                "native_name": lang['language'].get('native_name')
            })
            
    # Game status mapping
    game_status_mapping = {
        0: "Released",
        2: "Alpha",
        3: "Beta",
        4: "Early Access",
        5: "Offline",
        6: "Cancelled",
        7: "Rumored",
        8: "Delisted"
    }
    
    # Game type mapping
    game_type_mapping = {
        0: "Main Game",
        1: "DLC/Addon",
        2: "Expansion",
        3: "Bundle",
        4: "Standalone Expansion",
        5: "Mod",
        6: "Episode",
        7: "Season",
        8: "Remake",
        9: "Remaster",
        10: "Expanded Game",
        11: "Port",
        12: "Fork",
        13: "Pack",
        14: "Update"
    }
    
    # Get game status info
    game_status_id = igdb_data.get('game_status')
    game_status_name = game_status_mapping.get(game_status_id) if game_status_id is not None else None
    
    # Get game type info
    game_type_id = igdb_data.get('game_type')
    game_type_name = game_type_mapping.get(game_type_id) if game_type_id is not None else None

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
        publishers=publishers,  # New field
        game_modes=", ".join(m['name'] for m in igdb_data.get('game_modes', [])),
        player_perspectives=", ".join(p['name'] for p in igdb_data.get('player_perspectives', [])),
        themes=", ".join(t['name'] for t in igdb_data.get('themes', [])),
        dlcs=dlcs,
        expansions=expansions,
        remakes=remakes,
        remasters=remasters,
        parent_game=parent_game,
        bundles=bundles,
        slug=igdb_data.get('slug'),
        game_status_id=game_status_id,
        game_status_name=game_status_name,
        game_type_id=game_type_id,
        game_type_name=game_type_name,
        age_ratings=age_ratings,  # New field
        game_engines=game_engines,  # New field
        multiplayer_modes=multiplayer_modes,  # New field
        language_supports=language_supports,  # New field
        franchise=franchise,
        franchises=franchises,
        collections=collections,
        alternative_names=alternative_names,
        keywords=keywords,
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

def get_highly_rated_games(db: Session, limit: int = 100) -> list[game.Game]:
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

def get_latest_games(db: Session, limit: int = 100) -> list[game.Game]:
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
