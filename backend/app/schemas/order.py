from pydantic import BaseModel, Field, validator
from app.models.enums import OrderType
from typing import Optional
import decimal

class OrderCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    quantity: int = Field(..., gt=0)
    order_type: OrderType
    limit_price: Optional[decimal.Decimal] = Field(None, gt=decimal.Decimal("0.0"))

    @validator('symbol')
    def symbol_uppercase(cls, v):
        return v.upper()

    # Add validation to ensure limit_price is provided for limit orders
    @validator('limit_price', always=True)
    def check_limit_price(cls, v, values):
        order_type = values.get('order_type')
        if order_type in [OrderType.LIMIT_BUY, OrderType.LIMIT_SELL] and v is None:
            raise ValueError('limit_price is required for Limit orders')
        if order_type in [OrderType.MARKET_BUY, OrderType.MARKET_SELL] and v is not None:
             raise ValueError('limit_price must not be provided for Market orders')
        return v