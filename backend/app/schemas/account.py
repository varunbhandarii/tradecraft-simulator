from pydantic import BaseModel
import decimal

class Account(BaseModel):
    id: int
    cash_balance: decimal.Decimal
    user_id: int

    class Config:
        from_attributes = True