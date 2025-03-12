# core/auth.py
from datetime import datetime, timedelta, UTC
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from ..models.token import Token
from ..models.user import User
from ...db_setup import get_db

# Security scheme for token
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

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
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current user from token."""
    token = credentials.credentials
    user = get_user_by_token(db, token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user 