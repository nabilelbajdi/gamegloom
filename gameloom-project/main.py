# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from backend.app.api.db_setup import init_db
from backend.app.api.v1.routers.games import router as games_router
from backend.app.api.v1.routers.auth import router as auth_router
from backend.app.api.v1.routers.library import router as library_router
from backend.app.api.scheduler import init_scheduler
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database on startup
    init_db()
    
    # Initialize the scheduler
    try:
        init_scheduler()
        logger.info("Scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {str(e)}")
    
    yield

app = FastAPI(
    title="GameLoom API",
    description="API for GameLoom - Your Gaming Discovery Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(games_router, prefix="/api/v1")
app.include_router(library_router, prefix="/api/v1") 