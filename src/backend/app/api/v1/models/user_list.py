from datetime import datetime, timezone
from sqlalchemy import Integer, String, ForeignKey, DateTime, Table, Column, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from ...db_setup import Base

# Association table for the many-to-many relationship between UserList and Game
user_list_games = Table(
    "user_list_games",
    Base.metadata,
    Column("user_list_id", Integer, ForeignKey("user_lists.id"), primary_key=True),
    Column("game_id", Integer, ForeignKey("games.id"), primary_key=True),
    Column("added_at", DateTime, default=lambda: datetime.now(timezone.utc))
)


class UserList(Base):
    __tablename__ = "user_lists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Public/community list fields
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationship with games (many-to-many)
    games = relationship("Game", secondary=user_list_games, backref="user_lists")
    
    # Relationship with likes
    likes = relationship("ListLike", back_populates="user_list", cascade="all, delete-orphan")
    
    # Relationship with user (creator)
    user = relationship("User", backref="lists")

    def __repr__(self):
        return f"<UserList(id={self.id}, name={self.name}, user_id={self.user_id}, is_public={self.is_public})>"


class ListLike(Base):
    """Model for likes on user lists."""
    __tablename__ = "list_likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    list_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_lists.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", backref="list_likes")
    user_list = relationship("UserList", back_populates="likes") 