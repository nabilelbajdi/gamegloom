# routers/preferences.py
"""
Onboarding / personalization endpoints: a user's taste preferences (genres,
themes, playstyles, chosen UI theme) and username claiming.
"""
import re
from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core import schemas, security
from ..models.user import User
from ..models.user_preference import UserPreference
from ...db_setup import get_db

router = APIRouter(tags=["preferences"])

_USERNAME_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def _pref_response(pref: UserPreference | None) -> schemas.UserPreferenceResponse:
    if not pref:
        return schemas.UserPreferenceResponse()
    return schemas.UserPreferenceResponse(
        favorite_genres=pref.favorite_genres or [],
        favorite_themes=pref.favorite_themes or [],
        playstyles=pref.playstyles or [],
        theme_key=pref.theme_key or "obsidian",
        onboarded=pref.onboarded_at is not None,
    )


@router.get("/me/preferences", response_model=schemas.UserPreferenceResponse)
async def get_preferences(
    current_user: User = Depends(security.get_current_user),
):
    """Current user's personalization preferences (defaults if none saved yet)."""
    return _pref_response(current_user.preferences)


@router.put("/me/preferences", response_model=schemas.UserPreferenceResponse)
async def update_preferences(
    payload: schemas.UserPreferenceUpdate,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    """Upsert preferences. Onboarding can call this per-step or once at the end."""
    data = payload.model_dump(exclude_unset=True)

    pref = current_user.preferences
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    for field in ("favorite_genres", "favorite_themes", "playstyles", "theme_key"):
        if field in data and data[field] is not None:
            setattr(pref, field, data[field])

    if data.get("mark_onboarded"):
        pref.onboarded_at = datetime.now(UTC)

    db.commit()
    db.refresh(pref)
    return _pref_response(pref)


@router.get("/username-available")
async def username_available(
    u: str = Query(..., min_length=1, max_length=50),
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    """Whether a username is free + well-formed (the user's own current name counts as available)."""
    valid = bool(_USERNAME_RE.match(u)) and 3 <= len(u) <= 50
    taken = (
        db.query(User.id)
        .filter(func.lower(User.username) == u.lower(), User.id != current_user.id)
        .first()
        is not None
    )
    return {"available": valid and not taken, "valid_format": valid}


@router.put("/me/username", response_model=schemas.UserResponse)
async def change_username(
    payload: schemas.UsernameUpdate,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(get_db),
):
    """Claim/change the current user's username (case-insensitive uniqueness)."""
    clash = (
        db.query(User)
        .filter(func.lower(User.username) == payload.username.lower(), User.id != current_user.id)
        .first()
    )
    if clash:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    current_user.username = payload.username
    try:
        db.commit()
        db.refresh(current_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
    return current_user
