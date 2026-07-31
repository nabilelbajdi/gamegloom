# schemas.py
import re
from datetime import datetime
from typing import Optional, List, Dict
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator, computed_field
from ..models.user_game import GameStatus

# A short blocklist of the worst-offender passwords. Lowercase + stripped at compare time.
# Curated from the top of public breach datasets (e.g. rockyou). Not exhaustive — a
# determined attacker can pick a slightly less common weak password — but blocks the
# ones that account for a disproportionate share of compromised accounts.
_COMMON_PASSWORDS = frozenset({
    "password", "password1", "password12", "password123", "passw0rd", "p@ssw0rd",
    "12345678", "123456789", "1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm",
    "qwerty", "qwerty123", "qwerty1234", "abc12345", "abcd1234", "abcdef123",
    "letmein", "welcome", "welcome1", "welcome123", "iloveyou", "trustno1",
    "monkey", "dragon", "football", "baseball", "shadow", "master", "michael",
    "admin", "admin123", "administrator", "root", "rootroot",
    "1q2w3e4r", "1q2w3e4r5t", "1qaz2wsx", "qazwsx123", "asdf1234",
    "00000000", "11111111", "88888888", "01234567", "87654321",
    "gamegloom", "gamegloom1", "gamegloom123",
})


def _validate_password_strength(v: str) -> str:
    if v.lower().strip() in _COMMON_PASSWORDS:
        raise ValueError("This password is too common. Please choose something less guessable.")
    return v


class UserBase(BaseModel):
    """Base schema for user data."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    avatar: str = Field(default="/images/default-avatar.svg", max_length=500)
    bio: Optional[str] = Field(None, max_length=500)

class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=10, max_length=128)

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class ForgotPasswordRequest(BaseModel):
    """Schema for requesting a password reset."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for resetting a password with a token."""
    token: str
    password: str = Field(..., min_length=10, max_length=128)

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password_strength(v)

