import yfinance as yf
import pandas as pd
from fastapi import HTTPException, status
import logging
import time   # For caching
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- In-Memory Cache ---
# Structure: {'function_symbol': {'timestamp': float, 'data': Any}}
_cache: Dict[str, Dict[str, Any]] = {}
CACHE_DURATION_SECONDS = 60 * 1 # Cache data for 1 minute

def _get_from_cache(key: str) -> Optional[Any]:
    """Checks cache for valid data."""
    if key in _cache:
        cached_item = _cache[key]
        if time.time() - cached_item['timestamp'] < CACHE_DURATION_SECONDS:
            logger.info(f"Cache hit for key: {key}")
            return cached_item['data']
        else:
            logger.info(f"Cache expired for key: {key}")
            del _cache[key] # Remove expired item
    logger.info(f"Cache miss for key: {key}")
    return None

def _set_cache(key: str, data: Any):
    """Sets data in cache."""
    if data is not None: # Don't cache None results (errors)
         _cache[key] = {'timestamp': time.time(), 'data': data}
         logger.info(f"Cached data for key: {key}")

def get_current_price(symbol: str) -> Optional[float]:
    """Fetches the latest available price for a given stock symbol using yfinance."""
    cache_key = f"current_price_{symbol.upper()}"
    cached_data = _get_from_cache(cache_key)
    if cached_data is not None:
        return float(cached_data) # Return cached float

    try:
        ticker = yf.Ticker(symbol.upper())
        # Use fast_info for potentially quicker access to recent price data
        last_price = ticker.fast_info.get('last_price')

        if last_price is not None:
             price = float(last_price)
             _set_cache(cache_key, price) # Cache the price
             return price
        else:
             # Fallback: Get the most recent closing price if fast_info didn't work
             logger.warning(f"fast_info.last_price not available for {symbol}. Fetching history.")
             hist = ticker.history(period="5d", interval="1d") # Fetch recent days
             if not hist.empty:
                 # Get the last available closing price
                 last_close = hist['Close'].iloc[-1]
                 price = float(last_close)
                 _set_cache(cache_key, price) # Cache the fallback price
                 return price
             else:
                 logger.warning(f"Could not retrieve current or recent closing price for {symbol} using yfinance.")
                 return None

    except Exception as e:
        logger.error(f"yfinance error fetching current price for {symbol}: {e}", exc_info=False) # exc_info=False to avoid overly long tracebacks for common symbol errors
        return None

def get_historical_data(
    symbol: str,
    lookback_days: int = 252,
) -> Optional[pd.DataFrame]:
    """
    Fetches daily historical data for a symbol using yfinance.
    Returns a pandas DataFrame with columns renamed to match app expectations
    (e.g., 'adjusted_close', 'volume', 'open', 'high', 'low') or None.
    """
    # Note: Caching DataFrames can use significant memory. Use cautiously or implement
    # more robust caching if needed. For now, we cache based on symbol & lookback.
    cache_key = f"hist_{symbol.upper()}_{lookback_days}d"
    cached_data = _get_from_cache(cache_key)
    if cached_data is not None:
        # Ensure cached data is a DataFrame (might need serialization/deserialization for robust caching)
         if isinstance(cached_data, pd.DataFrame):
              return cached_data.copy() # Return a copy to prevent mutation issues
         else:
              logger.warning(f"Cache contained non-DataFrame for key {cache_key}. Refetching.")


    try:
        ticker = yf.Ticker(symbol.upper())

        # Calculate start date (go back further to ensure enough trading days)
        # Trading days approx 252/year. Calendar days ~365.
        # Go back roughly 1.5x calendar days to account for weekends/holidays.
        end_date = pd.Timestamp.today()
        start_date = end_date - pd.Timedelta(days=int(lookback_days * 1.7)) # Fetch more days

        # Fetch historical data using yfinance
        hist_df = ticker.history(start=start_date, end=end_date, interval="1d")

        if hist_df.empty:
            logger.warning(f"yfinance returned empty history for {symbol} for the period.")
            return None

        # Use 'Adj Close' if available, otherwise fallback to 'Close'
        if 'Adj Close' in hist_df.columns:
            close_col = 'Adj Close'
        elif 'Close' in hist_df.columns:
            close_col = 'Close'
        else:
            logger.error(f"Neither 'Adj Close' nor 'Close' found in yfinance history for {symbol}")
            return None

        # Select and rename columns to match what the rest of the app expects
        # VaR service expects: 'open', 'high', 'low', 'adjusted_close', 'volume'
        rename_map = {
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            close_col: 'adjusted_close', # Map chosen close column to 'adjusted_close'
            'Volume': 'volume'
        }
        # Filter for columns we can potentially rename and drop others
        cols_to_keep = [col for col in rename_map.keys() if col in hist_df.columns]
        if not cols_to_keep:
             logger.error(f"No usable columns found in yfinance history for {symbol}")
             return None

        processed_df = hist_df[cols_to_keep].rename(columns=rename_map)

        # Ensure index is datetime
        processed_df.index = pd.to_datetime(processed_df.index)
        processed_df = processed_df.sort_index(ascending=True)

        # Ensure required columns exist after rename
        if 'adjusted_close' not in processed_df.columns:
             logger.error(f"'adjusted_close' column missing after processing for {symbol}")
             return None

        # Cache the processed DataFrame
        _set_cache(cache_key, processed_df.copy())

        return processed_df

    except Exception as e:
        logger.error(f"yfinance error fetching historical data for {symbol}: {e}", exc_info=False)
        return None
    