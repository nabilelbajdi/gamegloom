# core/auth.py
from datetime import datetime, timedelta, UTC
import hmac
import secrets
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import bcrypt

from ..models.token import Token
from ..models.user import User
from ...db_setup import get_db
from ...settings import settings

# Cookie + CSRF constants. The auth token lives in ACCESS_COOKIE (HttpOnly); the
# matching CSRF value lives in CSRF_COOKIE (JS-readable) for double-submit checks.
ACCESS_COOKIE = "access_token"
CSRF_COOKIE = "csrf_token"
UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def _extract_bearer(request: Request) -> str | None:
    """Pull the token out of an 'Authorization: Bearer <token>' header, if present."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def get_token_from_request(request: Request) -> str | None:
    """Auth token from the HttpOnly cookie, falling back to the Authorization header."""
    return request.cookies.get(ACCESS_COOKIE) or _extract_bearer(request)


def generate_csrf_token() -> str:
    """Generate a random value for the double-submit CSRF cookie/header pair."""
    return secrets.token_urlsafe(32)


def _cookie_kwargs() -> dict:
    """Shared cookie attributes derived from settings (Secure/SameSite/Domain)."""
    kwargs = {"secure": settings.COOKIE_SECURE, "samesite": settings.COOKIE_SAMESITE, "path": "/"}
    if settings.COOKIE_DOMAIN:
        kwargs["domain"] = settings.COOKIE_DOMAIN
    return kwargs


def set_auth_cookies(response: Response, token: str, csrf_value: str, max_age: int = 7 * 24 * 3600) -> None:
    """Set the HttpOnly auth cookie plus the JS-readable CSRF cookie."""
    common = _cookie_kwargs()
    response.set_cookie(ACCESS_COOKIE, token, httponly=True, max_age=max_age, **common)
    response.set_cookie(CSRF_COOKIE, csrf_value, httponly=False, max_age=max_age, **common)


def clear_auth_cookies(response: Response) -> None:
    """Remove both auth cookies on logout / account deletion."""
    domain = settings.COOKIE_DOMAIN or None
    response.delete_cookie(ACCESS_COOKIE, path="/", domain=domain)
    response.delete_cookie(CSRF_COOKIE, path="/", domain=domain)


async def csrf_protect_middleware(request: Request, call_next):
    """Double-submit CSRF check for cookie-authenticated state-changing requests.

    Only fires on unsafe methods when the auth cookie is present and no Authorization
    header is sent. Header auth (tests, API tooling) can't be forged cross-site, and
    unauthenticated requests carry no cookie, so both are exempt.
    """
    if (
        request.method in UNSAFE_METHODS
        and request.cookies.get(ACCESS_COOKIE)
        and not request.headers.get("Authorization")
    ):
        header = request.headers.get("X-CSRF-Token", "")
        cookie = request.cookies.get(CSRF_COOKIE, "")
        if not header or not cookie or not hmac.compare_digest(header, cookie):
            return JSONResponse(status_code=403, content={"detail": "CSRF token missing or invalid"})
    return await call_next(request)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    # Truncate to 72 bytes for bcrypt compatibility and encode
    password_bytes = plain_password[:72].encode('utf-8')
    try:
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    # Truncate to 72 bytes for bcrypt compatibility and encode
    password_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def generate_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)

def create_token(db: Session, user_id: int) -> Token:
    """Create a new token for a user."""
    token_str = generate_token()
    expires_at = datetime.now(UTC) + timedelta(days=7)
    
    db_token = Token(
        token=token_str,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def get_user_by_token(db: Session, token: str) -> User | None:
    """Get user by token if valid."""
    db_token = db.query(Token).filter(
        Token.token == token,
        Token.expires_at > datetime.now(UTC)
    ).first()
    
    if not db_token:
        return None
        
    return db.query(User).filter(User.id == db_token.user_id).first()

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current user from the auth cookie or Authorization header."""
    token = get_token_from_request(request)
    user = get_user_by_token(db, token) if token else None

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return user

async def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> User | None:
    """Dependency to get current user from token, or None if no valid token."""
    token = get_token_from_request(request)
    if not token:
        return None

    return get_user_by_token(db, token)