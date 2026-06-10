# routers/preferences.py
"""
Account endpoints: username availability checks and username claiming/changing.
"""
import re

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core import schemas, security
from ..models.user import User
from ...db_setup import get_db

router = APIRouter(tags=["preferences"])

_USERNAME_RE = re.compile(r"^[A-Za-z0-9_-]+$")


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
