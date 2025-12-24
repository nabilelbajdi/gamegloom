# igdb_service.py
"""IGDB API integration and data processing functions."""

from datetime import datetime
import requests
import logging

from . import schemas
from ...settings import settings

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

# Game types to exclude (these aren't full games)
EXCLUDED_GAME_TYPES = {
    5: "Mod",
    13: "Pack", 
    14: "Update"
}

# Game status mapping
GAME_STATUS_MAPPING = {
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
GAME_TYPE_MAPPING = {
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


def fetch_time_to_beat(game_id: int) -> dict | None:
    """Fetch time to beat data from IGDB for a specific game ID."""
    try:
        query = f"fields completely,count,game_id,hastily,normally; where game_id = {game_id};"
        data = fetch_from_igdb(query=query, endpoint="game_time_to_beats")
        
        if data and len(data) > 0:
            time_data = data[0]
            time_to_beat = {}
            
            for key in ["hastily", "normally", "completely"]:
                if key in time_data and time_data[key]:
                    seconds = time_data[key]
                    hours = seconds // 3600
                    minutes = (seconds % 3600) // 60
                    time_to_beat[key] = {
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


def meets_quality_requirements(game_data: schemas.GameCreate, log_warnings: bool = True) -> bool:
    """Check if a game meets minimum quality requirements for storage.
    
    Requirements:
    1. Must have a cover image
    2. Must have a summary or storyline
    3. Must not be a Mod, Pack, or Update
    """
    if game_data.game_type_id in EXCLUDED_GAME_TYPES:
        if log_warnings:
            logger.info(f"[Quality] Skipping '{game_data.name}': is a {EXCLUDED_GAME_TYPES[game_data.game_type_id]}")
        return False
    
    if not game_data.cover_image:
        if log_warnings:
            logger.info(f"[Quality] Skipping '{game_data.name}': no cover image")
        return False
    
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
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{similar_data['cover']['image_id']}.jpg"
                if similar_data.get("cover") else None,
                "rating": similar_data.get("total_rating", similar_data.get("rating")),
                "genres": ", ".join(g['name'] for g in similar_data.get('genres', []))
            })
    return similar_games


def _process_related_items(items: list, item_type: str = "generic") -> list:
    """Helper function to process related game items (DLCs, expansions, etc.)"""
    processed = []
    for item in items:
        if item.get('name'):
            item_data = {
                "id": item.get('id'),
                "name": item.get('name'),
                "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{item['cover']['image_id']}.jpg" 
                if item.get('cover', {}).get('image_id') else None
            }
            if item_type == "edition":
                item_data["edition_title"] = item.get('version_title', "Edition")
            if item.get('slug'):
                item_data["slug"] = item.get('slug')
            processed.append(item_data)
    return processed


def process_igdb_data(igdb_data: dict) -> schemas.GameCreate:
    """Process IGDB data into our schema format"""
    release_date = datetime.fromtimestamp(igdb_data.get('first_release_date', 0)) if igdb_data.get('first_release_date') else None
    
    cover_image = None
    if igdb_data.get('cover', {}).get('image_id'):
        cover_image = f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{igdb_data['cover']['image_id']}.jpg"
    
    screenshots = [
        f"https://images.igdb.com/igdb/image/upload/t_screenshot_huge_2x/{s['image_id']}.jpg"
        for s in igdb_data.get('screenshots', [])
    ]
    
    artworks = [
        f"https://images.igdb.com/igdb/image/upload/t_1080p_2x/{a['image_id']}.jpg"
        for a in igdb_data.get('artworks', [])
    ]

    similar_games = process_similar_games(igdb_data.get('similar_games', []))
    
    # Process related content using helper
    dlcs = _process_related_items(igdb_data.get('dlcs', []))
    expansions = _process_related_items(igdb_data.get('expansions', []))
    remakes = _process_related_items(igdb_data.get('remakes', []))
    remasters = _process_related_items(igdb_data.get('remasters', []))
    bundles = _process_related_items(igdb_data.get('bundles', []))
    ports = _process_related_items(igdb_data.get('ports', []))
    standalone_expansions = _process_related_items(igdb_data.get('standalone_expansions', []))
    
    # Process parent game
    parent_game = None
    if igdb_data.get('parent_game', {}).get('name'):
        parent_game = {
            "id": igdb_data['parent_game'].get('id'),
            "name": igdb_data['parent_game'].get('name'),
            "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{igdb_data['parent_game']['cover']['image_id']}.jpg" 
            if igdb_data['parent_game'].get('cover', {}).get('image_id') else None
        }
    
    # Process version parent
    version_parent = None
    if igdb_data.get('version_parent', {}).get('name'):
        version_parent = {
            "id": igdb_data['version_parent'].get('id'),
            "name": igdb_data['version_parent'].get('name'),
            "cover_image": f"https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{igdb_data['version_parent']['cover']['image_id']}.jpg" 
            if igdb_data['version_parent'].get('cover', {}).get('image_id') else None
        }
    
    version_title = igdb_data.get('version_title')
    
    # Process franchise and franchises
    franchise = igdb_data.get('franchise', {}).get('name') if igdb_data.get('franchise') else None
    franchises = [f['name'] for f in igdb_data.get('franchises', []) if f.get('name')]
    
    # Process collections, alternative names, keywords
    collections = [c['name'] for c in igdb_data.get('collections', []) if c.get('name')]
    alternative_names = [a['name'] for a in igdb_data.get('alternative_names', []) if a.get('name')]
    keywords = [k['name'] for k in igdb_data.get('keywords', []) if k.get('name')]

    # Process age ratings
    age_ratings = []
    for rating in igdb_data.get('age_ratings', []):
        if rating.get('category') is not None and rating.get('rating') is not None:
            age_ratings.append({
                "category": rating['category'],
                "rating": rating['rating']
            })

    # Process game engines
    game_engines = [engine['name'] for engine in igdb_data.get('game_engines', []) if engine.get('name')]

    # Process publishers
    publishers = ", ".join(c['company']['name'] for c in igdb_data.get('involved_companies', []) 
                           if c.get('publisher') and c.get('company', {}).get('name'))

    # Process multiplayer modes
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

    # Process language supports
    language_supports = []
    for lang in igdb_data.get('language_supports', []):
        if lang.get('language', {}).get('name'):
            language_supports.append({
                "name": lang['language']['name'],
                "native_name": lang['language'].get('native_name')
            })
    
    # Get game status and type info
    game_status_id = igdb_data.get('game_status')
    game_status_name = GAME_STATUS_MAPPING.get(game_status_id) if game_status_id is not None else None
    
    game_type_id = igdb_data.get('game_type')
    game_type_name = GAME_TYPE_MAPPING.get(game_type_id) if game_type_id is not None else None

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
        publishers=publishers,
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
        episodes=[],
        seasons=[],
        packs=[],
        editions=[],
        in_bundles=[],
        version_parent=version_parent,
        version_title=version_title,
        slug=igdb_data.get('slug'),
        game_status_id=game_status_id,
        game_status_name=game_status_name,
        game_type_id=game_type_id,
        game_type_name=game_type_name,
        age_ratings=age_ratings,
        game_engines=game_engines,
        multiplayer_modes=multiplayer_modes,
        language_supports=language_supports,
        franchise=franchise,
        franchises=franchises,
        collections=collections,
        alternative_names=alternative_names,
        keywords=keywords,
        raw_data=igdb_data
    )
