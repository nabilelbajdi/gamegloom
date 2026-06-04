# backend/tests/test_games.py
"""
Tests for the public games endpoints.
"""
import pytest
from backend.app.api.v1.models.game import Game

pytestmark = pytest.mark.asyncio


@pytest.fixture
def sample_games(db_session):
    """Create a couple of games in the database."""
    games = [
        Game(igdb_id=101, name="Game One", slug="game-one"),
        Game(igdb_id=102, name="Game Two", slug="game-two"),
    ]
    db_session.add_all(games)
    db_session.commit()
    for g in games:
        db_session.refresh(g)
    return games


async def test_get_games_by_ids_returns_matches(client, sample_games):
    ids = ",".join(str(g.id) for g in sample_games)
    response = await client.get(f"/api/v1/games?ids={ids}")
    assert response.status_code == 200
    returned = {g["id"] for g in response.json()}
    assert returned == {g.id for g in sample_games}


async def test_get_games_by_ids_rejects_non_integer(client):
    response = await client.get("/api/v1/games?ids=abc")
    assert response.status_code == 400


async def test_get_games_by_ids_ignores_trailing_comma(client, sample_games):
    response = await client.get(f"/api/v1/games?ids={sample_games[0].id},")
    assert response.status_code == 200
    assert [g["id"] for g in response.json()] == [sample_games[0].id]
