# backend/tests/test_recommendations.py
"""
Tests for content-based recommendations (Phase B).

The scoring logic is tested directly against the service; the endpoint gets a
couple of smoke tests (auth required + returns a list).
"""
from types import SimpleNamespace

import pytest
import pytest_asyncio

from app.api.v1.core.recommendation_service import recommend_games
from app.api.v1.models.game import Game
from app.api.v1.models.user_game import UserGame, GameStatus


def _game(db, igdb_id, name, genres=None, themes=None, rating=80.0):
    g = Game(
        igdb_id=igdb_id,
        name=name,
        slug=name.lower().replace(" ", "-"),
        genres=genres,
        themes=themes,
        total_rating=rating,
        cover_image="https://example.com/c.jpg",
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


# --- scoring service ------------------------------------------------------

def test_prefers_matching_genre_over_higher_rating(db_session):
    _game(db_session, 1, "RPG Game", genres="Role-playing (RPG)", rating=70)
    _game(db_session, 2, "Racing Game", genres="Racing", rating=95)
    prefs = SimpleNamespace(favorite_genres=["rpg"], favorite_themes=[])

    recs = recommend_games(db_session, user_id=999, prefs=prefs, limit=10)
    names = [g.name for g in recs]
    # Genre match outweighs the racing game's higher rating.
    assert names.index("RPG Game") < names.index("Racing Game")


def test_fallback_to_top_rated_when_no_taste(db_session):
    _game(db_session, 1, "Low", genres="Racing", rating=60)
    _game(db_session, 2, "High", genres="Puzzle", rating=95)

    recs = recommend_games(db_session, user_id=999, prefs=None, limit=10)
    assert recs[0].name == "High"  # pure quality order


def test_similar_games_boost_and_library_exclusion(db_session):
    _game(db_session, 10, "Plain A", genres="Racing", rating=80)
    _game(db_session, 11, "Similar B", genres="Racing", rating=80)
    owned = _game(db_session, 100, "Owned", genres="Racing", rating=80)
    owned.similar_games = [{"id": 11, "name": "Similar B"}]
    db_session.commit()

    db_session.add(UserGame(user_id=999, game_id=owned.id, status=next(iter(GameStatus))))
    db_session.commit()

    recs = recommend_games(db_session, user_id=999, prefs=None, limit=10)
    names = [g.name for g in recs]
    assert "Owned" not in names  # library excluded
    assert names.index("Similar B") < names.index("Plain A")  # IGDB-similar boosted


# --- endpoint smoke -------------------------------------------------------

pytestmark_async = pytest.mark.asyncio


@pytest_asyncio.fixture
async def auth_headers(client, test_user_data):
    await client.post("/api/v1/register", json=test_user_data)
    res = await client.post("/api/v1/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"],
    })
    token = res.json()["token"]
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_recommendations_require_auth(client):
    res = await client.get("/api/v1/recommendations/games")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_recommendations_returns_list(client, auth_headers, db_session):
    _game(db_session, 1, "Some Game", genres="Adventure", rating=90)
    res = await client.get("/api/v1/recommendations/games", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
