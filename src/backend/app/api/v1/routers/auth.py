# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Response, Request
import csv
import io
import zipfile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, and_, desc, union_all, select
from datetime import datetime, timedelta, UTC
from typing import List
import uuid
import secrets
import os
import shutil
import threading
from pathlib import Path
from PIL import Image
import io
import logging

from ..core import schemas, security
from ..core.rate_limit import limiter
from ..core.email_service import send_password_reset_email, send_verification_email
from ..models.user import User
from ..models.email_verification import EmailVerification
from ..models.user_game import UserGame, GameStatus
from ..models.review import Review, ReviewLike, ReviewComment
from ..models.user_list import UserList, ListLike, user_list_games
from ..models.user_platform_link import UserPlatformLink
from ..models.user_platform_game import UserPlatformGame
from ..models.user_psn_preference import UserPsnPreference
from ..models.game import Game
from ..models.password_reset_token import PasswordResetToken
from ..models.token import Token
from ..models.user_oauth_account import UserOAuthAccount
from ...db_setup import get_db
from ...settings import settings

# Configure logger
logger = logging.getLogger(__name__)

_MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"RIFF": "image/webp",  # checked further below
}

def _detect_image_type(data: bytes) -> str | None:
    """Return MIME type from magic bytes, or None if unrecognised."""
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    for magic, mime in _MAGIC_BYTES.items():
        if magic == b"RIFF":
            continue
        if data[:len(magic)] == magic:
            return mime
    return None


# Brute-force protection: track failed login attempts per username
# {username: {"count": int, "locked_until": datetime | None}}
_login_attempts: dict = {}
_attempts_lock = threading.Lock()
_MAX_LOGIN_ATTEMPTS = 5
_LOCKOUT_MINUTES = 15

# A throwaway hash used to verify against when no user is found, so a failed
# login takes the same time whether or not the username exists (anti-enumeration).
_DUMMY_PASSWORD_HASH = security.get_password_hash(secrets.token_urlsafe(32))

# Reject avatar uploads above 5 MB to bound memory/Cloudinary usage.
_MAX_AVATAR_BYTES = 5 * 1024 * 1024

router = APIRouter(tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse)
@limiter.limit("5/minute")
async def register(request: Request, user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=security.get_password_hash(user_data.password),
            is_verified=settings.SKIP_EMAIL_VERIFICATION,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        if not settings.SKIP_EMAIL_VERIFICATION:
            token_str = secrets.token_urlsafe(32)
            verification = EmailVerification(
                token=token_str,
                user_id=db_user.id,
                expires_at=datetime.now(UTC) + timedelta(hours=24),
            )
            db.add(verification)
            db.commit()

            verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token_str}"
            send_verification_email(db_user.email, verify_url)

        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

