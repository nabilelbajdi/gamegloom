# backend/tests/test_preferences.py
"""
Tests for onboarding preferences + username endpoints (Phase A).
"""
import pytest
import pytest_asyncio

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def auth_headers(client, test_user_data):
    """Register + log in the primary test user; return Bearer headers."""
    await client.post("/api/v1/register", json=test_user_data)
    res = await client.post("/api/v1/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"],
    })
    token = res.json()["token"]
    # Use header auth so the CSRF middleware stays out of the way.
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_user(client):
    """A second registered user (username 'otheruser')."""
    await client.post("/api/v1/register", json={
        "username": "otheruser",
        "email": "other@example.com",
        "password": "securepassword123",
    })
    return "otheruser"


# --- preferences ----------------------------------------------------------

async def test_preferences_require_auth(client):
    res = await client.get("/api/v1/me/preferences")
    assert res.status_code == 401


async def test_default_preferences(client, auth_headers):
    res = await client.get("/api/v1/me/preferences", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data == {
        "favorite_genres": [],
        "favorite_themes": [],
        "playstyles": [],
        "theme_key": "obsidian",
        "onboarded": False,
    }


async def test_update_preferences_and_mark_onboarded(client, auth_headers):
    res = await client.put("/api/v1/me/preferences", headers=auth_headers, json={
        "favorite_genres": ["rpg", "adventure"],
        "playstyles": ["story"],
        "theme_key": "bloodborne",
        "mark_onboarded": True,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["favorite_genres"] == ["rpg", "adventure"]
    assert data["theme_key"] == "bloodborne"
    assert data["onboarded"] is True

    # Persisted on re-read.
    res2 = await client.get("/api/v1/me/preferences", headers=auth_headers)
    assert res2.json()["onboarded"] is True
    assert res2.json()["favorite_genres"] == ["rpg", "adventure"]


async def test_partial_update_does_not_wipe_other_fields(client, auth_headers):
    await client.put("/api/v1/me/preferences", headers=auth_headers, json={
        "favorite_genres": ["shooter"],
    })
    # Now update only the theme; genres should survive.
    res = await client.put("/api/v1/me/preferences", headers=auth_headers, json={
        "theme_key": "hades",
    })
    data = res.json()
    assert data["favorite_genres"] == ["shooter"]
    assert data["theme_key"] == "hades"


# --- username availability + change ---------------------------------------

async def test_own_username_is_available(client, auth_headers, test_user_data):
    res = await client.get(
        f"/api/v1/username-available?u={test_user_data['username']}", headers=auth_headers
    )
    assert res.status_code == 200
    assert res.json() == {"available": True, "valid_format": True}


async def test_taken_username_is_unavailable(client, auth_headers, other_user):
    res = await client.get(f"/api/v1/username-available?u={other_user}", headers=auth_headers)
    assert res.json()["available"] is False


async def test_badly_formatted_username_is_invalid(client, auth_headers):
    res = await client.get("/api/v1/username-available?u=bad name", headers=auth_headers)
    body = res.json()
    assert body["valid_format"] is False
    assert body["available"] is False


async def test_change_username_success(client, auth_headers):
    res = await client.put("/api/v1/me/username", headers=auth_headers, json={"username": "coolgamer_99"})
    assert res.status_code == 200
    assert res.json()["username"] == "coolgamer_99"


async def test_change_username_conflict(client, auth_headers, other_user):
    res = await client.put("/api/v1/me/username", headers=auth_headers, json={"username": other_user})
    assert res.status_code == 409


async def test_change_username_rejects_bad_format(client, auth_headers):
    res = await client.put("/api/v1/me/username", headers=auth_headers, json={"username": "bad name!"})
    assert res.status_code == 422  # schema validation
