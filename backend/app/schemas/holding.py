from pydantic import BaseModel
from typing import Optional
import decimal

# Schema for returning holding details including calculated values
class HoldingResponse(BaseModel):
    symbol: str
    quantity: int
    average_cost_basis: decimal.Decimal
    # Fields calculated on the fly when fetching portfolio
    current_price: Optional[decimal.Decimal] = None
    current_value: Optional[decimal.Decimal] = None
    unrealized_pnl: Optional[decimal.Decimal] = None

    class Config:
        from_attributes = True # Needed if reading directly from ORM model sometimes