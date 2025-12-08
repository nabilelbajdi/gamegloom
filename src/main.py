# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from backend.app.api.db_setup import init_db
from backend.app.api.v1.routers.games import router as games_router
from backend.app.api.v1.routers.auth import router as auth_router
from backend.app.api.v1.routers.user_games import router as user_games_router
from backend.app.api.v1.routers.reviews import router as reviews_router
from backend.app.api.v1.routers.recommendations import router as recommendations_router
from backend.app.api.v1.routers.webhooks import router as webhooks_router
from backend.app.api.v1.routers.user_lists import router as user_lists_router
from scripts.scheduler.scheduler import init_scheduler
import logging
import os

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure avatar directory exists
os.makedirs("frontend/public/images/avatars", exist_ok=True)

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        init_scheduler()
        logger.info("Scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {str(e)}")
    
    yield

app = FastAPI(
    title="GameGloom API",
    description="API for GameGloom - Your Gaming Discovery Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    "https://gamegloom.vercel.app",  # Update this after renaming Vercel project
    "https://gamegloom.com",
    "https://www.gamegloom.com",
    "https://api.gamegloom.com",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(games_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_games_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1")
app.include_router(webhooks_router, prefix="/api/v1")
app.include_router(user_lists_router, prefix="/api/v1")

# Mount static files
app.mount("/images", StaticFiles(directory="frontend/public/images"), name="images")
