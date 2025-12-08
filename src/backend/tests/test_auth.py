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
