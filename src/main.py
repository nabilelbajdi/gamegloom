# main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.app.api.v1.core.rate_limit import limiter
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
from backend.app.api.v1.routers.integrations import router as integrations_router
from backend.app.api.v1.routers.public_lists import router as public_lists_router

# Import models to ensure SQLAlchemy can resolve relationships
from backend.app.api.v1.models.user_platform_link import UserPlatformLink
from backend.app.api.v1.models.password_reset_token import PasswordResetToken
from backend.app.api.v1.models.email_verification import EmailVerification
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

# Add rate limiter to app state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    "https://gamegloom.vercel.app",
    "https://gamegloom.com",
    "https://www.gamegloom.com",
    "https://api.gamegloom.com",
    "https://gamegloom-api.onrender.com",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"
    # same-site lets gamegloom.com call api.gamegloom.com while blocking other origins from embedding API responses.
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    # Strict CSP for the JSON API; Swagger UI at /docs needs inline scripts + CDN, so skip there.
    if not request.url.path.startswith(("/docs", "/redoc", "/openapi.json")):
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response


@app.get("/health")
async def health_check():
    """Lightweight liveness check for uptime monitors and platform health probes."""
    return {"status": "ok"}


# Include the routers
app.include_router(games_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_games_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1")
app.include_router(webhooks_router, prefix="/api/v1")
app.include_router(user_lists_router, prefix="/api/v1")
app.include_router(integrations_router, prefix="/api/v1")
app.include_router(public_lists_router, prefix="/api/v1")


# Mount static files
app.mount("/images", StaticFiles(directory="frontend/public/images"), name="images")
