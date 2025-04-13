from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
import decimal

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    cash_balance = Column(Numeric(15, 4), nullable=False, default=decimal.Decimal("100000.0000")) # Start users with virtual cash
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True) # One account per user

    owner = relationship("User") # Define relationship back to User