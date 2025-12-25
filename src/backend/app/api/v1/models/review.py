# models/review.py
from datetime import datetime, UTC
from sqlalchemy import Integer, String, Float, ForeignKey, DateTime, UniqueConstraint, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ...db_setup import Base

class Review(Base):
    """Model for game reviews."""
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "game_id", name="unique_user_game_review"),
    )

    # Primary key and foreign keys
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    
    # Review content
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    content: Mapped[str | None] = mapped_column(String(5000), nullable=True)  # Increased limit
    
    # Advanced review fields
    platform: Mapped[str | None] = mapped_column(String(50), nullable=True)  # PC, PS5, Xbox, etc.
    playtime_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Hours spent
    completion_status: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Main Story, 100%, Dropped, etc.
    
    # Category ratings (1-5 scale, optional)
    story_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gameplay_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    visuals_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    audio_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    performance_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Recommendation
    recommended: Mapped[bool | None] = mapped_column(Boolean, nullable=True)  # Would recommend?
    
    # Counters
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Status (computed, not stored)
    user_liked: bool = False

    # Relationships
    user = relationship("User", backref="reviews")
    game = relationship("Game", backref="reviews")
    likes = relationship("ReviewLike", back_populates="review", cascade="all, delete-orphan")
    comments = relationship("ReviewComment", back_populates="review", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Review(id={self.id}, user_id={self.user_id}, game_id={self.game_id}, rating={self.rating})>"


class ReviewLike(Base):
    """Model for likes on reviews."""
    __tablename__ = "review_likes"
    __table_args__ = (
        # Ensure one like per user per review
        UniqueConstraint("user_id", "review_id", name="unique_user_review_like"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    review_id: Mapped[int] = mapped_column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    user = relationship("User", backref="review_likes")
    review = relationship("Review", back_populates="likes")

    def __repr__(self):
        return f"<ReviewLike(user_id={self.user_id}, review_id={self.review_id})>"


class ReviewComment(Base):
    """Model for comments on reviews."""
    __tablename__ = "review_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    review_id: Mapped[int] = mapped_column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    user = relationship("User", backref="review_comments")
    review = relationship("Review", back_populates="comments")

    def __repr__(self):
        return f"<ReviewComment(id={self.id}, user_id={self.user_id}, review_id={self.review_id})>" 