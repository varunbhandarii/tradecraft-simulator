from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), nullable=False, index=True)

    # Foreign Key to User
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"), # If a user is deleted, their watchlist items are also deleted
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    owner = relationship("User")

    # Ensure a user cannot have the same symbol multiple times in their watchlist
    __table_args__ = (
        UniqueConstraint('user_id', 'symbol', name='_user_symbol_watchlist_uc'),
    )

    def __repr__(self):
        return f"<WatchlistItem(id={self.id}, user_id={self.user_id}, symbol='{self.symbol}')>"