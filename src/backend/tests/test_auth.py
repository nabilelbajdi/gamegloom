# backend/tests/test_auth.py
"""
Tests for authentication endpoints: register, login, and /me.
"""
import pytest

pytestmark = pytest.mark.asyncio


class TestRegister:
    """Tests for POST /api/v1/register endpoint."""
    
    async def test_register_success(self, client, test_user_data):
        """Test successful user registration."""
        response = await client.post("/api/v1/register", json=test_user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert "id" in data
        assert "hashed_password" not in data  # Password should not be exposed
    
    async def test_register_duplicate_username(self, client, test_user_data):
        """Test registration fails with duplicate username."""
        # Register first user
        await client.post("/api/v1/register", json=test_user_data)
        
        # Try to register with same username
        duplicate_data = {**test_user_data, "email": "different@example.com"}
        response = await client.post("/api/v1/register", json=duplicate_data)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    async def test_register_duplicate_email(self, client, test_user_data):
        """Test registration fails with duplicate email."""
        # Register first user
        await client.post("/api/v1/register", json=test_user_data)
        
        # Try to register with same email
        duplicate_data = {**test_user_data, "username": "differentuser"}
        response = await client.post("/api/v1/register", json=duplicate_data)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    async def test_register_invalid_email(self, client, test_user_data):
        """Test registration fails with invalid email format."""
        invalid_data = {**test_user_data, "email": "not-an-email"}
        response = await client.post("/api/v1/register", json=invalid_data)
        assert response.status_code == 422  # Validation error
    
    async def test_register_short_password(self, client, test_user_data):
        """Test registration fails with password too short."""
        invalid_data = {**test_user_data, "password": "short"}
        response = await client.post("/api/v1/register", json=invalid_data)
        assert response.status_code == 422  # Validation error


class TestLogin:
    """Tests for POST /api/v1/login endpoint."""
    
    async def test_login_success(self, client, test_user_data):
        """Test successful login returns token."""
        # Register user first
        await client.post("/api/v1/register", json=test_user_data)
        
        # Login
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        response = await client.post("/api/v1/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "expires_at" in data
    
    async def test_login_wrong_password(self, client, test_user_data):
        """Test login fails with wrong password."""
        # Register user first
        await client.post("/api/v1/register", json=test_user_data)
        
        # Try to login with wrong password
        login_data = {
            "username": test_user_data["username"],
            "password": "wrongpassword"
        }
        response = await client.post("/api/v1/login", json=login_data)
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    async def test_login_nonexistent_user(self, client):
        """Test login fails for non-existent user."""
        login_data = {
            "username": "nonexistent",
            "password": "somepassword"
        }
        response = await client.post("/api/v1/login", json=login_data)
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    async def test_login_failure_identical_for_real_and_fake_user(self, client, test_user_data):
        """Wrong password and unknown username return the same status and message."""
        await client.post("/api/v1/register", json=test_user_data)

        wrong_pw = await client.post("/api/v1/login", json={
            "username": test_user_data["username"], "password": "wrongpassword"
        })
        unknown = await client.post("/api/v1/login", json={
            "username": "no_such_user", "password": "wrongpassword"
        })
        assert wrong_pw.status_code == unknown.status_code == 401
        assert wrong_pw.json()["detail"] == unknown.json()["detail"]

    async def test_lockout_applies_to_nonexistent_user(self, client):
        """A nonexistent username also gets locked out, so a 429 can't confirm an account exists."""
        creds = {"username": "ghost_lockout_user", "password": "wrongpassword"}
        for _ in range(5):
            resp = await client.post("/api/v1/login", json=creds)
            assert resp.status_code == 401
        # 6th attempt is now rate-limited just like a real account would be
        resp = await client.post("/api/v1/login", json=creds)
        assert resp.status_code == 429


class TestMe:
    """Tests for GET /api/v1/me endpoint."""
    
    async def test_me_authenticated(self, client, test_user_data):
        """Test /me returns user data when authenticated."""
        # Register and login
        await client.post("/api/v1/register", json=test_user_data)
        login_response = await client.post("/api/v1/login", json={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["token"]
        
        # Call /me with token
        response = await client.get(
            "/api/v1/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
    
    async def test_me_no_token(self, client):
        """Test /me fails without auth token."""
        response = await client.get("/api/v1/me")
        assert response.status_code in [401, 403]  # Either is valid for missing auth
    
    async def test_me_invalid_token(self, client):
        """Test /me fails with invalid token."""
        response = await client.get(
            "/api/v1/me",
            headers={"Authorization": "Bearer invalid-token-here"}
        )
        assert response.status_code == 401  # Invalid token returns 401


class TestCookieAuth:
    """Tests for HttpOnly cookie authentication and double-submit CSRF protection."""

    async def _register_and_login(self, client, test_user_data):
        await client.post("/api/v1/register", json=test_user_data)
        return await client.post("/api/v1/login", json={
            "username": test_user_data["username"],
            "password": test_user_data["password"],
        })

    async def test_login_sets_auth_cookies(self, client, test_user_data):
        """Login sets an HttpOnly access_token cookie and a readable csrf_token cookie."""
        response = await self._register_and_login(client, test_user_data)
        assert response.status_code == 200
        assert response.cookies.get("access_token") is not None
        assert response.cookies.get("csrf_token") is not None
        # The access token cookie must be HttpOnly so JS can't read it.
        set_cookie = " ".join(response.headers.get_list("set-cookie"))
        assert "HttpOnly" in set_cookie

    async def test_me_via_cookie_without_bearer(self, client, test_user_data):
        """Authentication works from the cookie jar with no Authorization header."""
        await self._register_and_login(client, test_user_data)
        response = await client.get("/api/v1/me")  # no Authorization header
        assert response.status_code == 200
        assert response.json()["username"] == test_user_data["username"]

    async def test_unsafe_request_without_csrf_rejected(self, client, test_user_data):
        """A cookie-authenticated state change without an X-CSRF-Token is blocked."""
        await self._register_and_login(client, test_user_data)
        response = await client.post("/api/v1/logout")  # cookie present, no CSRF header
        assert response.status_code == 403
        assert "csrf" in response.json()["detail"].lower()

    async def test_unsafe_request_with_csrf_succeeds_and_clears_cookies(self, client, test_user_data):
        """A valid X-CSRF-Token allows the state change; logout clears the cookies."""
        await self._register_and_login(client, test_user_data)
        csrf = client.cookies.get("csrf_token")
        response = await client.post("/api/v1/logout", headers={"X-CSRF-Token": csrf})
        assert response.status_code == 204
        # Cookies cleared -> subsequent cookie-auth request is unauthorized.
        me = await client.get("/api/v1/me")
        assert me.status_code in [401, 403]
