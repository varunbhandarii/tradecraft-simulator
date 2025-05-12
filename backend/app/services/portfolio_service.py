from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.portfolio import Portfolio
from app.schemas.holding import HoldingResponse
from app.crud import crud_account, crud_holding
from app.services import market_data_service
import decimal
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

def get_portfolio(db: Session, user: User) -> Portfolio:
    """ Calculates and returns the user's portfolio details. """
    db_account = crud_account.get_or_create_account(db=db, user=user)
    cash = db_account.cash_balance
    db_holdings = crud_holding.get_all_holdings(db=db, user_id=user.id)

    portfolio_holdings: List[HoldingResponse] = []
    total_holdings_value = decimal.Decimal("0.0")
    total_pnl = decimal.Decimal("0.0")

    # --- Fetch unique current prices ONCE ---
    unique_symbols = list(set([h.symbol for h in db_holdings]))
    current_prices: Dict[str, Optional[decimal.Decimal]] = {}
    if unique_symbols:
        logger.info(f"Portfolio service fetching current prices for {len(unique_symbols)} symbols...")
        for symbol in unique_symbols:
            price = market_data_service.get_current_price(symbol)
            current_prices[symbol] = decimal.Decimal(str(price)) if price is not None else None
    # --- End price fetching ---

    for holding in db_holdings:
        current_price_decimal = current_prices.get(holding.symbol)
        holding_resp = HoldingResponse.from_orm(holding)

        if current_price_decimal is not None:
            current_value = current_price_decimal * decimal.Decimal(holding.quantity)
            cost_basis_value = holding.average_cost_basis * decimal.Decimal(holding.quantity)
            pnl = current_value - cost_basis_value

            holding_resp.current_price = current_price_decimal
            holding_resp.current_value = current_value
            holding_resp.unrealized_pnl = pnl

            total_holdings_value += current_value
            total_pnl += pnl
        else:
            logger.warning(f"Could not use current price for holding {holding.symbol} (user {user.id}) in portfolio calculation.")

        portfolio_holdings.append(holding_resp)

    total_portfolio_value = cash + total_holdings_value

    return Portfolio(
        cash_balance=cash,
        total_holdings_value=total_holdings_value,
        total_portfolio_value=total_portfolio_value,
        total_unrealized_pnl=total_pnl,
        holdings=portfolio_holdings
    )