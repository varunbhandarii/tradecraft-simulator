from pydantic import BaseModel
from datetime import datetime
from app.models.trade import TradeType
import decimal

class Trade(BaseModel):
    id: int
    symbol: str
    quantity: int
    price: decimal.Decimal
    trade_type: TradeType
    timestamp: datetime
    user_id: int

    class Config:
        from_attributes = True