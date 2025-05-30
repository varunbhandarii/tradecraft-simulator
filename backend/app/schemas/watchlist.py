from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
import decimal

class WatchlistSymbolCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock symbol to add to watchlist")

    @validator('symbol')
    def symbol_uppercase(cls, v: str) -> str:
        return v.upper()

class WatchlistItemBase(BaseModel):
    id: int
    symbol: str
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class WatchlistItemResponse(BaseModel):
    id: int
    symbol: str
    current_price: Optional[decimal.Decimal] = None
    created_at: datetime
