# scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from .db_setup import SessionLocal
from .v1.core import services
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def update_latest_games():
    """Update latest games in the database"""
    try:
        logger.info("Starting latest games update task")
        db = SessionLocal()
        
        try:
            current_timestamp = int(datetime.now().timestamp())
            one_month_ago = int((datetime.now() - timedelta(days=30)).timestamp())
            
            query = f"""
                fields name, summary, storyline, first_release_date, 
                       genres.name, platforms.name, cover.image_id, 
                       screenshots.image_id, videos.video_id, rating, 
                       aggregated_rating, total_rating, total_rating_count, hypes,
                       similar_games.name, similar_games.cover.image_id, similar_games.rating,
                       similar_games.total_rating, similar_games.genres.name,
                       involved_companies.company.name, involved_companies.developer, game_modes.name, 
                       player_perspectives.name, themes.name;
                where first_release_date >= {one_month_ago}
                & first_release_date <= {current_timestamp}
                & first_release_date != null
                & cover != null;
                sort first_release_date desc;
                limit 50;
            """
            
            new_count, update_count = await services.sync_games_from_igdb(db, query)
            logger.info(f"Latest games update completed: {new_count} new games, {update_count} updated games")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error in update_latest_games task: {str(e)}")

async def update_trending_games():
    """Update trending games in the database"""
    try:
        logger.info("Starting trending games update task")
        db = SessionLocal()
        
        try:
            # Get games with high Steam 24hr peak players
            steam_query = """
                fields game_id, value;
                where popularity_type = 5;
                sort value desc;
                limit 50;
            """
            steam_data = services.fetch_from_igdb(query=steam_query, endpoint="popularity_primitives")
            
            if not steam_data:
                logger.warning("No trending games data received from IGDB")
                return
                
            game_ids = [str(item['game_id']) for item in steam_data]
            
            # Fetch full game details
            games_query = f"""
                fields name, summary, storyline, first_release_date, 
                       genres.name, platforms.name, cover.image_id, 
                       screenshots.image_id, videos.video_id, rating, 
                       aggregated_rating, total_rating, total_rating_count, hypes,
                       similar_games.name, similar_games.cover.image_id, similar_games.rating,
                       similar_games.total_rating, similar_games.genres.name,
                       involved_companies.company.name, involved_companies.developer, game_modes.name, 
                       player_perspectives.name, themes.name;
                where id = ({','.join(game_ids)}) & cover != null;
            """
            
            new_count, update_count = await services.sync_games_from_igdb(db, games_query)
            logger.info(f"Trending games update completed: {new_count} new games, {update_count} updated games")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error in update_trending_games task: {str(e)}")

def init_scheduler():
    """Initialize the scheduler with all tasks"""
    try:
        # Update latest games every 6 hours
        scheduler.add_job(
            update_latest_games,
            CronTrigger(hour="*/6"),
            id="update_latest_games",
            replace_existing=True
        )
        
        # Update trending games every 3 hours
        scheduler.add_job(
            update_trending_games,
            CronTrigger(hour="*/3"),
            id="update_trending_games",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("Scheduler initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing scheduler: {str(e)}")
        raise 