# scheduler.py
# Focused scheduler that only updates featured/homepage games
# Individual game pages use SWR pattern for on-demand refresh
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from backend.app.api.db_setup import SessionLocal
from backend.app.api.v1.core import services
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def update_featured_games():
    """Update only featured/homepage games.
    
    This is a focused update that keeps homepage content fresh:
    - Trending games (recent releases with high hype)
    - Anticipated games (upcoming releases)
    - Highly rated games (top rated of all time)
    - Latest releases (past 30 days)
    
    Individual game pages use SWR pattern for on-demand refresh.
    """
    try:
        logger.info("[Scheduler] Starting featured games update")
        
        db = SessionLocal()
        try:
            current_time = int(datetime.now().timestamp())
            six_months_ago = int((datetime.now() - timedelta(days=180)).timestamp())
            one_year_future = current_time + (365 * 24 * 60 * 60)
            three_months_ago = int((datetime.now() - timedelta(days=90)).timestamp())
            
            # Update trending games
            trending_query = f"""
                {services.IGDB_GAME_FIELDS}
                where first_release_date >= {six_months_ago} 
                    & first_release_date <= {current_time} 
                    & hypes > 0 & cover != null;
                sort hypes desc;
                limit 50;
            """
            trending_new, trending_updated = await services.sync_games_from_igdb(db, trending_query)
            logger.info(f"[Scheduler] Trending: {trending_new} new, {trending_updated} updated")
            
            # Update anticipated games (10+ hypes to match quality requirements)
            anticipated_query = f"""
                {services.IGDB_GAME_FIELDS}
                where first_release_date > {current_time} 
                    & first_release_date < {one_year_future} 
                    & hypes >= 10 & cover != null;
                sort hypes desc;
                limit 50;
            """
            anticipated_new, anticipated_updated = await services.sync_games_from_igdb(db, anticipated_query)
            logger.info(f"[Scheduler] Anticipated: {anticipated_new} new, {anticipated_updated} updated")
            
            # Update highly rated games
            rated_query = f"""
                {services.IGDB_GAME_FIELDS}
                where total_rating_count > 100 & total_rating > 85 & cover != null;
                sort total_rating desc;
                limit 50;
            """
            rated_new, rated_updated = await services.sync_games_from_igdb(db, rated_query)
            logger.info(f"[Scheduler] Highly rated: {rated_new} new, {rated_updated} updated")
            
            # Update latest releases
            latest_query = f"""
                {services.IGDB_GAME_FIELDS}
                where first_release_date >= {three_months_ago} 
                    & first_release_date <= {current_time} 
                    & cover != null;
                sort first_release_date desc;
                limit 50;
            """
            latest_new, latest_updated = await services.sync_games_from_igdb(db, latest_query)
            logger.info(f"[Scheduler] Latest: {latest_new} new, {latest_updated} updated")
            
            total_new = trending_new + anticipated_new + rated_new + latest_new
            total_updated = trending_updated + anticipated_updated + rated_updated + latest_updated
            logger.info(f"[Scheduler] Complete: {total_new} new, {total_updated} updated")
            
        finally:
            db.close()

    except Exception as e:
        logger.error(f"[Scheduler] Error: {str(e)}")

def init_scheduler():
    """Initialize the scheduler with featured games update task."""
    try:
        # Update featured games every 6 hours
        scheduler.add_job(
            update_featured_games,
            CronTrigger(hour="*/6"),
            id="update_featured_games",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("[Scheduler] Initialized - updating featured games every 6 hours")

    except Exception as e:
        logger.error(f"[Scheduler] Init error: {str(e)}")
        raise