@router.post("/login", response_model=schemas.TokenResponse)
async def login(credentials: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    """Login and get an access token. Also sets the auth token as an HttpOnly cookie."""
    now = datetime.now(UTC).replace(tzinfo=None)

    # Check lockout before hitting the DB
    with _attempts_lock:
        attempt_data = _login_attempts.get(credentials.username)
        if attempt_data and attempt_data.get("locked_until"):
            if now < attempt_data["locked_until"]:
                remaining = max(1, int((attempt_data["locked_until"] - now).total_seconds() / 60) + 1)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many failed attempts. Try again in {remaining} minute(s)."
                )
            else:
                _login_attempts.pop(credentials.username, None)

    user = db.query(User).filter(User.username == credentials.username).first()
    # Always run one password verification (a dummy hash when the user is missing
    # or has no password) so the response time can't reveal whether the account exists.
    stored_hash = user.hashed_password if user and user.hashed_password else _DUMMY_PASSWORD_HASH
    password_ok = security.verify_password(credentials.password, stored_hash)

    if not user or not password_ok:
        # Track failures for every username, real or not, so the lockout/429 response
        # is identical regardless of whether the account exists (anti-enumeration).
        with _attempts_lock:
            data = _login_attempts.setdefault(credentials.username, {"count": 0, "locked_until": None})
            data["count"] += 1
            just_locked = data["count"] >= _MAX_LOGIN_ATTEMPTS
            if just_locked:
                data["locked_until"] = now + timedelta(minutes=_LOCKOUT_MINUTES)
                logger.warning(f"Account locked after {_MAX_LOGIN_ATTEMPTS} failed attempts: {credentials.username}")
        if just_locked:
            # Surface the lockout on the attempt that triggers it, not the next one.
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed attempts. Try again in {_LOCKOUT_MINUTES} minute(s)."
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Success - clear any failed attempt history
    with _attempts_lock:
        _login_attempts.pop(credentials.username, None)

    token = security.create_token(db, user.id)
    # Set the token in an HttpOnly cookie + a readable CSRF cookie. The token is
    # still returned in the body for backward compatibility during the migration.
    csrf_value = security.generate_csrf_token()
    security.set_auth_cookies(response, token.token, csrf_value)
    return token

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user: User = Depends(security.get_current_user)):
    """Test endpoint to verify authentication."""
    return current_user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Revoke the current auth token and clear the auth cookies. Idempotent: returns 204 whether the token existed or not."""
    token = security.get_token_from_request(request)
    if token:
        db.query(Token).filter(Token.token == token).delete()
        db.commit()
    security.clear_auth_cookies(response)

def _iso(dt):
    """ISO 8601 string, or empty string if None."""
    return dt.isoformat() if dt else ""


def _csv_bytes(fieldnames: list[str], rows: list[dict]) -> str:
    """Render a list of dicts to a CSV string with the given header order."""
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


@router.get("/me/export")
async def export_user_data(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    """Export the user's data as a ZIP of CSVs (GDPR Art. 20)."""
    user_id = current_user.id

    library = (
        db.query(UserGame, Game)
        .join(Game, UserGame.game_id == Game.id)
        .filter(UserGame.user_id == user_id)
        .all()
    )
    reviews = (
        db.query(Review, Game)
        .join(Game, Review.game_id == Game.id)
        .filter(Review.user_id == user_id)
        .all()
    )
    review_comments = (
        db.query(ReviewComment, Review, Game, User)
        .join(Review, ReviewComment.review_id == Review.id)
        .join(Game, Review.game_id == Game.id)
        .join(User, Review.user_id == User.id)
        .filter(ReviewComment.user_id == user_id)
        .all()
    )
    review_likes = (
        db.query(ReviewLike, Review, Game, User)
        .join(Review, ReviewLike.review_id == Review.id)
        .join(Game, Review.game_id == Game.id)
        .join(User, Review.user_id == User.id)
        .filter(ReviewLike.user_id == user_id)
        .all()
    )
    lists = db.query(UserList).filter(UserList.user_id == user_id).all()
    list_likes = (
        db.query(ListLike, UserList, User)
        .join(UserList, ListLike.list_id == UserList.id)
        .join(User, UserList.user_id == User.id)
        .filter(ListLike.user_id == user_id)
        .all()
    )
    platform_links = db.query(UserPlatformLink).filter(UserPlatformLink.user_id == user_id).all()

    today = datetime.now(UTC).strftime("%Y-%m-%d")

    profile_csv = _csv_bytes(
        ["field", "value"],
        [
            {"field": "username", "value": current_user.username},
            {"field": "email", "value": current_user.email},
            {"field": "bio", "value": current_user.bio or ""},
            {"field": "avatar", "value": current_user.avatar or ""},
            {"field": "is_verified", "value": current_user.is_verified},
            {"field": "created_at", "value": _iso(current_user.created_at)},
            {"field": "updated_at", "value": _iso(current_user.updated_at)},
            {"field": "exported_at", "value": datetime.now(UTC).isoformat()},
        ],
    )

    library_csv = _csv_bytes(
        ["game", "igdb_id", "status", "added_at", "updated_at"],
        [
            {
                "game": game.name,
                "igdb_id": game.igdb_id,
                "status": ug.status.value if ug.status else "",
                "added_at": _iso(ug.added_at),
                "updated_at": _iso(ug.updated_at),
            }
            for ug, game in library
        ],
    )

    reviews_csv = _csv_bytes(
        [
            "game", "igdb_id", "rating", "content", "platform",
            "playtime_hours", "completion_status", "recommended",
            "story_rating", "gameplay_rating", "visuals_rating",
            "audio_rating", "performance_rating",
            "created_at", "updated_at",
        ],
        [
            {
                "game": game.name,
                "igdb_id": game.igdb_id,
                "rating": r.rating,
                "content": r.content or "",
                "platform": r.platform or "",
                "playtime_hours": r.playtime_hours if r.playtime_hours is not None else "",
                "completion_status": r.completion_status or "",
                "recommended": r.recommended if r.recommended is not None else "",
                "story_rating": r.story_rating if r.story_rating is not None else "",
                "gameplay_rating": r.gameplay_rating if r.gameplay_rating is not None else "",
                "visuals_rating": r.visuals_rating if r.visuals_rating is not None else "",
                "audio_rating": r.audio_rating if r.audio_rating is not None else "",
                "performance_rating": r.performance_rating if r.performance_rating is not None else "",
                "created_at": _iso(r.created_at),
                "updated_at": _iso(r.updated_at),
            }
            for r, game in reviews
        ],
    )

    review_comments_csv = _csv_bytes(
        ["on_review_of_game", "review_author", "content", "created_at", "updated_at"],
        [
            {
                "on_review_of_game": game.name,
                "review_author": author.username,
                "content": c.content,
                "created_at": _iso(c.created_at),
                "updated_at": _iso(c.updated_at),
            }
            for c, r, game, author in review_comments
        ],
    )

    review_likes_csv = _csv_bytes(
        ["on_review_of_game", "review_author", "liked_at"],
        [
            {
                "on_review_of_game": game.name,
                "review_author": author.username,
                "liked_at": _iso(l.created_at),
            }
            for l, r, game, author in review_likes
        ],
    )

    lists_csv = _csv_bytes(
        ["name", "description", "is_public", "game_count", "created_at", "updated_at"],
        [
            {
                "name": ul.name,
                "description": ul.description or "",
                "is_public": ul.is_public,
                "game_count": len(ul.games),
                "created_at": _iso(ul.created_at),
                "updated_at": _iso(ul.updated_at),
            }
            for ul in lists
        ],
    )

    list_games_csv = _csv_bytes(
        ["list_name", "game", "igdb_id"],
        [
            {"list_name": ul.name, "game": g.name, "igdb_id": g.igdb_id}
            for ul in lists
            for g in ul.games
        ],
    )

    list_likes_csv = _csv_bytes(
        ["list_name", "list_owner", "liked_at"],
        [
            {
                "list_name": ul.name,
                "list_owner": owner.username,
                "liked_at": _iso(l.created_at),
            }
            for l, ul, owner in list_likes
        ],
    )

    platform_links_csv = _csv_bytes(
        ["platform", "platform_user_id", "platform_username", "linked_at", "last_synced_at"],
        [
            {
                "platform": pl.platform,
                "platform_user_id": pl.platform_user_id,
                "platform_username": pl.platform_username or "",
                "linked_at": _iso(pl.created_at),
                "last_synced_at": _iso(pl.last_synced_at),
            }
            for pl in platform_links
        ],
    )

    readme = (
        f"GameGloom data export for {current_user.username}\n"
        f"Exported: {datetime.now(UTC).isoformat()}\n\n"
        "Files in this archive:\n"
        "  profile.csv         - your account profile\n"
        "  library.csv         - games you're tracking and their status\n"
        "  reviews.csv         - reviews you've written\n"
        "  review-comments.csv - comments you've posted on reviews\n"
        "  review-likes.csv    - reviews you've liked\n"
        "  lists.csv           - lists you've created\n"
        "  list-games.csv      - the games in each of your lists\n"
        "  list-likes.csv      - lists you've liked\n"
        "  platform-links.csv  - your linked Steam/PlayStation accounts\n\n"
        "All timestamps are in UTC, ISO 8601 format.\n"
    )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("README.txt", readme)
        zf.writestr("profile.csv", profile_csv)
        zf.writestr("library.csv", library_csv)
        zf.writestr("reviews.csv", reviews_csv)
        zf.writestr("review-comments.csv", review_comments_csv)
        zf.writestr("review-likes.csv", review_likes_csv)
        zf.writestr("lists.csv", lists_csv)
        zf.writestr("list-games.csv", list_games_csv)
        zf.writestr("list-likes.csv", list_likes_csv)
        zf.writestr("platform-links.csv", platform_links_csv)

    return Response(
        content=buf.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="gamegloom-export-{today}.zip"'},
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    request: schemas.DeleteAccountRequest,
    response: Response,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete the current user's account and all associated data."""
    # Password-based accounts must confirm with their password. OAuth-only
    # accounts have no password, so confirmation is skipped (they got here via a
    # valid session already).
    if current_user.hashed_password:
        if not security.verify_password(request.password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password",
            )

    user_id = current_user.id
    avatar_url = current_user.avatar

    # Detach so the ORM does not try to null backref FKs on related rows during commit.
    db.expunge(current_user)
    db.expire_all()

    # Auth + verification rows
    db.query(Token).filter(Token.user_id == user_id).delete(synchronize_session=False)
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_id).delete(synchronize_session=False)
    db.query(EmailVerification).filter(EmailVerification.user_id == user_id).delete(synchronize_session=False)
    db.query(UserOAuthAccount).filter(UserOAuthAccount.user_id == user_id).delete(synchronize_session=False)

    # Lists: likes the user gave, then their owned lists (clearing likes-on-them + association rows first)
    db.query(ListLike).filter(ListLike.user_id == user_id).delete(synchronize_session=False)
    owned_list_ids = [lid for (lid,) in db.query(UserList.id).filter(UserList.user_id == user_id).all()]
    if owned_list_ids:
        db.query(ListLike).filter(ListLike.list_id.in_(owned_list_ids)).delete(synchronize_session=False)
        db.execute(user_list_games.delete().where(user_list_games.c.user_list_id.in_(owned_list_ids)))
        db.query(UserList).filter(UserList.id.in_(owned_list_ids)).delete(synchronize_session=False)

    # Reviews: likes/comments the user gave, then likes/comments ON their reviews, then the reviews
    db.query(ReviewLike).filter(ReviewLike.user_id == user_id).delete(synchronize_session=False)
    db.query(ReviewComment).filter(ReviewComment.user_id == user_id).delete(synchronize_session=False)
    user_review_ids = [rid for (rid,) in db.query(Review.id).filter(Review.user_id == user_id).all()]
    if user_review_ids:
        db.query(ReviewLike).filter(ReviewLike.review_id.in_(user_review_ids)).delete(synchronize_session=False)
        db.query(ReviewComment).filter(ReviewComment.review_id.in_(user_review_ids)).delete(synchronize_session=False)
    db.query(Review).filter(Review.user_id == user_id).delete(synchronize_session=False)

    # Library + platform data
    db.query(UserGame).filter(UserGame.user_id == user_id).delete(synchronize_session=False)
    db.query(UserPlatformLink).filter(UserPlatformLink.user_id == user_id).delete(synchronize_session=False)
    db.query(UserPsnPreference).filter(UserPsnPreference.user_id == user_id).delete(synchronize_session=False)
    db.query(UserPlatformGame).filter(UserPlatformGame.user_id == user_id).delete(synchronize_session=False)

    # Best-effort avatar removal from Cloudinary
    if avatar_url and "cloudinary.com" in avatar_url and settings.CLOUDINARY_CLOUD_NAME:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
            )
            public_id = "/".join(
                avatar_url.split("/")[-3:-1] + [avatar_url.split("/")[-1].rsplit(".", 1)[0]]
            )
            cloudinary.uploader.destroy(public_id)
        except Exception as e:
            logger.warning(f"Could not delete Cloudinary avatar for user {user_id}: {e}")

    db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
    db.commit()
    security.clear_auth_cookies(response)
    logger.info(f"Account deleted: user_id={user_id}")


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: schemas.ChangePasswordRequest,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    """Set a first password (OAuth-only users) or change an existing one.

    When the account already has a password, the correct current password must
    be supplied. Passwordless accounts can set one without it.
    """
    if current_user.hashed_password:
        if not payload.current_password or not security.verify_password(
            payload.current_password, current_user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

    current_user.hashed_password = security.get_password_hash(payload.new_password)
    db.commit()


@router.patch("/me/profile", response_model=schemas.UserResponse)
async def update_user_profile(
    profile_data: schemas.UserProfileUpdate,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile information."""
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=schemas.UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a new avatar image for the current user."""
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files (JPEG, PNG, GIF, WEBP) are allowed"
        )

    # Reject obviously oversized uploads before reading anything into memory.
    if file.size is not None and file.size > _MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Avatar must be 5 MB or smaller"
        )

    try:
        # Read at most one byte past the limit so we can detect liars who under-report size.
        image_bytes = await file.read(_MAX_AVATAR_BYTES + 1)
        if len(image_bytes) > _MAX_AVATAR_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Avatar must be 5 MB or smaller"
            )

        actual_type = _detect_image_type(image_bytes)
        if actual_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files (JPEG, PNG, GIF, WEBP) are allowed"
            )

        image = Image.open(io.BytesIO(image_bytes))
        image.thumbnail((400, 400))

        buf = io.BytesIO()
        fmt = image.format or "JPEG"
        image.save(buf, format=fmt)
        buf.seek(0)

        if settings.CLOUDINARY_CLOUD_NAME:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
            )

            # Delete old Cloudinary avatar if present
            if current_user.avatar and "cloudinary.com" in current_user.avatar:
                try:
                    # public_id is stored as gamegloom/avatars/<uuid>
                    public_id = "/".join(current_user.avatar.split("/")[-3:-1] + [current_user.avatar.split("/")[-1].rsplit(".", 1)[0]])
                    cloudinary.uploader.destroy(public_id)
                except Exception as e:
                    logger.warning(f"Could not delete old Cloudinary avatar: {e}")

            result = cloudinary.uploader.upload(
                buf,
                folder="gamegloom/avatars",
                public_id=uuid.uuid4().hex,
                overwrite=True,
                resource_type="image",
            )
            avatar_url = result["secure_url"]
        else:
            # Local fallback for development
            avatars_dir = Path("frontend/public/images/avatars")
            os.makedirs(avatars_dir, exist_ok=True)
            file_extension = (file.filename or "avatar.jpg").rsplit(".", 1)[-1]
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            file_path = avatars_dir / unique_filename
            with open(file_path, "wb") as f:
                f.write(buf.read())

            if current_user.avatar and "/images/default-avatar.svg" not in current_user.avatar and "cloudinary.com" not in current_user.avatar:
                old_path = Path("frontend/public") / current_user.avatar.lstrip("/")
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except Exception as e:
                        logger.error(f"Error removing old avatar: {e}")

            avatar_url = f"/images/avatars/{unique_filename}"

        current_user.avatar = avatar_url
        db.commit()
        db.refresh(current_user)
        return current_user

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to upload avatar")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload avatar"
        )

