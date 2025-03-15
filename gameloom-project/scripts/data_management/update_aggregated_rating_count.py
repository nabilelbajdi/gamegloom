#!/usr/bin/env python
"""
Update aggregated_rating_count for existing games in the database.
This script fetches games from IGDB that already exist in our database
and updates them with the latest aggregated_rating_count data.
"""
import os
import sys
import time
import logging
import requests
from sqlalchemy import text
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("update_aggregated_rating_count.log"),
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
    from backend.app.api.v1.core.services import process_igdb_data, update_game, get_game_by_id
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    sys.exit(1)

# Configuration
IGDB_API_URL = "https://api.igdb.com/v4/games"
BATCH_SIZE = 10  # Process in smaller batches to avoid rate limits
RATE_LIMIT_WAIT = 1  # Seconds to wait between API calls

# IGDB fields - focusing on rating-related fields
IGDB_GAME_FIELDS = """
    fields id, name, aggregated_rating, aggregated_rating_count, total_rating, total_rating_count;
"""

def fetch_games_from_igdb(game_ids, max_retries=3):
    """
    Fetch specific games from IGDB by their IDs
    
    Args:
        game_ids: List of IGDB game IDs to fetch
        max_retries: Maximum number of retries if request fails
        
    Returns:
        Dictionary of games with IGDB ID as key
    """
    if not game_ids:
        return {}
        
    # Convert list of IDs to string format for IGDB query
    ids_string = ", ".join(str(id) for id in game_ids)
    
    for retry in range(max_retries):
        headers = {
            "Client-ID": settings.IGDB_CLIENT_ID,
            "Authorization": f"Bearer {settings.IGDB_ACCESS_TOKEN}",
            "Accept": "application/json",
        }
        
        # Build query to fetch specific games
        query = f"""
            {IGDB_GAME_FIELDS}
            where id = ({ids_string});
        """
        
        try:
            response = requests.post(IGDB_API_URL, headers=headers, data=query)
            response.raise_for_status()
            
            # Convert list to dictionary with ID as key for easier lookup
            games_dict = {game['id']: game for game in response.json()}
            return games_dict
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            
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
                
    logger.error(f"Failed to fetch games after {max_retries} retries")
    return {}

def update_game_ratings(db_session, db_game, igdb_data):
    """
    Update a game's rating data from IGDB
    
    Args:
        db_session: Database session
        db_game: Database game object
        igdb_data: IGDB game data
        
    Returns:
        Boolean indicating whether the game was updated
    """
    try:
        # Check if the IGDB data has the fields we need
        if 'aggregated_rating_count' not in igdb_data:
            return False
            
        # Update the rating fields
        db_game.aggregated_rating = igdb_data.get('aggregated_rating')
        db_game.aggregated_rating_count = igdb_data.get('aggregated_rating_count')
        db_game.total_rating = igdb_data.get('total_rating')
        db_game.total_rating_count = igdb_data.get('total_rating_count')
        db_game.updated_at = datetime.utcnow()
        
        db_session.commit()
        return True
        
    except Exception as e:
        logger.error(f"Error updating game {db_game.id}: {e}")
        db_session.rollback()
        return False

def update_games_with_missing_aggregated_rating_count():
    """
    Main function to update games that have aggregated_rating but missing aggregated_rating_count
    """
    logger.info("Starting update for games with missing aggregated_rating_count")
    
    try:
        # Initialize database
        logger.info("Initializing database connection")
        init_db()
        
        with next(get_db()) as db:
            # Get games with aggregated_rating but without aggregated_rating_count
            query = """
                SELECT id, igdb_id 
                FROM games 
                WHERE aggregated_rating IS NOT NULL 
                AND (aggregated_rating_count IS NULL OR aggregated_rating_count = 0)
            """
            games_to_update = db.execute(text(query)).fetchall()
            
            total_games = len(games_to_update)
            logger.info(f"Found {total_games} games to update")
            
            updated_count = 0
            
            # Process in batches to avoid rate limiting
            for i in range(0, total_games, BATCH_SIZE):
                batch = games_to_update[i:i+BATCH_SIZE]
                igdb_ids = [game[1] for game in batch]  # igdb_id is at index 1
                
                logger.info(f"Fetching batch {i//BATCH_SIZE + 1}/{(total_games + BATCH_SIZE - 1)//BATCH_SIZE} from IGDB (IDs: {igdb_ids})")
                
                # Fetch data from IGDB
                igdb_games = fetch_games_from_igdb(igdb_ids)
                
                if not igdb_games:
                    logger.warning(f"No data returned from IGDB for batch {i//BATCH_SIZE + 1}")
                    continue
                
                # Update each game in the database
                for db_id, igdb_id in batch:
                    if igdb_id in igdb_games:
                        db_game = get_game_by_id(db, db_id)
                        if db_game:
                            if update_game_ratings(db, db_game, igdb_games[igdb_id]):
                                updated_count += 1
                                logger.info(f"Updated game: {db_game.name} (ID: {db_game.id}, IGDB ID: {db_game.igdb_id})")
                    else:
                        logger.warning(f"Game with IGDB ID {igdb_id} not found in IGDB response")
                
                # Avoid rate limiting
                if i + BATCH_SIZE < total_games:
                    logger.info(f"Waiting {RATE_LIMIT_WAIT} seconds before next batch...")
                    time.sleep(RATE_LIMIT_WAIT)
            
            logger.info("=" * 50)
            logger.info(f"Update complete. Updated {updated_count} out of {total_games} games.")
            logger.info("=" * 50)
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_games_with_missing_aggregated_rating_count() 