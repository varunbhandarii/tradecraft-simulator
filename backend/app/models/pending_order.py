from sqlalchemy import (
    Column, Integer, String, Numeric, ForeignKey, DateTime, Enum as SQLAlchemyEnum,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from .enums import OrderType, OrderStatus
import decimal

class PendingOrder(Base):
    __tablename__ = "pending_orders"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Key to User
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    owner = relationship("User")

    # Order Details
    symbol = Column(String(10), index=True, nullable=False) # Max length for symbol
    order_type = Column(SQLAlchemyEnum(OrderType, name="ordertype"), nullable=False)
    quantity = Column(Integer, nullable=False)
    limit_price = Column(Numeric(15, 4), nullable=False)

    # Order Status
    status = Column(
        SQLAlchemyEnum(OrderStatus, name="orderstatus"),
        nullable=False,
        default=OrderStatus.PENDING,
        index=True
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # updated_at helps track when status changed (e.g., cancelled/executed time)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint('quantity > 0', name='ck_pending_order_quantity_positive'),
    )

    def __repr__(self):
        return f"<PendingOrder(id={self.id}, user={self.user_id}, type='{self.order_type}', status='{self.status}', symbol='{self.symbol}', qty={self.quantity}, price={self.limit_price})>"