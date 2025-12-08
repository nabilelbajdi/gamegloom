# services.py
from datetime import datetime, timedelta
from sqlalchemy import select, or_, case, String
from sqlalchemy.orm import Session

from ..models import game
from . import schemas
from ...settings import settings
import requests
import logging
import asyncio
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

# IGDB Constants
IGDB_GAME_FIELDS = """
    fields name, summary, storyline, first_release_date, 
           genres.name, platforms.name, cover.image_id, 
           screenshots.image_id, videos.video_id, rating, 
           aggregated_rating, aggregated_rating_count, total_rating, total_rating_count, hypes,
           similar_games.name, similar_games.cover.image_id, similar_games.rating,
           similar_games.total_rating, similar_games.genres.name, similar_games.slug,
           involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
           game_modes.name, player_perspectives.name, themes.name, artworks.image_id,
           dlcs.name, dlcs.cover.image_id, 
           expansions.name, expansions.cover.image_id,
           remakes.name, remakes.cover.image_id,
           remasters.name, remasters.cover.image_id,
           parent_game.name, parent_game.cover.image_id,
           ports.name, ports.cover.image_id,
           standalone_expansions.name, standalone_expansions.cover.image_id,
           version_parent.name, version_parent.cover.image_id,
           version_title,
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

# IGDB Service Functions
def fetch_from_igdb(game_id: int = None, query: str = None, endpoint: str = "games") -> dict | list:
    """Fetch data from IGDB API"""
    headers = {
        "Client-ID": settings.IGDB_CLIENT_ID,
        "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
        "Accept": "application/json",
    }

    if game_id:
        body = f"{IGDB_GAME_FIELDS} where id = {game_id};"
    else:
        body = query

    url = f"https://api.igdb.com/v4/{endpoint}"
    response = requests.post(url, headers=headers, data=body)
    response.raise_for_status()
    data = response.json()

    return data[0] if game_id else data

# Game types to exclude (these aren't full games)
EXCLUDED_GAME_TYPES = {
    5: "Mod",
    13: "Pack", 
    14: "Update"
}

def meets_quality_requirements(game_data: schemas.GameCreate, log_warnings: bool = True) -> bool:
    """Check if a game meets minimum quality requirements for storage.
    
    Requirements:
    1. Must have a cover image
    2. Must have a summary or storyline
    3. Must not be a Mod, Pack, or Update
    
    Args:
        game_data: The processed game data to check
        log_warnings: If True, log warnings for rejected games
        
    Returns:
        True if game meets requirements, False otherwise
    """
    # Check for excluded game types
    if game_data.game_type_id in EXCLUDED_GAME_TYPES:
        if log_warnings:
            logger.info(f"[Quality] Skipping '{game_data.name}': is a {EXCLUDED_GAME_TYPES[game_data.game_type_id]}")
        return False
    
    # Check for cover image
    if not game_data.cover_image:
        if log_warnings:
            logger.info(f"[Quality] Skipping '{game_data.name}': no cover image")
        return False
    
    # Check for summary or storyline
    has_description = bool(game_data.summary) or bool(game_data.storyline)
    if not has_description:
        if log_warnings:
            logger.info(f"[Quality] Skipping '{game_data.name}': no summary or storyline")
        return False
    
    return True

def process_similar_games(similar_games_data: list) -> list:
    """Process similar games data into our format"""
    similar_games = []
    for similar_data in similar_games_data:
        if similar_data.get('cover'):
            similar_games.append({
                "id": similar_data["id"],
                "name": similar_data["name"],
                "slug": similar_data.get("slug"),
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
    
    # Process version parent (for game editions)
    version_parent = None
    if igdb_data.get('version_parent', {}).get('name'):
        version_parent = {
            "id": igdb_data['version_parent'].get('id'),
            "name": igdb_data['version_parent'].get('name'),
            "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{igdb_data['version_parent']['cover']['image_id']}.jpg" 
            if igdb_data['version_parent'].get('cover', {}).get('image_id') else None
        }
    
    # Get version title (for game editions)
    version_title = igdb_data.get('version_title')
    
    # Initialize editions and in_bundles arrays
    editions = []
    in_bundles = []
    
    # Process ports
    ports = []
    for port in igdb_data.get('ports', []):
        if port.get('name'):
            port_data = {
                "id": port.get('id'),
                "name": port.get('name'),
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{port['cover']['image_id']}.jpg"
                if port.get('cover', {}).get('image_id') else None
            }
            ports.append(port_data)
    
    # Process standalone expansions
    standalone_expansions = []
    for exp in igdb_data.get('standalone_expansions', []):
        if exp.get('name'):
            exp_data = {
                "id": exp.get('id'),
                "name": exp.get('name'),
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{exp['cover']['image_id']}.jpg"
                if exp.get('cover', {}).get('image_id') else None
            }
            standalone_expansions.append(exp_data)
    
    # Initialize empty arrays for special game types
    episodes = []
    seasons = []
    packs = []
    
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

    # Return the full game data
    return schemas.GameCreate(
        igdb_id=igdb_data['id'],
        name=igdb_data['name'],
        summary=igdb_data.get('summary'),
        storyline=igdb_data.get('storyline'),
        cover_image=cover_image,
        rating=igdb_data.get('rating'),
        aggregated_rating=igdb_data.get('aggregated_rating'),
        aggregated_rating_count=igdb_data.get('aggregated_rating_count'),
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
        ports=ports,
        standalone_expansions=standalone_expansions,
        episodes=episodes,
        seasons=seasons,
        packs=packs,
        editions=editions,
        in_bundles=in_bundles,
        version_parent=version_parent,
        version_title=version_title,
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
    """Sync games from IGDB to database"""
    try:
        igdb_data = fetch_from_igdb(query=query)
        new_count = 0
        update_count = 0
        skipped_count = 0
        
        for game_data in igdb_data:
            try:
                if not game_data.get('name'):
                    continue
                    
                processed_data = process_igdb_data(game_data)
                
                # Check if game already exists
                existing_game = get_game_by_igdb_id(db, game_data['id'])
                
                if existing_game:
                    # Update existing games even if they don't meet quality requirements
                    # (they were already accepted before)
                    update_game(db, existing_game.id, processed_data)
                    update_count += 1
                else:
                    # Only create new games that meet quality requirements
                    if meets_quality_requirements(processed_data):
                        create_game(db, processed_data)
                        new_count += 1
                    else:
                        skipped_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing game {game_data.get('name', 'Unknown')}: {str(e)}")
                continue
        
        if skipped_count > 0:
            logger.info(f"[Quality] Skipped {skipped_count} games that didn't meet quality requirements")
                
        return new_count, update_count

        
    except Exception as e:
        logger.error(f"Error syncing games from IGDB: {str(e)}")
        return 0, 0

async def sync_similar_games(db: Session, game_id: int) -> tuple[int, int]:
    """
    Fetches and stores similar games for a given game
    
    Args:
        db: Database session
        game_id: Game ID to fetch similar games for
        
    Returns:
        Tuple of (number of new games added, number of games updated)
    """
    try:
        game = get_game_by_id(db, game_id)
        if not game or not game.similar_games:
            return 0, 0
            
        similar_ids = [similar["id"] for similar in game.similar_games if "id" in similar]
        if not similar_ids:
            return 0, 0

        ids_string = ",".join(str(id) for id in similar_ids)
        query = f"{IGDB_GAME_FIELDS} where id = ({ids_string}); limit {len(similar_ids)};"
        
        return await sync_games_from_igdb(db, query)
        
    except Exception as e:
        logger.error(f"Error syncing similar games for game {game_id}: {str(e)}")
        return 0, 0

def get_game_by_id(db: Session, game_id: int) -> game.Game | None:
    """Fetch a game from the database by ID"""
    return db.scalar(select(game.Game).where(game.Game.id == game_id))

def get_game_by_igdb_id(db: Session, igdb_id: int) -> game.Game | None:
    """Fetch a game from the database by IGDB ID"""
    return db.scalar(select(game.Game).where(game.Game.igdb_id == igdb_id))

def get_game_by_slug(db: Session, slug: str) -> game.Game | None:
    """Fetch a game from the database by slug"""
    return db.scalar(select(game.Game).where(game.Game.slug == slug))

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
    
    db.commit()
    db.refresh(db_game)
    return db_game

# Stale-While-Revalidate (SWR) Functions
def is_stale(db_game: game.Game, max_age_hours: int = 24) -> bool:
    """Check if a game's data is stale and needs refreshing.
    
    Args:
        db_game: The game object to check
        max_age_hours: Maximum age in hours before data is considered stale (default: 24)
    
    Returns:
        True if the game data is stale and should be refreshed
    """
    if not db_game or not db_game.updated_at:
        return True
    
    age = datetime.utcnow() - db_game.updated_at
    return age.total_seconds() > (max_age_hours * 3600)

async def refresh_game_async(igdb_id: int) -> bool:
    """Refresh a game's data from IGDB in the background.
    
    This is designed to be called as a background task via asyncio.create_task().
    It creates its own database session to avoid issues with the request session
    being closed before the task completes.
    
    Args:
        igdb_id: The IGDB ID of the game to refresh
        
    Returns:
        True if refresh was successful, False otherwise
    """
    # Import here to avoid circular imports
    from ...db_setup import SessionLocal
    
    db = SessionLocal()
    try:
        logger.info(f"[SWR] Background refresh starting for IGDB ID: {igdb_id}")
        
        # Fetch fresh data from IGDB
        igdb_data = fetch_from_igdb(game_id=igdb_id)
        if not igdb_data:
            logger.warning(f"[SWR] No data returned from IGDB for game {igdb_id}")
            return False
        
        # Handle list response (fetch_from_igdb returns dict for single game, but be safe)
        if isinstance(igdb_data, list):
            igdb_data = igdb_data[0] if igdb_data else None
        
        if not igdb_data:
            return False
        
        # Process the data
        processed_data = process_igdb_data(igdb_data)
        
        # Find and update the existing game
        existing_game = get_game_by_igdb_id(db, igdb_id)
        if existing_game:
            # Update existing games (they were already accepted)
            update_game(db, existing_game.id, processed_data)
            # Explicitly update the timestamp since onupdate only fires if row changes
            existing_game.updated_at = datetime.utcnow()
            db.commit()  # Explicit commit to ensure changes are saved
            logger.info(f"[SWR] Successfully refreshed: {processed_data.name} (IGDB: {igdb_id})")
        else:
            # Only create new games that meet quality requirements
            if meets_quality_requirements(processed_data):
                create_game(db, processed_data)
                db.commit()  # Explicit commit to ensure changes are saved
                logger.info(f"[SWR] Created new game: {processed_data.name} (IGDB: {igdb_id})")
            else:
                logger.info(f"[SWR] Skipped creating '{processed_data.name}': doesn't meet quality requirements")
                return False
        
        return True
        
    except Exception as e:
        db.rollback()  # Explicit rollback on error
        logger.error(f"[SWR] Error refreshing game {igdb_id}: {str(e)}")
        return False
    finally:
        db.close()




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

def string_similarity(a, b):
    """Calculate similarity ratio between two strings"""
    if not a or not b:
        return 0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def search_games_in_db(db: Session, query: str, limit: int = 6, category: str = "all") -> list[game.Game]:
    """
    Search for games in database matching the query.
    
    Parameters:
    - query: The search term
    - limit: Maximum number of results to return
    - category: Category to search in. Options: "all", "games", "developers", "platforms", "keywords"
    """
    from sqlalchemy import or_, case
    search_pattern = f"%{query}%"
    category = category.lower()
    
    # Build where clause based on category
    if category == "games":
        where_clause = or_(
            game.Game.name.ilike(search_pattern),
            game.Game.alternative_names.cast(String).ilike(search_pattern)
        )
    elif category == "developers":
        where_clause = game.Game.developers.ilike(search_pattern)
    elif category == "platforms":
        where_clause = game.Game.platforms.ilike(search_pattern)
    elif category == "keywords":
        where_clause = game.Game.keywords.cast(String).ilike(search_pattern)
    else:
        where_clause = or_(
            game.Game.name.ilike(search_pattern),
            game.Game.alternative_names.cast(String).ilike(search_pattern),
            game.Game.summary.ilike(search_pattern),
            game.Game.storyline.ilike(search_pattern),
            game.Game.genres.ilike(search_pattern),
            game.Game.themes.ilike(search_pattern),
            game.Game.developers.ilike(search_pattern),
            game.Game.keywords.cast(String).ilike(search_pattern)
        )
    
    # Exact matching
    exact_matches = list(db.scalars(
        select(game.Game)
        .where(where_clause)
        .order_by(
            # Prioritize name matches first, then other fields
            case(
                (game.Game.name.ilike(search_pattern), 0),
                else_=1
            ),
            game.Game.total_rating.desc().nulls_last()
        )
        .limit(limit)
    ))
    
    if len(exact_matches) >= limit or category != "all":
        return exact_matches
    
    # Fuzzy matching
    all_games = list(db.scalars(
        select(game.Game)
        .where(game.Game.total_rating.is_not(None))
        .order_by(game.Game.total_rating.desc())
        .limit(200)
    ))
    
    query_lower = query.lower()
    fuzzy_matches = []
    for g in all_games:
        if g in exact_matches:
            continue
            
        # If the query isn't in the name at all, use a lower threshold
        name_lower = (g.name or "").lower()
        if query_lower in name_lower:
            name_score = 0.9  # Give high score for substring matches
        else:
            # Only calculate full similarity if needed
            name_score = string_similarity(query, g.name or "") * 1.5  # Extra weight for name
        
        # Only check other fields if name score isn't high enough
        if name_score < 0.7:
            # Process other fields
            fields_to_check = [
                g.summary, 
                g.storyline, 
                g.genres, 
                g.themes, 
                g.developers
            ]
            
            if g.keywords and isinstance(g.keywords, list):
                keywords_text = ", ".join(g.keywords)
                fields_to_check.append(keywords_text)
            
            if g.alternative_names and isinstance(g.alternative_names, list):
                alt_names_text = ", ".join(g.alternative_names)
                fields_to_check.append(alt_names_text)
            
            # Get best score from all fields
            best_field_score = 0
            for field in fields_to_check:
                if field and query_lower in field.lower():
                    best_field_score = max(best_field_score, 0.75)  # Substring match in any field
            
            if best_field_score == 0 and name_score < 0.6:
                # Only do expensive similarity on promising candidates
                for field in fields_to_check:
                    if field:
                        score = string_similarity(query, field)
                        best_field_score = max(best_field_score, score)
            
            best_score = max(name_score, best_field_score)
        else:
            best_score = name_score
        
        # If score is good enough, add to fuzzy matches
        threshold = 0.6 if len(query) > 3 else 0.75  # Higher threshold for short queries
        if best_score > threshold:
            fuzzy_matches.append((g, best_score))
    
    # Sort fuzzy matches by score and take top results
    fuzzy_matches.sort(key=lambda x: x[1], reverse=True)
    remaining_slots = limit - len(exact_matches)
    additional_matches = [match[0] for match in fuzzy_matches[:remaining_slots]]
    
    # Return combined results
    return exact_matches + additional_matches

def get_games_by_genre(db: Session, genre_slug: str, limit: int = None):
    """Get games that match a specific genre slug"""
    from ..models.game import Game
    
    search_pattern = f"%{genre_slug}%"
    genre_name = " ".join(word.capitalize() for word in genre_slug.replace("-", " ").split())
    name_pattern = f"%{genre_name}%"
    
    query = db.query(Game).filter(
        (Game.genres.ilike(search_pattern) | Game.genres.ilike(name_pattern))
    ).order_by(Game.total_rating.desc().nulls_last())
    
    if limit:
        query = query.limit(limit)
        
    return query.all()

def get_genre_id_by_slug(genre_slug: str):
    """Map genre slug to IGDB genre ID"""
    genre_mapping = {
        "adventure": 31,
        "rpg": 12,
        "shooter": 5,
        "strategy": 15,
        "platform": 8,
        "puzzle": 9,
        "racing": 10,
        "fighting": 6,
        "indie": 32,
        "simulator": 13,
        "sport": 14,
        "arcade": 33,
        "card": 16,
        "visual-novel": 34,
        "moba": 36,
        "tactical": 24,
    }
    
    return genre_mapping.get(genre_slug)

def get_theme_id_by_slug(theme_slug: str):
    """Map theme slug to IGDB theme ID"""
    theme_mapping = {
        "action": 1,
        "fantasy": 17,
        "science-fiction": 18,
        "horror": 19,
        "thriller": 27,
        "survival": 21,
        "historical": 22,
        "stealth": 41,
        "comedy": 42,
        "business": 43,
        "drama": 31,
        "mystery": 20,
        "educational": 32,
        "kids": 33,
        "open-world": 38,
        "warfare": 39,
    }
    
    return theme_mapping.get(theme_slug)

def get_recent_games(db: Session, limit: int = None):
    """Get recent games ordered by release date"""
    from ..models.game import Game
    
    query = db.query(Game).order_by(Game.first_release_date.desc())
    
    if limit:
        query = query.limit(limit)
        
    return query.all()

def get_games_by_ids(db: Session, game_ids: list):
    """Get games by their IDs"""
    from ..models.game import Game
    
    return db.query(Game).filter(Game.id.in_(game_ids)).all()

def get_games_by_theme(db: Session, theme_slug: str, limit: int = None):
    """Get games that match a specific theme slug"""
    from ..models.game import Game
    
    search_pattern = f"%{theme_slug}%"
    theme_name = " ".join(word.capitalize() for word in theme_slug.replace("-", " ").split())
    name_pattern = f"%{theme_name}%"
    
    query = db.query(Game).filter(
        (Game.themes.ilike(search_pattern) | Game.themes.ilike(name_pattern))
    ).order_by(Game.total_rating.desc().nulls_last())
    
    if limit:
        query = query.limit(limit)
        
    return query.all()

def fetch_time_to_beat(game_id: int) -> dict | None:
    """Fetch time to beat data from IGDB for a specific game ID."""
    try:
        query = f"fields completely,count,game_id,hastily,normally; where game_id = {game_id};"
        data = fetch_from_igdb(query=query, endpoint="game_time_to_beats")
        
        if data and len(data) > 0:
            # Convert times from seconds to hours and minutes
            time_data = data[0]
            time_to_beat = {}
            
            if "hastily" in time_data and time_data["hastily"]:
                seconds = time_data["hastily"]
                hours = seconds // 3600
                minutes = (seconds % 3600) // 60
                time_to_beat["hastily"] = {
                    "seconds": seconds,
                    "hours": hours,
                    "minutes": minutes,
                    "formatted": f"{hours}h"
                }
                
            if "normally" in time_data and time_data["normally"]:
                seconds = time_data["normally"]
                hours = seconds // 3600
                minutes = (seconds % 3600) // 60
                time_to_beat["normally"] = {
                    "seconds": seconds,
                    "hours": hours,
                    "minutes": minutes,
                    "formatted": f"{hours}h"
                }
                
            if "completely" in time_data and time_data["completely"]:
                seconds = time_data["completely"]
                hours = seconds // 3600
                minutes = (seconds % 3600) // 60
                time_to_beat["completely"] = {
                    "seconds": seconds,
                    "hours": hours,
                    "minutes": minutes,
                    "formatted": f"{hours}h"
                }
                
            if "count" in time_data:
                time_to_beat["count"] = time_data["count"]
                
            return time_to_beat
        return None
    except Exception as e:
        logger.error(f"Error fetching time to beat data: {str(e)}")
        return None

def mark_game_as_deleted(db: Session, igdb_id: int) -> game.Game | None:
    """Mark a game as deleted in the database"""
    db_game = get_game_by_igdb_id(db, igdb_id)
    if not db_game:
        return None
    
    db_game.is_deleted = True
    db.commit()
    db.refresh(db_game)
    return db_game

async def fetch_related_game_types(db: Session, game_id: int):
    """
    Fetch games that are episodes, seasons, or packs of the given game.
    This runs asynchronously to avoid blocking the main request.
    """
    try:
        # Get the game from DB
        db_game = get_game_by_id(db, game_id)
        if not db_game:
            logger.error(f"Game with ID {game_id} not found when fetching related game types")
            return
            
        game_types = {
            6: "episodes",
            7: "seasons",
            13: "packs"
        }
        
        # Fetch each type of related game
        for type_id, field_name in game_types.items():
            query = f"""
                fields name, cover.image_id, slug;
                where parent_game = {db_game.igdb_id} & game_type = {type_id};
                limit 50;
            """
            
            try:
                # Fetch from IGDB
                related_games = fetch_from_igdb(query=query)
                
                if related_games and len(related_games) > 0:
                    # Process the results
                    related_data = []
                    for game in related_games:
                        if game.get('name'):
                            game_data = {
                                "id": game.get('id'),
                                "name": game.get('name'),
                                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{game['cover']['image_id']}.jpg" 
                                if game.get('cover', {}).get('image_id') else None,
                                "slug": game.get('slug')
                            }
                            related_data.append(game_data)
                    
                    # Update the game in DB with these related games
                    if related_data:
                        setattr(db_game, field_name, related_data)
                        db.commit()
                        logger.info(f"Updated {len(related_data)} {field_name} for game {db_game.name}")
            
            except Exception as e:
                logger.error(f"Error fetching {field_name} for game {db_game.name}: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error in fetch_related_game_types: {str(e)}")

async def fetch_game_editions_and_bundles(db: Session, game_id: int):
    """
    Fetch different editions of a game and bundles that include this game.
    This runs asynchronously to avoid blocking the main request.
    """
    try:
        # Get the game from DB
        db_game = get_game_by_id(db, game_id)
        if not db_game:
            logger.error(f"Game with ID {game_id} not found when fetching game editions and bundles")
            return
        
        # First fetch editions
        try:
            # If game has version_parent, it is an edition itself
            if getattr(db_game, 'version_title', None):
                logger.info(f"Game {db_game.name} is an edition with title: {db_game.version_title}")
            
            # Find editions where this game is the version_parent
            editions_query = f"""
                fields name, cover.image_id, slug, version_title, game_type;
                where version_parent = {db_game.igdb_id};
                limit 50;
            """
            
            editions = fetch_from_igdb(query=editions_query)
            
            if editions and len(editions) > 0:
                # Process the results
                editions_data = []
                for game in editions:
                    if game.get('name'):
                        edition_data = {
                            "id": game.get('id'),
                            "name": game.get('name'),
                            "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{game['cover']['image_id']}.jpg" 
                            if game.get('cover', {}).get('image_id') else None,
                            "slug": game.get('slug'),
                            "edition_title": game.get('version_title', "Edition")
                        }
                        editions_data.append(edition_data)
                
                # Update the game in DB with editions data
                if editions_data:
                    db_game.editions = editions_data
                    db.commit()
                    logger.info(f"Updated {len(editions_data)} editions for game {db_game.name}")
        
        except Exception as e:
            logger.error(f"Error fetching editions for game {db_game.name}: {str(e)}")
        
        # Second, fetch bundles that include this game
        try:
            # Query bundles that include this game
            bundles_query = f"""
                fields name, cover.image_id, slug, games.name, games.cover.image_id;
                where games = [{db_game.igdb_id}] & id != {db_game.igdb_id};
                limit 50;
            """
            
            bundles = fetch_from_igdb(query=bundles_query)
            
            if bundles and len(bundles) > 0:
                # Process the results
                bundles_data = []
                for bundle in bundles:
                    if bundle.get('name'):
                        bundle_data = {
                            "id": bundle.get('id'),
                            "name": bundle.get('name'),
                            "cover_image": f"https://images.igdb.com/igdb/image/upload/t_1080p/{bundle['cover']['image_id']}.jpg" 
                            if bundle.get('cover', {}).get('image_id') else None,
                            "slug": bundle.get('slug')
                        }
                        bundles_data.append(bundle_data)
                
                # Update the game in DB with bundles data
                if bundles_data:
                    db_game.in_bundles = bundles_data
                    db.commit()
                    logger.info(f"Updated {len(bundles_data)} bundles containing {db_game.name}")
        
        except Exception as e:
            logger.error(f"Error fetching bundles for game {db_game.name}: {str(e)}")
                
    except Exception as e:
        logger.error(f"Error in fetch_game_editions_and_bundles: {str(e)}")
