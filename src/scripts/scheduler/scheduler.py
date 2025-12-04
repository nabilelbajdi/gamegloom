# scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from backend.app.api.db_setup import SessionLocal
from backend.app.api.v1.core import services
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def update_all_games():
    """Update all stored games in the database periodically."""
    try:
        logger.info("Starting full game database update task")
        
        db = SessionLocal()
        try:
            # Import the Game model from the models directory
            from backend.app.api.v1.models.game import Game
            
            # Define how old a game can be before needing an update
            update_threshold = datetime.now() - timedelta(days=7)

            # Get all games that haven't been updated in 7+ days
            outdated_games = db.query(Game).filter(
                Game.updated_at < update_threshold
            ).limit(200).all()

            if not outdated_games:
                logger.info("No outdated games found for update.")
                return

            # Fetch IGDB updates for these games
            game_ids = [str(game.igdb_id) for game in outdated_games]

            query = f"""
                fields name, summary, storyline, first_release_date, 
                       genres.name, platforms.name, cover.image_id, 
                       screenshots.image_id, videos.video_id, rating, 
                       aggregated_rating, total_rating, total_rating_count, hypes,
                       similar_games.name, similar_games.cover.image_id, similar_games.rating,
                       similar_games.total_rating, similar_games.genres.name,
                       involved_companies.company.name, involved_companies.developer, game_modes.name, 
                       player_perspectives.name, themes.name;
                where id = ({",".join(game_ids)}) & cover != null;
            """

            new_count, update_count = await services.sync_games_from_igdb(db, query)
            logger.info(f"Game database update completed: {new_count} new games, {update_count} updated games")
        finally:
            db.close()

    except Exception as e:
        logger.error(f"Error in update_all_games task: {str(e)}")

def init_scheduler():
    """Initialize the scheduler with all tasks."""
    try:
        # Update all stored games every 12 hours
        scheduler.add_job(
            update_all_games,
            CronTrigger(hour="*/12"),
            id="update_all_games",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("Scheduler initialized successfully")

    except Exception as e:
        logger.error(f"Error initializing scheduler: {str(e)}")
        raise
