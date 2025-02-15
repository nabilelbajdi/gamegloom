from fastapi import APIRouter

from app.api.v1.core.endpoints.games import router as games_router

router = APIRouter()

router.include_router(games_router) 