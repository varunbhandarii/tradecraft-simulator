from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    total_value = Column(Numeric(15, 4), nullable=False)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"), # If a user is deleted, their snapshots are also deleted
        nullable=False,
        index=True
    )

    owner = relationship("User")

    def __repr__(self):
        return f"<PortfolioSnapshot(id={self.id}, user_id={self.user_id}, timestamp='{self.timestamp}', value={self.total_value})>"