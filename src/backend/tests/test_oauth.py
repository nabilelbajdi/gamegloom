# backend/tests/test_oauth.py
"""
Tests for OAuth social login.

The full provider round-trip (Authlib code exchange) needs a live provider, so
these focus on the parts we own: the find-or-create/linking service and the
config-gated endpoints. With no provider credentials set under pytest, the
feature is dormant — endpoints 404 and /auth/providers is empty.
"""
import pytest

from app.api.v1.core import oauth_service, security
from app.api.v1.models.user import User
from app.api.v1.models.user_oauth_account import UserOAuthAccount


def _make_password_user(db, username="bob", email="bob@example.com"):
    user = User(
        username=username,
        email=email,
        hashed_password=security.get_password_hash("securepassword123"),
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# --- find_or_create_user --------------------------------------------------

def test_creates_new_passwordless_user(db_session):
    user = oauth_service.find_or_create_user(
        db_session,
        provider="google",
        provider_account_id="g-new-1",
        email="carol@example.com",
        email_verified=True,
        display_name="Carol",
    )
    assert user.id is not None
    assert user.email == "carol@example.com"
    assert user.hashed_password is None  # passwordless
    assert user.is_verified is True
    # An oauth link row was created.
    link = db_session.query(UserOAuthAccount).filter_by(provider="google", provider_account_id="g-new-1").first()
    assert link is not None and link.user_id == user.id


def test_links_to_existing_user_by_verified_email(db_session):
    existing = _make_password_user(db_session, username="bob", email="bob@example.com")
    user = oauth_service.find_or_create_user(
        db_session,
        provider="google",
        provider_account_id="g-bob-1",
        email="bob@example.com",
        email_verified=True,
        display_name="Bob",
    )
    assert user.id == existing.id  # same account
    assert user.hashed_password is not None  # password preserved
    assert db_session.query(UserOAuthAccount).filter_by(user_id=existing.id).count() == 1


def test_returning_identity_returns_same_user(db_session):
    first = oauth_service.find_or_create_user(
        db_session, provider="google", provider_account_id="g-return-1",
        email="dave@example.com", email_verified=True, display_name="Dave",
    )
    again = oauth_service.find_or_create_user(
        db_session, provider="google", provider_account_id="g-return-1",
        email="dave@example.com", email_verified=True, display_name="Dave",
    )
    assert again.id == first.id
    # No duplicate link row.
    assert db_session.query(UserOAuthAccount).filter_by(provider_account_id="g-return-1").count() == 1


def test_username_is_deduplicated(db_session):
    _make_password_user(db_session, username="alice", email="alice@other.com")
    user = oauth_service.find_or_create_user(
        db_session, provider="google", provider_account_id="g-alice-1",
        email="alice@example.com", email_verified=True, display_name="Alice",
    )
    assert user.username != "alice"
    assert user.username.startswith("alice_")


def test_unverified_email_is_rejected(db_session):
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        oauth_service.find_or_create_user(
            db_session, provider="google", provider_account_id="g-unv-1",
            email="eve@example.com", email_verified=False, display_name="Eve",
        )
    assert exc.value.status_code == 400


def test_missing_email_is_rejected(db_session):
    from fastapi import HTTPException
    with pytest.raises(HTTPException):
        oauth_service.find_or_create_user(
            db_session, provider="google", provider_account_id="g-noemail-1",
            email=None, email_verified=True, display_name=None,
        )


# --- endpoints ------------------------------------------------------------
# These stay independent of whether real provider credentials happen to be set
# in the environment running the suite.

@pytest.mark.asyncio
async def test_providers_endpoint_returns_known_list(client):
    res = await client.get("/api/v1/auth/providers")
    assert res.status_code == 200
    providers = res.json()["providers"]
    assert isinstance(providers, list)
    assert set(providers).issubset({"google", "github"})


@pytest.mark.asyncio
async def test_login_404_for_unknown_provider(client):
    # An unregistered provider name is always disabled, regardless of config.
    res = await client.get("/api/v1/auth/nonexistent/login")
    assert res.status_code == 404


# --- GitHub identity extraction (the /user/emails private-email handling) ---

class _FakeResp:
    def __init__(self, data):
        self._data = data

    def json(self):
        return self._data


class _FakeGitHubClient:
    """Stand-in for the Authlib GitHub client's async .get()."""
    def __init__(self, profile, emails):
        self._profile = profile
        self._emails = emails

    async def get(self, path, token=None):
        if path == "user":
            return _FakeResp(self._profile)
        if path == "user/emails":
            return _FakeResp(self._emails)
        raise AssertionError(f"unexpected path {path}")


@pytest.mark.asyncio
async def test_github_extracts_verified_primary_email():
    from app.api.v1.routers.oauth import _extract_identity
    client = _FakeGitHubClient(
        profile={"id": 123, "login": "octocat", "name": "The Octocat"},
        emails=[
            {"email": "secondary@example.com", "primary": False, "verified": True},
            {"email": "octo@example.com", "primary": True, "verified": True},
            {"email": "old@example.com", "primary": False, "verified": False},
        ],
    )
    identity = await _extract_identity("github", client, token={"access_token": "x"})
    assert identity["provider_account_id"] == "123"
    assert identity["email"] == "octo@example.com"
    assert identity["email_verified"] is True
    assert identity["display_name"] == "The Octocat"


@pytest.mark.asyncio
async def test_github_no_verified_primary_yields_no_email():
    from app.api.v1.routers.oauth import _extract_identity
    client = _FakeGitHubClient(
        profile={"id": 9, "login": "ghost", "name": None},
        emails=[{"email": "hidden@example.com", "primary": True, "verified": False}],
    )
    identity = await _extract_identity("github", client, token={})
    assert identity["email"] is None
    assert identity["email_verified"] is False
    assert identity["display_name"] == "ghost"  # falls back to login when name is null