class ChangePasswordRequest(BaseModel):
    """Set or change a password. current_password is required only when the
    account already has one (OAuth-only users set their first password freely)."""
    current_password: Optional[str] = None
    new_password: str = Field(..., min_length=10, max_length=128)

    @field_validator("new_password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class UserLogin(BaseModel):
    """Schema for login credentials."""
    username: str
    password: str


class DeleteAccountRequest(BaseModel):
    """Schema for confirming account deletion with a password."""
    password: str

class UserResponse(UserBase):
    """Schema for user data in responses."""
    id: int
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    """Schema for token response to client."""
    token: str
    expires_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenCreate(BaseModel):
    """Schema for creating a new token."""
    token: str
    user_id: int
    expires_at: datetime

class SimilarGame(BaseModel):
    """Schema for similar games linked to a main game."""
    id: int
    name: str
    slug: Optional[str] = None
    cover_image: Optional[str] = None
    rating: Optional[float] = None
    genres: Optional[str] = None

def blend_overall_rating(total_rating, total_count, community_rating, community_count) -> Optional[float]:
    """Vote-weighted blend (0-100) of every available rating source.

    Each source contributes its rating weighted by its vote count, so a game with
    thousands of IGDB votes barely shifts from a few GameGloom reviews, while a
    niche game leans more on its community ratings. More sources (e.g. Steam) drop
    in as extra (rating, count) terms. Returns None when nothing has any votes.
    """
    sources = [
        (total_rating, total_count or 0),
        (community_rating, community_count or 0),
    ]
    weighted = [(r, c) for r, c in sources if r is not None and c > 0]
    if not weighted:
        return next((r for r, _ in sources if r is not None), None)
    total = sum(r * c for r, c in weighted)
    count = sum(c for _, c in weighted)
    return total / count


class GameBase(BaseModel):
    """Base schema for game models."""
    igdb_id: int
    name: str = Field(..., min_length=1, max_length=100)
    
    summary: Optional[str] = None
    storyline: Optional[str] = None
    cover_image: Optional[str] = None
    
    rating: Optional[float] = None
    aggregated_rating: Optional[float] = None
    aggregated_rating_count: Optional[int] = None
    total_rating: Optional[float] = None
    total_rating_count: Optional[int] = None
    hypes: Optional[int] = None

    genres: Optional[str] = None
    platforms: Optional[str] = None
    developers: Optional[str] = None
    publishers: Optional[str] = None
    game_modes: Optional[str] = None
    player_perspectives: Optional[str] = None
    themes: Optional[str] = None
    
    first_release_date: Optional[datetime] = None
    
    screenshots: Optional[List[str]] = None
    artworks: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    similar_games: Optional[List[SimilarGame]] = None
    
    # New fields
    dlcs: Optional[List[Dict]] = None
    expansions: Optional[List[Dict]] = None
    remakes: Optional[List[Dict]] = None
    remasters: Optional[List[Dict]] = None
    parent_game: Optional[Dict] = None
    bundles: Optional[List[Dict]] = None
    ports: Optional[List[Dict]] = None
    standalone_expansions: Optional[List[Dict]] = None
    episodes: Optional[List[Dict]] = None
    seasons: Optional[List[Dict]] = None
    packs: Optional[List[Dict]] = None
    editions: Optional[List[Dict]] = None
    in_bundles: Optional[List[Dict]] = None
    version_parent: Optional[Dict] = None
    version_title: Optional[str] = None
    
    slug: Optional[str] = None
    game_status_id: Optional[int] = None
    game_status_name: Optional[str] = None
    game_type_id: Optional[int] = None
    game_type_name: Optional[str] = None
    
    # New detailed info fields
    age_ratings: Optional[List[Dict]] = None
    game_engines: Optional[List[str]] = None
    multiplayer_modes: Optional[Dict] = None
    language_supports: Optional[List[Dict]] = None
    
    franchise: Optional[str] = None
    franchises: Optional[List[str]] = None
    collections: Optional[List[str]] = None
    alternative_names: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    ps_concept_id: Optional[int] = None
    alt_names_search: Optional[str] = None
    
    # Time to beat information
    time_to_beat: Optional[Dict] = None

class GameCreate(GameBase):
    """Schema for creating a new game entry."""
    raw_data: Optional[Dict] = None

class GameUpdate(GameBase):
    """Schema for updating an existing game entry."""
    pass

class Game(GameBase):
    """Schema for reading game data, including timestamps."""
    id: int
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False

    # GameGloom's own community rating, kept separate from IGDB's so syncs can't
    # wipe it. Read-only here — never part of the create/update input schemas.
    community_rating: Optional[float] = None
    community_rating_count: Optional[int] = None

    @computed_field
    @property
    def overall_rating(self) -> Optional[float]:
        """Vote-weighted blend (0-100) of IGDB's total_rating + GameGloom's
        community_rating. See blend_overall_rating for the formula."""
        return blend_overall_rating(
            self.total_rating, self.total_rating_count,
            self.community_rating, self.community_rating_count,
        )

    @computed_field
    @property
    def overall_rating_count(self) -> int:
        """Total number of votes behind overall_rating, across all sources."""
        return (self.total_rating_count or 0) + (self.community_rating_count or 0)

    model_config = ConfigDict(from_attributes=True)

class UserGameBase(BaseModel):
    """Base schema for user-game relationships."""
    game_id: int
    status: GameStatus

class UserGameCreate(UserGameBase):
    """Schema for creating a new user-game relationship."""
    pass

class UserGame(UserGameBase):
    """Schema for reading user-game data."""
    id: int
    user_id: int
    added_at: datetime
    updated_at: datetime
    game: Optional[Game] = None  # For when we want to include game details

    model_config = ConfigDict(from_attributes=True)

class UserGameUpdate(BaseModel):
    """Schema for updating a user-game relationship."""
    status: GameStatus

class GameBasicInfo(BaseModel):
    """Simplified game info for collection views."""
    id: int
    igdb_id: int
    name: str
    slug: str | None = None
    coverImage: str | None = None
    genres: str | None = None
    themes: str | None = None
    platforms: str | None = None
    game_modes: str | None = None
    player_perspectives: str | None = None
    rating: str | None = None
    first_release_date: datetime | None = None
    added_at: datetime | None = None
    updated_at: datetime | None = None
    status: GameStatus | None = None
    game_type_name: str | None = None
    playtime_minutes: int | None = None
    last_played_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class UserGameResponse(BaseModel):
    """Schema for user game collection response."""
    want_to_play: List[GameBasicInfo] = []
    playing: List[GameBasicInfo] = []
    played: List[GameBasicInfo] = []

    model_config = ConfigDict(from_attributes=True)

# Review Schemas
class ReviewBase(BaseModel):
    """Base schema for reviews."""
    rating: float = Field(..., ge=1, le=5)
    content: Optional[str] = Field(None, max_length=5000)
    
    # Advanced review fields
    platform: Optional[str] = Field(None, max_length=50)
    playtime_hours: Optional[int] = Field(None, ge=0)
    completion_status: Optional[str] = Field(None, max_length=50)
    
    # Category ratings (1-5)
    story_rating: Optional[int] = Field(None, ge=1, le=5)
    gameplay_rating: Optional[int] = Field(None, ge=1, le=5)
    visuals_rating: Optional[int] = Field(None, ge=1, le=5)
    audio_rating: Optional[int] = Field(None, ge=1, le=5)
    performance_rating: Optional[int] = Field(None, ge=1, le=5)
    
    # Recommendation
    recommended: Optional[bool] = None

class ReviewCreate(ReviewBase):
    """Schema for creating a new review."""
    game_id: int

class ReviewUpdate(BaseModel):
    """Schema for updating a review."""
    rating: Optional[float] = Field(None, ge=1, le=5)
    content: Optional[str] = Field(None, max_length=5000)
    platform: Optional[str] = Field(None, max_length=50)
    playtime_hours: Optional[int] = Field(None, ge=0)
    completion_status: Optional[str] = Field(None, max_length=50)
    story_rating: Optional[int] = Field(None, ge=1, le=5)
    gameplay_rating: Optional[int] = Field(None, ge=1, le=5)
    visuals_rating: Optional[int] = Field(None, ge=1, le=5)
    audio_rating: Optional[int] = Field(None, ge=1, le=5)
    performance_rating: Optional[int] = Field(None, ge=1, le=5)
    recommended: Optional[bool] = None

class Review(ReviewBase):
    """Schema for reading review data."""
    id: int
    user_id: int
    game_id: int
    likes_count: int
    comments_count: int
    created_at: datetime
    updated_at: datetime
    user_liked: bool = False
    user: Optional[UserResponse] = None
    game: Optional[Game] = None

    model_config = ConfigDict(from_attributes=True)

# Review Comment Schemas
class ReviewCommentBase(BaseModel):
    """Base schema for review comments."""
    content: str = Field(..., min_length=1, max_length=500)

class ReviewCommentCreate(ReviewCommentBase):
    """Schema for creating a new review comment."""
    pass

class ReviewComment(ReviewCommentBase):
    """Schema for reading review comment data."""
    id: int
    user_id: int
    review_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

# Review Like Schema
class ReviewLike(BaseModel):
    """Schema for review likes."""
    id: int
    user_id: int
    review_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile information."""
    avatar: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=500)

    model_config = ConfigDict(from_attributes=True)


class UsernameUpdate(BaseModel):
    """Schema for claiming/changing a username."""
    username: str = Field(..., min_length=3, max_length=50)

    @field_validator("username")
    @classmethod
    def valid_username(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z0-9_-]+$", v):
            raise ValueError("Username may only contain letters, numbers, underscores, and hyphens")
        return v

class UserStats(BaseModel):
    """Schema for user statistics."""
    total_games: int
    want_to_play_count: int
    playing_count: int
    played_count: int
    reviews_count: int
    average_rating: Optional[float] = None
    lists_count: int

    model_config = ConfigDict(from_attributes=True)

class ActivityGameInfo(BaseModel):
    """Basic game info for activity items."""
    id: int
    igdb_id: int
    name: str
    slug: Optional[str] = None
    cover_image: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ActivityReviewInfo(BaseModel):
    """Basic review info for activity items."""
    id: int
    rating: float
    content: Optional[str] = None
    game: Optional[ActivityGameInfo] = None

    model_config = ConfigDict(from_attributes=True)

class ActivityType(str, Enum):
    """Types of user activities."""
    GAME_STATUS_UPDATED = "game_status_updated"
    REVIEW_CREATED = "review_created"
    REVIEW_COMMENTED = "review_commented"

class UserActivity(BaseModel):
    """Schema for a user activity item."""
    id: str
    activity_type: ActivityType
    timestamp: datetime
    game: Optional[ActivityGameInfo] = None
    review: Optional[ActivityReviewInfo] = None
    review_content: Optional[str] = None
    game_status: Optional[str] = None
    comment_content: Optional[str] = None
    target_username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserActivityResponse(BaseModel):
    """Schema for user activity response."""
    activities: List[UserActivity]
    has_more: bool = False

    model_config = ConfigDict(from_attributes=True)

# User List schemas
class UserListBase(BaseModel):
    """Base schema for user lists."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class UserListCreate(UserListBase):
    """Schema for creating a user list."""
    is_public: bool = False

class UserListUpdate(BaseModel):
    """Schema for updating a user list."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None

class UserListCreator(BaseModel):
    """Simplified user info for list creators."""
    id: int
    username: str
    avatar: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserList(UserListBase):
    """Schema for returning a user list."""
    id: int
    user_id: int
    is_public: bool = False
    is_featured: bool = False
    likes_count: int = 0
    created_at: datetime
    updated_at: datetime
    games: List[GameBasicInfo] = []
    game_count: int | None = None

    model_config = ConfigDict(from_attributes=True)

class UserListPublic(UserListBase):
    """Schema for public list with creator info."""
    id: int
    user_id: int
    is_public: bool = True
    is_featured: bool = False
    likes_count: int = 0
    created_at: datetime
    updated_at: datetime
    games: List[GameBasicInfo] = []
    creator: Optional[UserListCreator] = None
    user_liked: bool = False  # Whether current user liked this list
    game_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class UserListsResponse(BaseModel):
    """Schema for returning all user lists."""
    lists: List[UserList] = []

    model_config = ConfigDict(from_attributes=True)

class PublicListsResponse(BaseModel):
    """Schema for paginated public lists."""
    lists: List[UserListPublic] = []
    total: int = 0
    page: int = 1
    per_page: int = 20
    has_more: bool = False

    model_config = ConfigDict(from_attributes=True)

class AddGameToListRequest(BaseModel):
    """Schema for adding a game to a user list."""
    game_id: int

class ListLikeResponse(BaseModel):
    """Schema for like/unlike response."""
    liked: bool
    likes_count: int

    model_config = ConfigDict(from_attributes=True)

