import pandas as pd
import numpy as np
import decimal
import logging
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.holding import Holding
from app.crud import crud_holding
from app.services import market_data_service

logger = logging.getLogger(__name__)

# Use Decimal for precision in final VaR reporting
ZERO_DECIMAL = decimal.Decimal("0.0000")

def calculate_historical_var(
    db: Session,
    user: User,
    confidence_level: float = 0.95, # 95% confidence level
    lookback_days: int = 252       # Approx 1 trading year
) -> Optional[Dict[str, any]]:
    """
    Calculates Value at Risk (VaR) using Historical Simulation.
    Returns a dictionary with VaR details or None if calculation fails.
    """

    # 1. Get Current Holdings
    holdings: List[Holding] = crud_holding.get_all_holdings(db=db, user_id=user.id)
    if not holdings:
        logger.info(f"User {user.id} has no holdings. VaR is 0.")
        return {
            "var_amount": ZERO_DECIMAL,
            "confidence_level": confidence_level,
            "lookback_days": lookback_days,
            "portfolio_value": ZERO_DECIMAL,
            "message": "No holdings in portfolio."
        }

    # 2. Fetch Historical Data & Current Prices for each holding
    symbols = list(set([h.symbol for h in holdings])) # Unique symbols
    historical_returns_map: Dict[str, pd.Series] = {}
    current_values_map: Dict[str, decimal.Decimal] = {}
    fetch_errors = []

    logger.info(f"Fetching data for VaR calculation. Holdings: {len(holdings)}, Symbols: {len(symbols)}")

    total_portfolio_value = ZERO_DECIMAL

    for symbol in symbols:
        # Fetch historical data
        hist_df = market_data_service.get_historical_data(symbol, lookback_days=lookback_days)
        if hist_df is None or 'adjusted_close' not in hist_df.columns or hist_df.empty:
            logger.warning(f"Could not fetch sufficient historical data for {symbol}. Excluding from VaR.")
            fetch_errors.append(symbol)
            continue # Skip this symbol

        # Keep only relevant lookback period + 1 day for return calculation
        # Ensure index is datetime
        if not pd.api.types.is_datetime64_any_dtype(hist_df.index):
             try:
                 hist_df.index = pd.to_datetime(hist_df.index)
             except Exception:
                 logger.warning(f"Could not convert index to datetime for {symbol}. Excluding from VaR.")
                 fetch_errors.append(symbol)
                 continue

        hist_df = hist_df.sort_index() # Ensure ascending date order
        # Ensure index is datetime (should be from get_historical_data)
        end_date = hist_df.index.max()
        # Calculate start date based on lookback days (approximate calendar days)
        # Add a small buffer to account for non-trading days
        start_date = end_date - pd.Timedelta(days=int(lookback_days * 1.5) + 5)
        hist_df = hist_df.loc[start_date:end_date]
        
        if len(hist_df) < lookback_days // 2: # Basic check for sufficient data points
             logger.warning(f"Insufficient historical data points ({len(hist_df)}) after filtering for {symbol}. Excluding.")
             fetch_errors.append(symbol)
             continue

        # Calculate daily returns
        returns = hist_df['adjusted_close'].pct_change().dropna()
        # Require at least 90% of requested lookback days, or minimum 50 points
        required_points = max(50, int(lookback_days * 0.9))
        if len(returns) < required_points : # Check if enough returns were generated
            logger.warning(f"Insufficient returns data points ({len(returns)}, required ~{required_points}) for {symbol}. Excluding.")
            fetch_errors.append(symbol)
            continue

        # Slice returns AFTER the length check to get the most recent 'lookback_days'
        historical_returns_map[symbol] = returns.tail(lookback_days)
        
        # Fetch current price for portfolio valuation
        current_price = market_data_service.get_current_price(symbol)
        if current_price is None:
            logger.warning(f"Could not fetch current price for {symbol}. Excluding from VaR.")
            fetch_errors.append(symbol)
            # Remove historical data if we can't value the holding
            if symbol in historical_returns_map:
                del historical_returns_map[symbol]
            continue # Skip this symbol

        current_price_decimal = decimal.Decimal(str(current_price))
        current_values_map[symbol] = current_price_decimal

    # Filter holdings to only include those we have data for
    valid_symbols = list(historical_returns_map.keys())
    valid_holdings = [h for h in holdings if h.symbol in valid_symbols]

    if not valid_holdings:
        logger.warning(f"Could not calculate VaR for user {user.id}. No valid data for any holdings.")
        return None # Or return 0 VaR with appropriate message

    # Calculate current value for each valid holding and total portfolio value
    holding_values : Dict[str, decimal.Decimal] = {}
    for holding in valid_holdings:
        value = current_values_map[holding.symbol] * decimal.Decimal(holding.quantity)
        holding_values[holding.symbol] = value
        total_portfolio_value += value

    if total_portfolio_value <= ZERO_DECIMAL:
         logger.info(f"Total portfolio value is zero or negative for user {user.id}. VaR is 0.")
         # This might happen if all current prices were fetched as 0 or negative
         return {
            "var_amount": ZERO_DECIMAL,
            "confidence_level": confidence_level,
            "lookback_days": lookback_days,
            "portfolio_value": total_portfolio_value,
            "message": "Total holdings value is zero or negative."
        }

    # 3. Combine Historical Returns based on Current Weights
    # Create a DataFrame with aligned dates for all valid symbols' returns
    returns_df = pd.concat(historical_returns_map, axis=1, join='inner') # Use inner join to get common dates
    if len(returns_df) < lookback_days * 0.8: # Check if enough common dates exist
         logger.warning(f"Insufficient common historical dates ({len(returns_df)}) across portfolio symbols for user {user.id}. Cannot calculate VaR reliably.")
         return None

    # Calculate weights
    weights = {symbol: float(holding_values[symbol] / total_portfolio_value) for symbol in valid_symbols}
    # Ensure weights align with returns_df columns
    aligned_weights = pd.Series({symbol: weights[symbol] for symbol in returns_df.columns})

    # Calculate historical portfolio returns
    portfolio_daily_returns = returns_df.dot(aligned_weights)

    # 4. Simulate Daily P&L
    simulated_pnl_values = portfolio_daily_returns * float(total_portfolio_value) # Use float for numpy calculation

    # 5. Calculate VaR using NumPy percentile
    if simulated_pnl_values.empty or simulated_pnl_values.isna().all():
         logger.warning(f"Simulated PnL values are empty or all NaN for user {user.id}. Cannot calculate VaR.")
         return None

    # VaR = Potential loss, so calculate the percentile corresponding to the confidence level tail
    # e.g., for 95% confidence, calculate the 5th percentile (1 - 0.95 = 0.05 => 5th percentile)
    var_percentile = (1.0 - confidence_level) * 100.0
    var_at_percentile = np.percentile(simulated_pnl_values.dropna(), var_percentile)

    # VaR is typically reported as a positive value representing the loss
    var_amount = max(ZERO_DECIMAL, -decimal.Decimal(str(var_at_percentile))) # Ensure positive or zero

    logger.info(f"VaR Calculated for user {user.id}: Amount={var_amount:.2f}, Confidence={confidence_level}, Lookback={lookback_days}")

    return {
        "var_amount": var_amount,
        "confidence_level": confidence_level,
        "lookback_days": lookback_days,
        "portfolio_value": total_portfolio_value,
        "message": f"Calculated based on {len(valid_symbols)} symbols." + (f" Excluded symbols due to data issues: {fetch_errors}" if fetch_errors else "")
    }