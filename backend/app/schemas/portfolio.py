from pydantic import BaseModel
from typing import List
from .holding import HoldingResponse
import decimal

class Portfolio(BaseModel):
    cash_balance: decimal.Decimal
    total_portfolio_value: decimal.Decimal # cash + total holdings value
    total_holdings_value: decimal.Decimal
    total_unrealized_pnl: decimal.Decimal
    holdings: List[HoldingResponse]