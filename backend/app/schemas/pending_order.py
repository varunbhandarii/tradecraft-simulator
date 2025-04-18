from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import decimal
from app.models.enums import OrderType, OrderStatus

# Base schema
class PendingOrderBase(BaseModel):
    symbol: str
    order_type: OrderType
    quantity: int
    limit_price: decimal.Decimal
    status: OrderStatus

# Schema for returning via API
class PendingOrder(PendingOrderBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True