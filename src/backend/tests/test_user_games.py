# backend/tests/test_user_games.py
"""
Tests for user game collection endpoints.
"""
import pytest
import pytest_asyncio
from backend.app.api.v1.models.game import Game
from backend.app.api.v1.models.user_game import GameStatus

pytestmark = pytest.mark.asyncio


@pytest.fixture
def sample_game(db_session):
    """Create a sample game in the database."""
    game = Game(
        igdb_id=12345,
        name="Test Game",
        slug="test-game",
        genres="Action, RPG",
        rating=85.0,
        total_rating=80.0,
    )
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)
    return game


@pytest_asyncio.fixture
async def auth_headers(client, test_user_data):
    """Get auth headers for a logged-in user."""
    # Register user
    await client.post("/api/v1/register", json=test_user_data)
    # Login
    response = await client.post("/api/v1/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


class TestUserGameCollection:
    """Tests for user game collection endpoints."""
    
    async def test_add_game_to_collection(self, client, auth_headers, sample_game):
        """Test adding a game to user's collection."""
        response = await client.post(
            "/api/v1/user-games",
            json={"game_id": sample_game.igdb_id, "status": "want_to_play"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "want_to_play"
        assert data["game_id"] == sample_game.id

    async def test_add_game_not_found(self, client, auth_headers):
        """Test adding a non-existent game fails."""
        response = await client.post(
            "/api/v1/user-games",
            json={"game_id": 99999, "status": "want_to_play"},
            headers=auth_headers
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_add_duplicate_game(self, client, auth_headers, sample_game):
        """Test adding the same game twice fails."""
        # Add first time
        await client.post(
            "/api/v1/user-games",
            json={"game_id": sample_game.igdb_id, "status": "want_to_play"},
            headers=auth_headers
        )
        # Try adding again
        response = await client.post(
            "/api/v1/user-games",
            json={"game_id": sample_game.igdb_id, "status": "playing"},
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "already in collection" in response.json()["detail"].lower()

    async def test_add_game_unauthenticated(self, client, sample_game):
        """Test adding a game without auth fails."""
        response = await client.post(
            "/api/v1/user-games",
            json={"game_id": sample_game.igdb_id, "status": "want_to_play"}
        )
        assert response.status_code == 403

    async def test_get_user_collection(self, client, auth_headers, sample_game):
        """Test getting user's game collection."""
        # Add a game first
        await client.post(
            "/api/v1/user-games",
            json={"game_id": sample_game.igdb_id, "status": "playing"},
            headers=auth_headers
        )
        
        # Get collection
        response = await client.get(
            "/api/v1/user-games/collection",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "want_to_play" in data
        assert "playing" in data
        assert "played" in data
        assert len(data["playing"]) == 1
        assert data["playing"][0]["name"] == "Test Game"

    async def test_get_empty_collection(self, client, auth_headers):
        """Test getting an empty collection."""
        response = await client.get(
            "/api/v1/user-games/collection",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["want_to_play"] == []
        assert data["playing"] == []
        assert data["played"] == []

    async def test_update_game_status(self, client, auth_headers, sample_game):
        """Test updating a game's status in collection."""
        # Add game
        await client.post(
            "/api/v1/user-games",
            json={"game_id": sample_game.igdb_id, "status": "want_to_play"},
            headers=auth_headers
        )
        
        # Update status
        response = await client.patch(
            f"/api/v1/user-games/{sample_game.igdb_id}",
            json={"status": "played"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "played"

    async def test_update_game_not_in_collection(self, client, auth_headers, sample_game):
        """Test updating a game that's not in collection fails."""
        response = await client.patch(
            f"/api/v1/user-games/{sample_game.igdb_id}",
            json={"status": "played"},
            headers=auth_headers
        )
        assert response.status_code == 404
        assert "not found in collection" in response.json()["detail"].lower()

    async def test_remove_game_from_collection(self, client, auth_headers, sample_game):
        """Test removing a game from collection."""
        # Add game
        await client.post(
            "/api/v1/user-games",
            json={"game_id": sample_game.igdb_id, "status": "playing"},
            headers=auth_headers
        )
        
        # Remove game
        response = await client.delete(
            f"/api/v1/user-games/{sample_game.igdb_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Verify it's gone
        collection = await client.get(
            "/api/v1/user-games/collection",
            headers=auth_headers
        )
        assert collection.json()["playing"] == []

    async def test_remove_game_not_in_collection(self, client, auth_headers, sample_game):
        """Test removing a game that's not in collection fails."""
        response = await client.delete(
            f"/api/v1/user-games/{sample_game.igdb_id}",
            headers=auth_headers
        )
        assert response.status_code == 404
