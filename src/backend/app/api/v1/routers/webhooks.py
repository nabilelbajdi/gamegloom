from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session
import logging
import json

from ...db_setup import get_db
from ...settings import settings
from ..core import services

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/webhooks",
    tags=["webhooks"]
)

WEBHOOK_SECRET = settings.IGDB_WEBHOOK_SECRET

@router.post("/igdb/{event_type}", status_code=status.HTTP_200_OK)
async def process_igdb_webhook(
    event_type: str,
    request: Request,
    x_secret: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Handle IGDB Webhooks for:
    - /webhooks/igdb/create → New game
    - /webhooks/igdb/update → Updated game
    - /webhooks/igdb/delete → Deleted game
    """
    if x_secret != WEBHOOK_SECRET:
        logger.warning(f"Invalid webhook secret received: {x_secret}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")

    try:
        payload = await request.json()
        logger.info(f"Received IGDB {event_type} webhook: {payload}")

        # Extract the game data from the webhook payload
        if isinstance(payload, dict):
            game_data = payload
        else:
            # If payload is a string containing JSON
            try:
                game_data = json.loads(payload.get('raw_data', '{}'))
            except json.JSONDecodeError:
                logger.error("Failed to parse webhook payload JSON")
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

        game_id = game_data.get("id")
        if not game_id:
            logger.warning("Invalid webhook payload: Missing 'id'")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload format")

        # Handle events
        if event_type == "create":
            await process_created_game(db, game_id, game_data)
        elif event_type == "update":
            await process_updated_game(db, game_id, game_data)
        elif event_type == "delete":
            await process_deleted_game(db, game_id)
        else:
            logger.warning(f"Unknown webhook event type: {event_type}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event type")

        return {"status": "success", "message": f"{event_type} webhook processed"}

    except Exception as e:
        logger.error(f"Error processing IGDB webhook: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


### GAME PROCESSING FUNCTIONS

async def process_created_game(db: Session, game_id: int, game_data: dict = None):
    """Fetch and store a new game from IGDB"""
    try:
        # Check if game already exists
        existing_game = services.get_game_by_igdb_id(db, game_id)
        if existing_game:
            # If game exists, update it instead
            return await process_updated_game(db, game_id, game_data)
            
        # Always fetch complete game data from IGDB
        igdb_data = services.fetch_from_igdb(game_id=game_id)
        if not igdb_data:
            raise ValueError(f"Could not fetch game data for ID {game_id}")
            
        game_data = services.process_igdb_data(igdb_data[0] if isinstance(igdb_data, list) else igdb_data)
        db_game = services.create_game(db, game_data)
        # Ensure new games are not marked as deleted
        db_game.is_deleted = False
        db.commit()
        logger.info(f"Created new game: {game_data.name} (ID: {game_id})")
        return db_game
    except Exception as e:
        logger.error(f"Error creating game {game_id}: {str(e)}")
        raise e

async def process_updated_game(db: Session, game_id: int, game_data: dict = None):
    """Fetch and update an existing game from IGDB"""
    try:
        # Always fetch complete game data from IGDB
        igdb_data = services.fetch_from_igdb(game_id=game_id)
        if not igdb_data:
            raise ValueError(f"Could not fetch game data for ID {game_id}")
            
        processed_data = services.process_igdb_data(igdb_data[0] if isinstance(igdb_data, list) else igdb_data)
        
        # Check if game exists by IGDB ID
        existing_game = services.get_game_by_igdb_id(db, game_id)
        if not existing_game:
            # If game doesn't exist, create it
            return await process_created_game(db, game_id, game_data)
        
        # Update the game with new data
        game_dict = processed_data.model_dump()
        for key, value in game_dict.items():
            setattr(existing_game, key, value)
        
        # If IGDB sends an update, the game exists in their database
        existing_game.is_deleted = False
        
        db.add(existing_game)
        db.commit()
        db.refresh(existing_game)
        logger.info(f"Updated game: {processed_data.name} (ID: {game_id})")
        return existing_game
    except Exception as e:
        logger.error(f"Error updating game {game_id}: {str(e)}")
        raise e

async def process_deleted_game(db: Session, game_id: int):
    """Mark a game as deleted in the database"""
    try:
        services.mark_game_as_deleted(db, game_id)
        logger.info(f"Marked game as deleted: ID {game_id}")
    except Exception as e:
        logger.error(f"Error deleting game {game_id}: {str(e)}")
        raise e 