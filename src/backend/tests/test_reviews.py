# backend/tests/test_reviews.py
"""
Tests for review endpoints (create, read, update, delete, likes, comments).
"""
import pytest
import pytest_asyncio
from backend.app.api.v1.models.game import Game

pytestmark = pytest.mark.asyncio


@pytest.fixture
def sample_game(db_session):
    """Create a sample released game in the database."""
    game = Game(
        igdb_id=12345,
        name="Test Game",
        slug="test-game",
        genres="Action, RPG",
        rating=85.0,
        total_rating=80.0,
        total_rating_count=10,
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
    """Register and log in a second user for authorization tests."""
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


async def _create_review(client, headers, game_id, rating=4, content="Solid game"):
    """Helper to create a review and return the response."""
    return await client.post(
        "/api/v1/reviews",
        json={"game_id": game_id, "rating": rating, "content": content},
        headers=headers
    )


class TestCreateReview:
    """Tests for creating reviews."""

    async def test_create_review(self, client, auth_headers, sample_game):
        """Test creating a review for a game."""
        response = await _create_review(client, auth_headers, sample_game.igdb_id)
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 4
        assert data["content"] == "Solid game"
        assert data["game_id"] == sample_game.id

    async def test_create_review_game_not_found(self, client, auth_headers):
        """Test reviewing a non-existent game fails."""
        response = await _create_review(client, auth_headers, 99999)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_create_duplicate_review(self, client, auth_headers, sample_game):
        """Test reviewing the same game twice fails."""
        await _create_review(client, auth_headers, sample_game.igdb_id)
        response = await _create_review(client, auth_headers, sample_game.igdb_id)
        assert response.status_code == 400
        assert "already reviewed" in response.json()["detail"].lower()

    async def test_create_review_unauthenticated(self, client, sample_game):
        """Test reviewing without auth fails."""
        response = await client.post(
            "/api/v1/reviews",
            json={"game_id": sample_game.igdb_id, "rating": 4}
        )
        assert response.status_code in [401, 403]

    async def test_create_review_invalid_rating(self, client, auth_headers, sample_game):
        """Test that a rating outside 1-5 is rejected."""
        response = await _create_review(client, auth_headers, sample_game.igdb_id, rating=9)
        assert response.status_code == 422

    async def test_create_review_updates_community_rating(self, client, auth_headers, sample_game, db_session):
        """A review feeds the GameGloom community rating and leaves IGDB's untouched."""
        await _create_review(client, auth_headers, sample_game.igdb_id, rating=5)
        db_session.refresh(sample_game)
        # 5/5 stars -> 100 on the 0-100 scale, one community vote.
        assert sample_game.community_rating == 100
        assert sample_game.community_rating_count == 1
        # IGDB's aggregate is never mutated by reviews.
        assert sample_game.total_rating == 80.0
        assert sample_game.total_rating_count == 10


class TestReadReview:
    """Tests for reading reviews."""

    async def test_get_review_by_id(self, client, auth_headers, sample_game):
        """Test fetching a single review by ID."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]
        response = await client.get(f"/api/v1/reviews/{review_id}")
        assert response.status_code == 200
        assert response.json()["id"] == review_id

    async def test_get_review_not_found(self, client):
        """Test fetching a non-existent review fails."""
        response = await client.get("/api/v1/reviews/99999")
        assert response.status_code == 404

    async def test_get_game_reviews(self, client, auth_headers, sample_game):
        """Test listing all reviews for a game."""
        await _create_review(client, auth_headers, sample_game.igdb_id)
        response = await client.get(f"/api/v1/reviews/game/{sample_game.igdb_id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["game_id"] == sample_game.id

    async def test_get_user_review_for_game(self, client, auth_headers, sample_game):
        """Test fetching the current user's review for a specific game."""
        await _create_review(client, auth_headers, sample_game.igdb_id)
        response = await client.get(
            f"/api/v1/reviews/user/game/{sample_game.igdb_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["game_id"] == sample_game.id


class TestUpdateReview:
    """Tests for updating reviews."""

    async def test_update_review(self, client, auth_headers, sample_game):
        """Test the review owner can update it."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]
        response = await client.put(
            f"/api/v1/reviews/{review_id}",
            json={"rating": 2, "content": "Changed my mind"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 2
        assert data["content"] == "Changed my mind"

    async def test_update_review_not_owner(self, client, auth_headers, other_auth_headers, sample_game):
        """Test a non-owner cannot update a review."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]
        response = await client.put(
            f"/api/v1/reviews/{review_id}",
            json={"rating": 1},
            headers=other_auth_headers
        )
        assert response.status_code == 403

    async def test_update_review_not_found(self, client, auth_headers):
        """Test updating a non-existent review fails."""
        response = await client.put(
            "/api/v1/reviews/99999",
            json={"rating": 3},
            headers=auth_headers
        )
        assert response.status_code == 404


class TestDeleteReview:
    """Tests for deleting reviews."""

    async def test_delete_review(self, client, auth_headers, sample_game):
        """Test the owner can delete a review."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]
        response = await client.delete(
            f"/api/v1/reviews/{review_id}",
            headers=auth_headers
        )
        assert response.status_code == 204
        # Verify it's gone
        assert (await client.get(f"/api/v1/reviews/{review_id}")).status_code == 404

    async def test_delete_review_not_owner(self, client, auth_headers, other_auth_headers, sample_game):
        """Test a non-owner cannot delete a review."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]
        response = await client.delete(
            f"/api/v1/reviews/{review_id}",
            headers=other_auth_headers
        )
        assert response.status_code == 403

    async def test_delete_review_not_found(self, client, auth_headers):
        """Test deleting a non-existent review fails."""
        response = await client.delete("/api/v1/reviews/99999", headers=auth_headers)
        assert response.status_code == 404


class TestReviewLikes:
    """Tests for liking and unliking reviews."""

    async def test_like_and_unlike_toggle(self, client, auth_headers, other_auth_headers, sample_game):
        """Test liking a review increments the count and unliking decrements it."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]

        # Other user likes it
        await client.post(f"/api/v1/reviews/{review_id}/like", headers=other_auth_headers)
        liked = await client.get(f"/api/v1/reviews/{review_id}")
        assert liked.json()["likes_count"] == 1

        # Liking again toggles it off
        await client.post(f"/api/v1/reviews/{review_id}/like", headers=other_auth_headers)
        unliked = await client.get(f"/api/v1/reviews/{review_id}")
        assert unliked.json()["likes_count"] == 0

    async def test_like_review_not_found(self, client, auth_headers):
        """Test liking a non-existent review fails."""
        response = await client.post("/api/v1/reviews/99999/like", headers=auth_headers)
        assert response.status_code == 404


class TestReviewComments:
    """Tests for review comments."""

    async def test_add_and_get_comment(self, client, auth_headers, other_auth_headers, sample_game):
        """Test adding a comment and listing comments."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]

        response = await client.post(
            f"/api/v1/reviews/{review_id}/comments",
            json={"content": "Nice review!"},
            headers=other_auth_headers
        )
        assert response.status_code == 200
        assert response.json()["content"] == "Nice review!"

        comments = await client.get(f"/api/v1/reviews/{review_id}/comments")
        assert comments.status_code == 200
        assert len(comments.json()) == 1

    async def test_update_comment_not_owner(self, client, auth_headers, other_auth_headers, sample_game):
        """Test a non-owner cannot update a comment."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]
        comment = await client.post(
            f"/api/v1/reviews/{review_id}/comments",
            json={"content": "Original"},
            headers=other_auth_headers
        )
        comment_id = comment.json()["id"]
        response = await client.put(
            f"/api/v1/reviews/{review_id}/comments/{comment_id}",
            json={"content": "Hijacked"},
            headers=auth_headers
        )
        assert response.status_code == 403

    async def test_delete_comment(self, client, auth_headers, other_auth_headers, sample_game):
        """Test the comment owner can delete it."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]
        comment = await client.post(
            f"/api/v1/reviews/{review_id}/comments",
            json={"content": "Delete me"},
            headers=other_auth_headers
        )
        comment_id = comment.json()["id"]
        response = await client.delete(
            f"/api/v1/reviews/{review_id}/comments/{comment_id}",
            headers=other_auth_headers
        )
        assert response.status_code == 204
        comments = await client.get(f"/api/v1/reviews/{review_id}/comments")
        assert comments.json() == []

    async def test_comments_count_tracks_actual_comments(self, client, auth_headers, other_auth_headers, sample_game):
        """The stored comments_count stays in sync with the comment rows after add and delete."""
        created = await _create_review(client, auth_headers, sample_game.igdb_id)
        review_id = created.json()["id"]

        first = await client.post(
            f"/api/v1/reviews/{review_id}/comments",
            json={"content": "One"},
            headers=other_auth_headers
        )
        await client.post(
            f"/api/v1/reviews/{review_id}/comments",
            json={"content": "Two"},
            headers=auth_headers
        )
        review = await client.get(f"/api/v1/reviews/{review_id}")
        assert review.json()["comments_count"] == 2

        await client.delete(
            f"/api/v1/reviews/{review_id}/comments/{first.json()['id']}",
            headers=other_auth_headers
        )
        review = await client.get(f"/api/v1/reviews/{review_id}")
        assert review.json()["comments_count"] == 1
