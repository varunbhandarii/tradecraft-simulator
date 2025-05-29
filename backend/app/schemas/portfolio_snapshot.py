from pydantic import BaseModel
from datetime import datetime
import decimal

class PortfolioSnapshotResponse(BaseModel):
    timestamp: datetime
    total_value: decimal.Decimal

    class Config:
        from_attributes = True # For Pydantic V2+ to work with ORM models