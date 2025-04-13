from pydantic import BaseModel, Field, validator
from app.models.trade import TradeType

class OrderCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    quantity: int = Field(..., gt=0) # Ensure quantity is positive
    trade_type: TradeType

    @validator('symbol')
    def symbol_uppercase(cls, v):
        return v.upper()