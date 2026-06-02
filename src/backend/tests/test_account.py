# backend/tests/test_account.py
"""
Tests for account management: set/change password, OAuth connections, and
passwordless (OAuth-only) account deletion.
"""
import pytest
import pytest_asyncio

from app.api.v1.core import security
from app.api.v1.models.user import User
from app.api.v1.models.user_oauth_account import UserOAuthAccount

pytestmark = pytest.mark.asyncio


def _bearer(db, user):
    return {"Authorization": f"Bearer {security.create_token(db, user.id).token}"}


def _oauth_user(db, username, email, password=None, provider="google", pid="x1"):
    user = User(
        username=username,
        email=email,
        hashed_password=security.get_password_hash(password) if password else None,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    if provider:
        db.add(UserOAuthAccount(user_id=user.id, provider=provider, provider_account_id=pid))
        db.commit()
    return user


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


# --- password set/change --------------------------------------------------

async def test_change_password_wrong_current(client, auth_headers):
    res = await client.post("/api/v1/me/password", headers=auth_headers, json={
        "current_password": "totally-wrong-pass", "new_password": "newsecurepass123",
    })
    assert res.status_code == 400


async def test_change_password_success(client, auth_headers, test_user_data):
    res = await client.post("/api/v1/me/password", headers=auth_headers, json={
        "current_password": test_user_data["password"], "new_password": "brandnewpass456",
    })
    assert res.status_code == 204
    # The new password works for login.
    login = await client.post("/api/v1/login", json={
        "username": test_user_data["username"], "password": "brandnewpass456",
    })
    assert login.status_code == 200


async def test_passwordless_user_sets_first_password(client, db_session):
    user = _oauth_user(db_session, "oauthonly", "oo@example.com", password=None)
    res = await client.post("/api/v1/me/password", headers=_bearer(db_session, user), json={
        "new_password": "firstpassword123",
    })
    assert res.status_code == 204
    db_session.refresh(user)
    assert user.hashed_password is not None


# --- connections ----------------------------------------------------------

async def test_list_connections(client, db_session):
    user = _oauth_user(db_session, "connuser", "c@example.com", password=None, provider="google", pid="g1")
    res = await client.get("/api/v1/me/connections", headers=_bearer(db_session, user))
    assert res.status_code == 200
    body = res.json()
    assert body["providers"] == ["google"]
    assert body["has_password"] is False


async def test_unlink_last_method_blocked(client, db_session):
    user = _oauth_user(db_session, "lastm", "l@example.com", password=None, provider="google", pid="g2")
    res = await client.delete("/api/v1/me/connections/google", headers=_bearer(db_session, user))
    assert res.status_code == 400  # can't remove the only sign-in method


async def test_unlink_allowed_with_password(client, db_session):
    user = _oauth_user(db_session, "withpw", "w@example.com", password="securepassword123", provider="github", pid="gh1")
    res = await client.delete("/api/v1/me/connections/github", headers=_bearer(db_session, user))
    assert res.status_code == 204
    assert db_session.query(UserOAuthAccount).filter_by(user_id=user.id).count() == 0


# --- passwordless deletion ------------------------------------------------

async def test_passwordless_account_deletion(client, db_session):
    user = _oauth_user(db_session, "delme", "d@example.com", password=None, provider="google", pid="g3")
    user_id = user.id
    res = await client.request("DELETE", "/api/v1/me", headers=_bearer(db_session, user), json={"password": ""})
    assert res.status_code == 204
    assert db_session.query(User).filter_by(id=user_id).first() is None
    assert db_session.query(UserOAuthAccount).filter_by(user_id=user_id).count() == 0
