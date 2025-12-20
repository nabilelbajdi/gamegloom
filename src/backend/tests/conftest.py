# backend/tests/conftest.py
"""
Test configuration and fixtures for FastAPI backend tests.
Uses SQLite in-memory database for test isolation.
"""
import sys
from pathlib import Path

# Add parent directories to path for imports to work from any location
backend_dir = Path(__file__).parent.parent
src_dir = backend_dir.parent
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
import pytest_asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from app.api.db_setup import Base, get_db
from app.api.v1.routers.games import router as games_router
from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.user_games import router as user_games_router

# Import models to ensure SQLAlchemy can resolve relationships
from app.api.v1.models.user_platform_link import UserPlatformLink  # noqa: F401

# Create a minimal test app (avoids importing scheduler from main.py)
test_app = FastAPI()
test_app.include_router(auth_router, prefix="/api/v1")
test_app.include_router(games_router, prefix="/api/v1")
test_app.include_router(user_games_router, prefix="/api/v1")

# Create test database engine (SQLite in-memory)
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=test_engine, expire_on_commit=False)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def override_get_db(db_session):
    """Override the get_db dependency to use test database."""
    def _override():
        try:
            yield db_session
        finally:
            pass
    return _override


@pytest_asyncio.fixture
async def client(override_get_db):
    """Create async test client with database override."""
    test_app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test"
    ) as ac:
        yield ac
    test_app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Sample user data for registration tests."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword123"
    }
