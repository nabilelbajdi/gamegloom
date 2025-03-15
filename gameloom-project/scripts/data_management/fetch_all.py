#!/usr/bin/env python
"""
Fetch games from IGDB and populate the database.
This script handles pagination and rate limiting while maintaining complete game data.
Features include parallelization, memory management, and progress tracking.
"""
import os
import sys
import time
import json
import logging
import requests
import concurrent.futures
from datetime import datetime
from contextlib import contextmanager

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("igdb_fetch.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Add the project root to the Python path
sys.path.append(os.path.abspath('.'))

# Import the necessary modules from the backend
try:
    from backend.app.api.settings import settings
    from backend.app.api.db_setup import init_db, get_db
    from backend.app.api.v1.core.services import process_igdb_data, create_game, get_game_by_igdb_id, update_game
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    sys.exit(1)

# Configuration
IGDB_API_URL = "https://api.igdb.com/v4/games"
BATCH_SIZE = 500  # Number of games to fetch in each API call (max allowed by IGDB)
RATE_LIMIT_WAIT = 0.5  # Seconds to wait between API calls
COMMIT_EVERY = 100  # Commit to database after this many games
MAX_WORKERS = 3  # Number of parallel workers (keep low to avoid rate limiting)
PROGRESS_FILE = os.path.join(os.path.dirname(__file__), "fetch_progress.json")  # File to store progress

# Define required fields for quality filtering - just the essentials as requested
REQUIRED_FIELDS = {"name", "slug", "summary", "cover", "involved_companies"}

# IGDB fields to fetch - keeping all original fields
IGDB_GAME_FIELDS = """
    fields id, name, summary, storyline, first_release_date, 
           genres.name, platforms.name, cover.image_id, 
           screenshots.image_id, videos.video_id, rating, 
           aggregated_rating, aggregated_rating_count, total_rating, total_rating_count, hypes,
           similar_games.name, similar_games.cover.image_id, similar_games.rating,
           similar_games.total_rating, similar_games.genres.name,
           involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
           game_modes.name, player_perspectives.name, themes.name, artworks.image_id,
           dlcs.name, dlcs.cover.image_id, 
           expansions.name, expansions.cover.image_id,
           remakes.name, remakes.cover.image_id,
           remasters.name, remasters.cover.image_id,
           parent_game.name, parent_game.cover.image_id,
           bundles.name, bundles.cover.image_id,
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

def load_progress():
    """
    Load progress from the progress file
    
    Returns:
        Dictionary with progress information or None if file doesn't exist
    """
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r') as f:
                progress = json.load(f)
                logger.info(f"Loaded progress: offset={progress['offset']}, stored={progress['total_stored']}, "
                          f"updated={progress['total_updated']}, filtered={progress['total_filtered']}")
                return progress
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Error loading progress file: {e}")
    
    return None

def save_progress(offset, total_stored, total_updated, total_filtered):
    """
    Save progress to the progress file
    
    Args:
        offset: Current offset
        total_stored: Total games stored
        total_updated: Total games updated
        total_filtered: Total games filtered
    """
    progress = {
        "offset": offset,
        "total_stored": total_stored,
        "total_updated": total_updated,
        "total_filtered": total_filtered,
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        with open(PROGRESS_FILE, 'w') as f:
            json.dump(progress, f)
    except Exception as e:
        logger.error(f"Error saving progress: {e}")

@contextmanager
def get_db_session():
    """
    Context manager for database sessions to ensure proper cleanup
    """
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

def fetch_games_batch(offset=0, limit=BATCH_SIZE, max_retries=3):
    """
    Fetch a batch of games from IGDB API with retry logic
    
    Args:
        offset: Offset for pagination
        limit: Number of games to fetch
        max_retries: Maximum number of retries if request fails
        
    Returns:
        List of game data from IGDB or None if failed after retries
    """
    for retry in range(max_retries):
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
            "Accept": "application/json",
        }
        
        # Build query with pagination
        query = f"""
            {IGDB_GAME_FIELDS}
            where name != null;
            sort id asc;
            limit {limit};
            offset {offset};
        """
        
        try:
            response = requests.post(IGDB_API_URL, headers=headers, data=query)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed at offset {offset}: {e}")
            
            # Handle rate limiting
            if hasattr(e, 'response') and e.response and e.response.status_code == 429:
                retry_after = int(e.response.headers.get('Retry-After', 5))
                logger.info(f"Rate limited. Waiting for {retry_after} seconds...")
                time.sleep(retry_after)
                continue
            
            # Exponential backoff for other errors
            wait_time = (2 ** retry) * RATE_LIMIT_WAIT
            if retry < max_retries - 1:
                logger.info(f"Retrying in {wait_time} seconds... (Attempt {retry + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
                
    logger.error(f"Failed to fetch games after {max_retries} retries at offset {offset}")
    return None

def meets_quality_standards(game_data):
    """
    Check if a game meets the quality standards - using the simplified criteria
    
    Args:
        game_data: Game data from IGDB
        
    Returns:
        Boolean indicating whether the game meets quality standards
    """
    for field in REQUIRED_FIELDS:
        if field not in game_data:
            return False
            
        # Check for empty values
        if field == "involved_companies":
            if not isinstance(game_data[field], list) or len(game_data[field]) == 0:
                return False
        elif field == "cover":
            if not isinstance(game_data[field], dict) or "image_id" not in game_data[field]:
                return False
        elif not game_data[field]:
            return False
            
    return True

def process_game(game_data, db_session):
    """
    Process a single game and store/update in the database
    
    Args:
        game_data: Game data from IGDB
        db_session: Database session
        
    Returns:
        Tuple of (stored, updated, filtered) counts
    """
    stored = 0
    updated = 0
    filtered = 0
    
    try:
        # Skip games that don't meet quality standards
        if not meets_quality_standards(game_data):
            return 0, 0, 1
            
        # Process the game data
        processed_data = process_igdb_data(game_data)
        
        # Check if game already exists
        existing_game = get_game_by_igdb_id(db_session, game_data['id'])
        
        if existing_game:
            # Update existing game
            update_game(db_session, existing_game.id, processed_data)
            updated = 1
        else:
            # Create new game
            create_game(db_session, processed_data)
            stored = 1
            
        db_session.commit()
        return stored, updated, 0
        
    except Exception as e:
        logger.error(f"Error processing game {game_data.get('id', 'unknown')}: {e}")
        db_session.rollback()
        return 0, 0, 1

def process_batch_with_memory_management(batch, db):
    """
    Process a batch of games with memory management
    
    Args:
        batch: List of games to process
        db: Database session
        
    Returns:
        Tuple of (stored, updated, filtered) counts
    """
    total_stored = 0
    total_updated = 0
    total_filtered = 0
    
    # Process in smaller chunks to manage memory
    chunk_size = 50
    for i in range(0, len(batch), chunk_size):
        chunk = batch[i:i+chunk_size]
        
        for game in chunk:
            stored, updated, filtered = process_game(game, db)
            total_stored += stored
            total_updated += updated
            total_filtered += filtered
            
        # Force garbage collection to free memory
        chunk.clear()
    
    return total_stored, total_updated, total_filtered

def parallel_fetch_and_process_chunk(offset_range):
    """
    Fetch and process a chunk of games in parallel
    
    Args:
        offset_range: Tuple containing (start_offset, end_offset)
        
    Returns:
        Dictionary with results
    """
    start_offset, end_offset = offset_range
    current_offset = start_offset
    chunk_results = {
        "fetched": 0,
        "stored": 0,
        "updated": 0,
        "filtered": 0
    }
    
    logger.info(f"Worker processing range: {start_offset} to {end_offset}")
    
    try:
        with get_db_session() as db:
            while current_offset < end_offset:
                # Calculate limit for this fetch (don't exceed end_offset)
                limit = min(BATCH_SIZE, end_offset - current_offset)
                games_data = fetch_games_batch(offset=current_offset, limit=limit)
                
                if not games_data:
                    current_offset += limit
                    continue
                
                if len(games_data) == 0:
                    break
                
                stored, updated, filtered = process_batch_with_memory_management(games_data, db)
                
                chunk_results["fetched"] += len(games_data)
                chunk_results["stored"] += stored
                chunk_results["updated"] += updated
                chunk_results["filtered"] += filtered
                
                logger.info(f"Offset {current_offset}: fetched {len(games_data)}, "
                          f"stored {stored}, updated {updated}, filtered {filtered}")
                
                current_offset += len(games_data)
                
                # Add a delay to avoid rate limiting
                time.sleep(RATE_LIMIT_WAIT)
    except Exception as e:
        logger.error(f"Error in worker processing range {start_offset}-{end_offset}: {e}")
    
    return chunk_results

def fetch_all_games():
    """
    Main function to fetch all games from IGDB and store them in the database
    """
    logger.info("Starting IGDB game fetcher")
    
    try:
        # Initialize the database
        logger.info("Initializing database connection")
        init_db()
        
        # Load progress if available
        progress = load_progress()
        if progress:
            offset = progress["offset"]
            total_stored = progress["total_stored"]
            total_updated = progress["total_updated"]
            total_filtered = progress["total_filtered"]
            logger.info(f"Resuming from offset {offset}")
        else:
            offset = 0
            total_stored = 0
            total_updated = 0
            total_filtered = 0
        
        total_fetched = 0
        empty_response_count = 0
        
        try:
            # First, do a test fetch to estimate total games
            sample_batch = fetch_games_batch(offset=offset, limit=1)
            if not sample_batch:
                logger.error("Initial test fetch failed, exiting")
                return
            
            # Create chunks for parallel processing
            # Each worker will handle a range of offsets
            chunk_size = 5000  # Each worker will handle this many games
            chunks = []
            
            # We'll create MAX_WORKERS chunks ahead of the current offset
            for i in range(MAX_WORKERS):
                chunk_start = offset + (i * chunk_size)
                chunk_end = chunk_start + chunk_size
                chunks.append((chunk_start, chunk_end))
            
            # Create a ThreadPoolExecutor for parallel processing
            with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                while True:
                    # Submit all chunks to the executor
                    future_to_chunk = {executor.submit(parallel_fetch_and_process_chunk, chunk): chunk for chunk in chunks}
                    
                    # Process results as they complete
                    all_empty = True
                    for future in concurrent.futures.as_completed(future_to_chunk):
                        chunk = future_to_chunk[future]
                        try:
                            result = future.result()
                            
                            if result["fetched"] > 0:
                                all_empty = False
                            
                            total_fetched += result["fetched"]
                            total_stored += result["stored"]
                            total_updated += result["updated"]
                            total_filtered += result["filtered"]
                            
                            logger.info(f"Chunk {chunk} completed: fetched {result['fetched']}, "
                                      f"stored {result['stored']}, updated {result['updated']}, "
                                      f"filtered {result['filtered']}")
                            
                            # Save progress periodically
                            new_offset = max(offset, chunk[1])
                            save_progress(new_offset, total_stored, total_updated, total_filtered)
                            
                        except Exception as e:
                            logger.error(f"Error processing chunk {chunk}: {e}")
                    
                    # If all chunks returned empty results, we might be at the end
                    if all_empty:
                        empty_response_count += 1
                        if empty_response_count >= 2:
                            logger.info("Multiple chunks returned no results. Assuming we've reached the end.")
                            break
                    else:
                        empty_response_count = 0
                    
                    # Update offset and create new chunks for the next iteration
                    offset = max([chunk[1] for chunk in chunks])
                    chunks = []
                    for i in range(MAX_WORKERS):
                        chunk_start = offset + (i * chunk_size)
                        chunk_end = chunk_start + chunk_size
                        chunks.append((chunk_start, chunk_end))
            
            # Print summary
            logger.info("=" * 50)
            logger.info("SUMMARY")
            logger.info("=" * 50)
            logger.info(f"Total games fetched:  {total_fetched}")
            logger.info(f"Total games stored:   {total_stored}")
            logger.info(f"Total games updated:  {total_updated}")
            logger.info(f"Total games filtered: {total_filtered}")
            logger.info("=" * 50)
            
            # Final save of progress
            save_progress(offset, total_stored, total_updated, total_filtered)
            
        except KeyboardInterrupt:
            logger.info("Process interrupted by user")
            save_progress(offset, total_stored, total_updated, total_filtered)
            logger.info("Progress saved. You can resume later.")
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_all_games()