from fastapi import APIRouter
from .routers import auth, games, user_games, reviews, user_lists, webhooks, integrations, public_lists

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(games.router)
api_router.include_router(user_games.router)
api_router.include_router(reviews.router)
api_router.include_router(user_lists.router)
api_router.include_router(public_lists.router)
api_router.include_router(webhooks.router)
api_router.include_router(integrations.router) 