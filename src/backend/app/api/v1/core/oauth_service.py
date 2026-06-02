# core/oauth_service.py
"""
Maps an external OAuth identity onto a local user account:

1. Known (provider, provider_account_id) -> that user.
2. Verified provider email matching an existing user -> link and return it.
3. Otherwise create a new passwordless user with a generated unique username.
"""
import re
import secrets
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.user_oauth_account import UserOAuthAccount

logger = logging.getLogger(__name__)


def _slugify_username(seed: str) -> str:
    """Turn an email local-part or display name into a valid username base."""
    base = re.sub(r"[^a-zA-Z0-9_]", "", (seed or "").replace(" ", "_")).lower()
    base = base[:30] or "user"
    return base


def _unique_username(db: Session, seed: str) -> str:
    """A username derived from seed, suffixed until it's free (max 50 chars)."""
    base = _slugify_username(seed)
    if not db.query(User.id).filter(User.username == base).first():
        return base
    for _ in range(50):
        suffix = secrets.token_hex(3)  # 6 hex chars
        candidate = f"{base[:43]}_{suffix}"
        if not db.query(User.id).filter(User.username == candidate).first():
            return candidate
    raise HTTPException(status_code=500, detail="Could not allocate a username")


def link_provider(db: Session, user_id: int, provider: str, provider_account_id: str) -> str:
    """Attach an OAuth identity to an already-authenticated user.

    Returns "linked" (newly attached), "already_linked" (this same user already
    has it), or "conflict" (the identity belongs to a different account).
    """
    existing = (
        db.query(UserOAuthAccount)
        .filter(
            UserOAuthAccount.provider == provider,
            UserOAuthAccount.provider_account_id == provider_account_id,
        )
        .first()
    )
    if existing:
        return "already_linked" if existing.user_id == user_id else "conflict"

    db.add(UserOAuthAccount(user_id=user_id, provider=provider, provider_account_id=provider_account_id))
    db.commit()
    return "linked"


def find_or_create_user(
    db: Session,
    *,
    provider: str,
    provider_account_id: str,
    email: str | None,
    email_verified: bool,
    display_name: str | None,
) -> User:
    """Resolve an OAuth identity to a local user, creating or linking as needed."""
    # 1. Returning identity we've seen before.
    link = (
        db.query(UserOAuthAccount)
        .filter(
            UserOAuthAccount.provider == provider,
            UserOAuthAccount.provider_account_id == provider_account_id,
        )
        .first()
    )
    if link:
        return db.query(User).filter(User.id == link.user_id).first()

    # We need a trustworthy email to create or link an account.
    if not email or not email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your provider account has no verified email to sign in with.",
        )

    # 2. Auto-link to an existing account with the same (verified) email.
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.add(UserOAuthAccount(
            user_id=existing.id,
            provider=provider,
            provider_account_id=provider_account_id,
        ))
        db.commit()
        logger.info(f"Linked {provider} identity to existing user {existing.id}")
        return existing

    # 3. Brand new user — passwordless, email already verified by the provider.
    seed = email.split("@")[0] if email else (display_name or "user")
    user = User(
        username=_unique_username(db, seed),
        email=email,
        hashed_password=None,
        is_verified=True,
    )
    db.add(user)
    db.flush()  # assign user.id without a second round-trip
    db.add(UserOAuthAccount(
        user_id=user.id,
        provider=provider,
        provider_account_id=provider_account_id,
    ))
    db.commit()
    db.refresh(user)
    logger.info(f"Created new user {user.id} via {provider}")
    return user
