# models/user_oauth_account.py
from datetime import datetime, UTC
from sqlalchemy import Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ...db_setup import Base


class UserOAuthAccount(Base):
    """Links a user to an external OAuth identity (Google, GitHub).

    A user may have several rows here (one per linked provider). The
    (provider, provider_account_id) pair is unique so the same external
    identity can never attach to two different users.
    """
    __tablename__ = "user_oauth_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(20), nullable=False)  # 'google' | 'github'
    provider_account_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    user = relationship("User", back_populates="oauth_accounts")

    __table_args__ = (
        UniqueConstraint("provider", "provider_account_id", name="uq_oauth_provider_account"),
    )

    def __repr__(self):
        return f"<UserOAuthAccount(user_id={self.user_id}, provider={self.provider})>"
