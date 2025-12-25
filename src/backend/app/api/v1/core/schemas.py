# schemas.py
from datetime import datetime
from typing import Optional, List, Dict
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from ..models.user_game import GameStatus

class UserBase(BaseModel):
    """Base schema for user data."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    avatar: str = Field(default="/images/default-avatar.svg")
    bio: Optional[str] = None
    
class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    """Schema for login credentials."""
    username: str
    password: str

class UserResponse(UserBase):
    """Schema for user data in responses."""
    id: int
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
    added_at: datetime
    updated_at: datetime
    status: GameStatus
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
    avatar: Optional[str] = None
    bio: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

# User List schemas
class UserListBase(BaseModel):
    """Base schema for user lists."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class UserListCreate(UserListBase):
    """Schema for creating a user list."""
    pass

class UserListUpdate(BaseModel):
    """Schema for updating a user list."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class UserList(UserListBase):
    """Schema for returning a user list."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    games: List[GameBasicInfo] = []

    model_config = ConfigDict(from_attributes=True)

class UserListsResponse(BaseModel):
    """Schema for returning all user lists."""
    lists: List[UserList] = []

    model_config = ConfigDict(from_attributes=True)

class AddGameToListRequest(BaseModel):
    """Schema for adding a game to a user list."""
    game_id: int