@router.get("/users/stats", response_model=schemas.UserStats)
async def get_user_stats(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics for the current user."""
    # Count games by status
    game_counts = db.query(
        UserGame.status, 
        func.count(UserGame.id).label("count")
    ).filter(
        UserGame.user_id == current_user.id
    ).group_by(
        UserGame.status
    ).all()
    
    # Initialize with default values
    stats = {
        "total_games": 0,
        "want_to_play_count": 0,
        "playing_count": 0,
        "played_count": 0,
        "reviews_count": 0,
        "average_rating": None,
        "lists_count": 0
    }
    
    # Update with actual counts
    for status, count in game_counts:
        stats["total_games"] += count
        if status == GameStatus.WANT_TO_PLAY:
            stats["want_to_play_count"] = count
        elif status == GameStatus.PLAYING:
            stats["playing_count"] = count
        elif status == GameStatus.PLAYED:
            stats["played_count"] = count
    
    # Get review stats
    reviews_count = db.query(func.count(Review.id)).filter(
        Review.user_id == current_user.id
    ).scalar()
    
    stats["reviews_count"] = reviews_count
    
    # Get average rating if user has reviews
    if reviews_count > 0:
        avg_rating = db.query(func.avg(Review.rating)).filter(
            Review.user_id == current_user.id
        ).scalar()
        stats["average_rating"] = round(avg_rating, 1) if avg_rating else None
    
    return schemas.UserStats(**stats)

@router.get("/users/activities", response_model=schemas.UserActivityResponse)
async def get_user_activities(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activities for the current user."""
    activities = []
    
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    # User games with their statuses
    user_games = (
        db.query(UserGame, Game)
        .join(Game, UserGame.game_id == Game.id)
        .filter(
            UserGame.user_id == current_user.id,
            UserGame.added_at >= thirty_days_ago
        )
        .order_by(desc(UserGame.updated_at))
        .all()
    )
    
    # Add game status activities
    for user_game, game in user_games:
        activities.append(schemas.UserActivity(
            id=f"game_status_{user_game.id}_{user_game.updated_at.timestamp()}",
            activity_type=schemas.ActivityType.GAME_STATUS_UPDATED,
            timestamp=user_game.updated_at,
            game=schemas.ActivityGameInfo(
                id=game.id,
                igdb_id=game.igdb_id,
                name=game.name,
                slug=game.slug,
                cover_image=game.cover_image
            ),
            game_status=user_game.status.value
        ))
    
    # User reviews
    reviews_created = (
        db.query(Review, Game)
        .join(Game, Review.game_id == Game.id)
        .filter(
            Review.user_id == current_user.id,
            Review.created_at >= thirty_days_ago
        )
        .order_by(desc(Review.created_at))
        .limit(20)
        .all()
    )
    
    # Add review activities
    for review, game in reviews_created:
        activities.append(schemas.UserActivity(
            id=f"review_created_{review.id}",
            activity_type=schemas.ActivityType.REVIEW_CREATED,
            timestamp=review.created_at,
            game=schemas.ActivityGameInfo(
                id=game.id,
                igdb_id=game.igdb_id,
                name=game.name,
                slug=game.slug,
                cover_image=game.cover_image
            ),
            review=schemas.ActivityReviewInfo(
                id=review.id,
                rating=review.rating,
                content=review.content,
                game=None
            ),
            review_content=review.content[:100] + ('...' if review.content and len(review.content) > 100 else '') if review.content else None
        ))
    
    # User comments on reviews
    comments = (
        db.query(ReviewComment, Review, Game, User)
        .join(Review, ReviewComment.review_id == Review.id)
        .join(Game, Review.game_id == Game.id)
        .join(User, Review.user_id == User.id)
        .filter(
            ReviewComment.user_id == current_user.id,
            ReviewComment.created_at >= thirty_days_ago
        )
        .order_by(desc(ReviewComment.created_at))
        .limit(20)
        .all()
    )
    
    # Add comment activities
    for comment, review, game, review_user in comments:
        activities.append(schemas.UserActivity(
            id=f"review_comment_{comment.id}",
            activity_type=schemas.ActivityType.REVIEW_COMMENTED,
            timestamp=comment.created_at,
            game=schemas.ActivityGameInfo(
                id=game.id,
                igdb_id=game.igdb_id,
                name=game.name,
                slug=game.slug,
                cover_image=game.cover_image
            ),
            review=schemas.ActivityReviewInfo(
                id=review.id,
                rating=review.rating,
                game=None
            ),
            comment_content=comment.content[:100] + ('...' if len(comment.content) > 100 else ''),
            target_username=review_user.username
        ))
    
    # Sort activities by timestamp (newest first), then page. The pool is bounded
    # by the 30-day window and the per-source limits above, so deep offsets simply
    # run out rather than paging forever.
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    page = activities[offset:offset + limit]

    return schemas.UserActivityResponse(
        activities=page,
        has_more=offset + limit < len(activities),
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def forgot_password(request: Request, payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset link. Always returns success to prevent email enumeration."""
    user = db.query(User).filter(User.email == payload.email).first()

    if user:
        # Invalidate any existing unused tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at == None,
        ).delete()
        db.commit()

        token_str = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            token=token_str,
            user_id=user.id,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
        db.add(reset_token)
        db.commit()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token_str}"
        send_password_reset_email(user.email, reset_url)

    return {"message": "If that email is registered, you'll receive a reset link shortly."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    """Verify a user's email address using the token from the verification link."""
    record = db.query(EmailVerification).filter(
        EmailVerification.token == token,
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification link.")

    if record.expires_at < datetime.now(UTC).replace(tzinfo=None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification link has expired.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found.")

    user.is_verified = True
    db.query(EmailVerification).filter(EmailVerification.user_id == user.id).delete()
    db.commit()

    return {"message": "Email verified successfully."}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
async def resend_verification(
    request: Request,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Resend the verification email for the current user."""
    if current_user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified.")

    # Invalidate existing tokens
    db.query(EmailVerification).filter(EmailVerification.user_id == current_user.id).delete()
    db.commit()

    token_str = secrets.token_urlsafe(32)
    verification = EmailVerification(
        token=token_str,
        user_id=current_user.id,
        expires_at=datetime.now(UTC) + timedelta(hours=24),
    )
    db.add(verification)
    db.commit()

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token_str}"
    send_verification_email(current_user.email, verify_url)

    return {"message": "Verification email sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a valid reset token."""
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.used_at == None,
        PasswordResetToken.expires_at > datetime.now(UTC),
    ).first()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token.")

    user.hashed_password = security.get_password_hash(request.password)
    reset_token.used_at = datetime.now(UTC)

    # Invalidate all active sessions for security
    db.query(Token).filter(Token.user_id == user.id).delete()

    db.commit()

    return {"message": "Password reset successfully. Please log in with your new password."}