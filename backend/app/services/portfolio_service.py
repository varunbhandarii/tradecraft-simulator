from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.portfolio import Portfolio
from app.schemas.holding import HoldingResponse
from app.crud import crud_account, crud_holding
from app.services import market_data_service
import decimal
import logging
from typing import List

logger = logging.getLogger(__name__)

def get_portfolio(db: Session, user: User) -> Portfolio:
    """ Calculates and returns the user's portfolio details. """

    # Get cash balance
    db_account = crud_account.get_or_create_account(db=db, user=user)
    cash = db_account.cash_balance

    # Get all holdings
    db_holdings = crud_holding.get_all_holdings(db=db, user_id=user.id)

    portfolio_holdings: List[HoldingResponse] = []
    total_holdings_value = decimal.Decimal("0.0")
    total_pnl = decimal.Decimal("0.0")

    for holding in db_holdings:
        current_price = market_data_service.get_current_price(holding.symbol)
        holding_resp = HoldingResponse.from_orm(holding) # Map basic fields

        if current_price is not None:
            current_price_decimal = decimal.Decimal(str(current_price))
            current_value = current_price_decimal * holding.quantity
            cost_basis_value = holding.average_cost_basis * holding.quantity
            pnl = current_value - cost_basis_value

            holding_resp.current_price = current_price_decimal
            holding_resp.current_value = current_value
            holding_resp.unrealized_pnl = pnl

            total_holdings_value += current_value
            total_pnl += pnl
        else:
            # Handle case where price isn't available
            logger.warning(f"Could not fetch current price for holding {holding.symbol} for user {user.id}")
            # Values will remain None as per schema definition

        portfolio_holdings.append(holding_resp)

    total_portfolio_value = cash + total_holdings_value

    return Portfolio(
        cash_balance=cash,
        total_holdings_value=total_holdings_value,
        total_portfolio_value=total_portfolio_value,
        total_unrealized_pnl=total_pnl,
        holdings=portfolio_holdings
    )
