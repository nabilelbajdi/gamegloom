# backend/tests/test_public_lists.py
"""
Tests for the public lists router, focused on the computed "featured" criteria.

Featured status is derived rather than stored: a list qualifies when it is public,
carries a non-blank description, and holds at least FEATURED_MIN_GAMES games. These
tests pin that contract down, since the Featured tab is otherwise indistinguishable
from Popular and a regression would be invisible.
"""
import pytest
import pytest_asyncio

# Imported via the same module path conftest uses. Importing these under the
# `backend.app` alias instead would build a second mapper registry and fail.
from app.api.v1.models.game import Game
from app.api.v1.routers.public_lists import FEATURED_MIN_GAMES

pytestmark = pytest.mark.asyncio


@pytest.fixture
def game_pool(db_session):
    """Create more games than the featured threshold needs."""
    games = []
    for index in range(FEATURED_MIN_GAMES + 3):
        game = Game(
            igdb_id=90000 + index,
            name=f"Pool Game {index}",
            slug=f"pool-game-{index}",
            cover_image=f"https://images.igdb.com/t_thumb/cover{index}.jpg",
        )
        db_session.add(game)
        games.append(game)
    db_session.commit()
    for game in games:
        db_session.refresh(game)
    return games


@pytest_asyncio.fixture
async def auth_headers(client, test_user_data):
    """Register and log in a user, returning bearer auth headers."""
    await client.post("/api/v1/register", json=test_user_data)
    response = await client.post("/api/v1/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    token = response.json()["token"]
    # Bearer auth is used here; drop the login cookie so CSRF doesn't reject later calls.
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


async def build_list(client, headers, game_pool, *, name, description,
                     is_public=True, game_count=FEATURED_MIN_GAMES):
    """Create a list with the requested description and number of games."""
    created = await client.post(
        "/api/v1/user-lists",
        json={"name": name, "description": description, "is_public": is_public},
        headers=headers,
    )
    list_id = created.json()["id"]

    for game in game_pool[:game_count]:
        await client.post(
            f"/api/v1/user-lists/{list_id}/games",
            json={"game_id": game.igdb_id},
            headers=headers,
        )
    return list_id


async def featured_names(client):
    """Names returned by the dedicated featured endpoint."""
    response = await client.get("/api/v1/lists/featured")
    assert response.status_code == 200
    return [item["name"] for item in response.json()]


async def sorted_names(client, sort):
    """Names returned by the browse endpoint for a given sort."""
    response = await client.get(f"/api/v1/lists?sort={sort}&per_page=50")
    assert response.status_code == 200
    return [item["name"] for item in response.json()["lists"]]


class TestFeaturedCriteria:
    """What does and does not qualify as an editor's pick."""

    async def test_qualifying_list_is_featured(self, client, auth_headers, game_pool):
        """A public list with a description and enough games qualifies."""
        await build_list(client, auth_headers, game_pool,
                         name="Qualifies", description="A real description")
        assert "Qualifies" in await featured_names(client)

    async def test_missing_description_is_excluded(self, client, auth_headers, game_pool):
        """Enough games but no description does not qualify."""
        await build_list(client, auth_headers, game_pool,
                         name="No Description", description=None)
        assert "No Description" not in await featured_names(client)

    async def test_blank_description_is_excluded(self, client, auth_headers, game_pool):
        """A whitespace-only description is treated as absent."""
        await build_list(client, auth_headers, game_pool,
                         name="Blank Description", description="   ")
        assert "Blank Description" not in await featured_names(client)

    async def test_too_few_games_is_excluded(self, client, auth_headers, game_pool):
        """A described list below the game threshold does not qualify."""
        await build_list(client, auth_headers, game_pool,
                         name="Too Small", description="Described but thin",
                         game_count=FEATURED_MIN_GAMES - 1)
        assert "Too Small" not in await featured_names(client)

    async def test_exactly_threshold_games_qualifies(self, client, auth_headers, game_pool):
        """The threshold is inclusive."""
        await build_list(client, auth_headers, game_pool,
                         name="Exactly Enough", description="Right on the line",
                         game_count=FEATURED_MIN_GAMES)
        assert "Exactly Enough" in await featured_names(client)

    async def test_private_list_is_excluded(self, client, auth_headers, game_pool):
        """A private list never surfaces, however good it is."""
        await build_list(client, auth_headers, game_pool,
                         name="Private Gem", description="Great but private",
                         is_public=False)
        assert "Private Gem" not in await featured_names(client)


class TestFeaturedSort:
    """The featured sort on the browse endpoint."""

    async def test_featured_sort_filters_out_weak_lists(self, client, auth_headers, game_pool):
        """sort=featured narrows the pool; sort=popular does not."""
        await build_list(client, auth_headers, game_pool,
                         name="Strong", description="Complete list")
        await build_list(client, auth_headers, game_pool,
                         name="Weak", description=None, game_count=1)

        popular = await sorted_names(client, "popular")
        featured = await sorted_names(client, "featured")

        assert {"Strong", "Weak"} <= set(popular)
        assert "Strong" in featured
        assert "Weak" not in featured

    async def test_featured_total_reflects_filtering(self, client, auth_headers, game_pool):
        """The reported total counts only qualifying lists, so paging stays correct."""
        await build_list(client, auth_headers, game_pool,
                         name="Strong", description="Complete list")
        await build_list(client, auth_headers, game_pool,
                         name="Weak", description=None, game_count=1)

        popular = await client.get("/api/v1/lists?sort=popular")
        featured = await client.get("/api/v1/lists?sort=featured")

        assert popular.json()["total"] == 2
        assert featured.json()["total"] == 1

    async def test_featured_orders_by_likes(self, client, auth_headers, game_pool):
        """Qualifying lists come back most-liked first."""
        quiet = await build_list(client, auth_headers, game_pool,
                                 name="Quiet", description="Few likes")
        loved = await build_list(client, auth_headers, game_pool,
                                 name="Loved", description="Many likes")

        # A second user supplies the like, since you cannot rank without one.
        await client.post("/api/v1/register", json={
            "username": "liker", "email": "liker@example.com",
            "password": "securepassword123",
        })
        login = await client.post("/api/v1/login", json={
            "username": "liker", "password": "securepassword123",
        })
        client.cookies.clear()
        liker_headers = {"Authorization": f"Bearer {login.json()['token']}"}

        await client.post(f"/api/v1/lists/{loved}/like", headers=liker_headers)

        featured = await sorted_names(client, "featured")
        assert featured.index("Loved") < featured.index("Quiet")
        assert quiet is not None


class TestFeaturedResponseShape:
    """The dropped is_featured column must not reappear in responses."""

    async def test_response_has_no_is_featured_field(self, client, auth_headers, game_pool):
        """is_featured was removed; nothing should still be serialising it."""
        await build_list(client, auth_headers, game_pool,
                         name="Shape Check", description="Checking fields")
        response = await client.get("/api/v1/lists?sort=featured")
        assert response.status_code == 200
        for item in response.json()["lists"]:
            assert "is_featured" not in item
