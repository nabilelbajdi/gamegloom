# backend/tests/test_user_lists.py
"""
Tests for user list endpoints (create, read, update, delete, add/remove games).
"""
import pytest
import pytest_asyncio
from backend.app.api.v1.models.game import Game

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
    """Register and log in the primary test user, returning auth headers."""
    await client.post("/api/v1/register", json=test_user_data)
    response = await client.post("/api/v1/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    token = response.json()["token"]
    # These tests authenticate via the Bearer header; clear the cookie jar so the
    # auth cookie set by login doesn't trip the CSRF middleware on a later login.
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_auth_headers(client):
    """Register and log in a second user for ownership-isolation tests."""
    other = {
        "username": "otheruser",
        "email": "other@example.com",
        "password": "securepassword123"
    }
    await client.post("/api/v1/register", json=other)
    response = await client.post("/api/v1/login", json={
        "username": other["username"],
        "password": other["password"]
    })
    token = response.json()["token"]
    # These tests authenticate via the Bearer header; clear the cookie jar so the
    # auth cookie set by login doesn't trip the CSRF middleware on a later login.
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


async def _create_list(client, headers, name="Favorites", description="My top games", is_public=False):
    """Helper to create a list and return the response."""
    return await client.post(
        "/api/v1/user-lists",
        json={"name": name, "description": description, "is_public": is_public},
        headers=headers
    )


class TestCreateList:
    """Tests for creating user lists."""

    async def test_create_list(self, client, auth_headers):
        """Test creating a user list."""
        response = await _create_list(client, auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Favorites"
        assert data["description"] == "My top games"
        assert data["is_public"] is False
        assert data["games"] == []

    async def test_create_list_unauthenticated(self, client):
        """Test creating a list without auth fails."""
        response = await client.post(
            "/api/v1/user-lists",
            json={"name": "Favorites"}
        )
        assert response.status_code in [401, 403]

    async def test_create_list_blank_name(self, client, auth_headers):
        """Test creating a list with an empty name is rejected."""
        response = await client.post(
            "/api/v1/user-lists",
            json={"name": ""},
            headers=auth_headers
        )
        assert response.status_code == 422


class TestReadList:
    """Tests for reading user lists."""

    async def test_get_user_lists(self, client, auth_headers):
        """Test listing the current user's lists."""
        await _create_list(client, auth_headers, name="List A")
        await _create_list(client, auth_headers, name="List B")
        response = await client.get("/api/v1/user-lists", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["lists"]) == 2

    async def test_get_single_list(self, client, auth_headers):
        """Test fetching a single list by ID."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.get(f"/api/v1/user-lists/{list_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == list_id

    async def test_get_list_not_found(self, client, auth_headers):
        """Test fetching a non-existent list fails."""
        response = await client.get("/api/v1/user-lists/99999", headers=auth_headers)
        assert response.status_code == 404

    async def test_get_other_users_list_is_hidden(self, client, auth_headers, other_auth_headers):
        """Test a user cannot fetch another user's list by ID."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.get(f"/api/v1/user-lists/{list_id}", headers=other_auth_headers)
        assert response.status_code == 404


class TestUpdateList:
    """Tests for updating user lists."""

    async def test_update_list(self, client, auth_headers):
        """Test the owner can rename and update a list."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.patch(
            f"/api/v1/user-lists/{list_id}",
            json={"name": "Renamed", "is_public": True},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Renamed"
        assert data["is_public"] is True

    async def test_update_other_users_list(self, client, auth_headers, other_auth_headers):
        """Test a user cannot update another user's list."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.patch(
            f"/api/v1/user-lists/{list_id}",
            json={"name": "Hijacked"},
            headers=other_auth_headers
        )
        assert response.status_code == 404


class TestDeleteList:
    """Tests for deleting user lists."""

    async def test_delete_list(self, client, auth_headers):
        """Test the owner can delete a list."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.delete(f"/api/v1/user-lists/{list_id}", headers=auth_headers)
        assert response.status_code == 200
        # Verify it's gone
        assert (await client.get(f"/api/v1/user-lists/{list_id}", headers=auth_headers)).status_code == 404

    async def test_delete_other_users_list(self, client, auth_headers, other_auth_headers):
        """Test a user cannot delete another user's list."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.delete(f"/api/v1/user-lists/{list_id}", headers=other_auth_headers)
        assert response.status_code == 404


class TestListGames:
    """Tests for adding and removing games in a list."""

    async def test_add_game_to_list(self, client, auth_headers, sample_game):
        """Test adding a game to a list."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.post(
            f"/api/v1/user-lists/{list_id}/games",
            json={"game_id": sample_game.igdb_id},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["games"]) == 1
        assert data["games"][0]["igdb_id"] == sample_game.igdb_id

    async def test_add_game_not_found(self, client, auth_headers):
        """Test adding a non-existent game to a list fails."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.post(
            f"/api/v1/user-lists/{list_id}/games",
            json={"game_id": 99999},
            headers=auth_headers
        )
        assert response.status_code == 404

    async def test_add_duplicate_game(self, client, auth_headers, sample_game):
        """Test adding the same game twice fails."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        await client.post(
            f"/api/v1/user-lists/{list_id}/games",
            json={"game_id": sample_game.igdb_id},
            headers=auth_headers
        )
        response = await client.post(
            f"/api/v1/user-lists/{list_id}/games",
            json={"game_id": sample_game.igdb_id},
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "already in list" in response.json()["detail"].lower()

    async def test_remove_game_from_list(self, client, auth_headers, sample_game):
        """Test removing a game from a list."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        await client.post(
            f"/api/v1/user-lists/{list_id}/games",
            json={"game_id": sample_game.igdb_id},
            headers=auth_headers
        )
        response = await client.delete(
            f"/api/v1/user-lists/{list_id}/games/{sample_game.igdb_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["games"] == []

    async def test_remove_game_not_in_list(self, client, auth_headers, sample_game):
        """Test removing a game that isn't in the list fails."""
        created = await _create_list(client, auth_headers)
        list_id = created.json()["id"]
        response = await client.delete(
            f"/api/v1/user-lists/{list_id}/games/{sample_game.igdb_id}",
            headers=auth_headers
        )
        assert response.status_code == 404
