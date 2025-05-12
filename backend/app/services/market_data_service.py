import pandas as pd
import logging
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

# Alpaca SDK imports
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockLatestTradeRequest, StockBarsRequest
from alpaca.data.timeframe import TimeFrame, TimeFrameUnit
from alpaca.data.enums import DataFeed

from app.core.config import ALPACA_API_KEY_ID, ALPACA_API_SECRET_KEY, ALPACA_PAPER_TRADING

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Alpaca API Client Initialization ---
if ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY:
    stock_client = StockHistoricalDataClient(
        api_key=ALPACA_API_KEY_ID,
        secret_key=ALPACA_API_SECRET_KEY
    )
    logger.info("Alpaca StockHistoricalDataClient initialized.")
else:
    stock_client = None
    logger.error("Alpaca API Keys not found. Market data service will be non-functional.")

# --- Cache Configuration ---
_cache: Dict[str, Dict[str, Any]] = {}
CACHE_SUCCESS_DURATION_SECONDS = 60 * 15  # Cache successful data for 15 minutes
CACHE_ERROR_DURATION_SECONDS = 60 * 2     # Cache errors for 2 minutes
ERROR_MARKER = "API_ERROR"                # Marker for general API errors

ALPACA_CALL_DELAY_SECONDS = 0.3
_last_alpaca_call_time = 0

def _throttle_alpaca_call():
    global _last_alpaca_call_time
    now = time.monotonic()
    time_since_last_call = now - _last_alpaca_call_time
    if time_since_last_call < ALPACA_CALL_DELAY_SECONDS:
        sleep_time = ALPACA_CALL_DELAY_SECONDS - time_since_last_call
        logger.debug(f"Throttling Alpaca call. Sleeping for {sleep_time:.2f} seconds.")
        time.sleep(sleep_time)
    _last_alpaca_call_time = time.monotonic()

def _get_from_cache(key: str) -> Optional[Any]:
    if key in _cache:
        cached_item = _cache[key]

        # Determine if the cached data IS the error marker string
        is_cached_data_error_marker = (isinstance(cached_item['data'], str) and 
                                       cached_item['data'] == ERROR_MARKER)

        expiry_duration = CACHE_ERROR_DURATION_SECONDS if is_cached_data_error_marker else CACHE_SUCCESS_DURATION_SECONDS

        if time.time() - cached_item['timestamp'] < expiry_duration:
            if is_cached_data_error_marker:
                logger.info(f"Cache hit for key: {key} (Value: ERROR_MARKER)")
                return ERROR_MARKER
            else:
                logger.info(f"Cache hit for key: {key} (Value: Data)")
                if isinstance(cached_item['data'], pd.DataFrame):
                    return cached_item['data'].copy() 
                return cached_item['data']
        else:
            logger.info(f"Cache expired for key: {key}")
            try:
                del _cache[key]
            except KeyError:
                pass
    logger.info(f"Cache miss for key: {key}")
    return None

def _set_cache(key: str, data: Any):
    if data is None: # Don't cache None
        logger.debug(f"Not caching None result for key: {key}")
        return

    # Determine if the actual 'data' payload is the ERROR_MARKER
    is_error_marker_being_cached = (isinstance(data, str) and data == ERROR_MARKER)
    # ^^^ Check if 'data' is a string and specifically our ERROR_MARKER

    cache_duration = CACHE_ERROR_DURATION_SECONDS if is_error_marker_being_cached else CACHE_SUCCESS_DURATION_SECONDS

    _cache[key] = {'timestamp': time.time(), 'data': data}
    status_message = "ERROR_MARKER" if is_error_marker_being_cached else "Data"
    logger.info(f"Cached {status_message} for key: {key} (Duration: {cache_duration}s)")


def get_current_price(symbol: str) -> Optional[float]:
    """Fetches the latest trade price for a given stock symbol using Alpaca."""
    if not stock_client: return None
    upper_symbol = symbol.upper()
    cache_key = f"alpaca_current_price_{upper_symbol}"
    cached_value = _get_from_cache(cache_key)

    if cached_value is not None:
        return None if cached_value == ERROR_MARKER else float(cached_value)

    logger.debug(f"Cache miss for {cache_key}, preparing Alpaca call for current price.")
    _throttle_alpaca_call()

    try:
        request_params = StockLatestTradeRequest(symbol_or_symbols=upper_symbol)
        latest_trade = stock_client.get_stock_latest_trade(request_params)

        if latest_trade and upper_symbol in latest_trade and latest_trade[upper_symbol]:
            price = float(latest_trade[upper_symbol].price)
            _set_cache(cache_key, price)
            logger.info(f"Fetched current price for {upper_symbol}: {price}")
            return price
        else:
            logger.warning(f"No latest trade data found for {upper_symbol} from Alpaca.")
            _set_cache(cache_key, ERROR_MARKER) # Cache as error if no data
            return None
    except Exception as e:
        logger.error(f"Alpaca API error fetching current price for {upper_symbol}: {e}", exc_info=False)
        _set_cache(cache_key, ERROR_MARKER) # Cache general errors
        return None

def get_historical_data(
    symbol: str,
    lookback_days: int = 252,
) -> Optional[pd.DataFrame]:
    """
    Fetches daily historical bars for a symbol using Alpaca from IEX feed.
    Returns a pandas DataFrame with columns: 'open', 'high', 'low', 'adjusted_close', 'volume'.
    """
    if not stock_client:
        logger.error("Alpaca stock_client not initialized. Cannot fetch historical data.")
        return None
    upper_symbol = symbol.upper()
    cache_key = f"alpaca_hist_{upper_symbol}_{lookback_days}d_iex"
    cached_value = _get_from_cache(cache_key)

    if cached_value is not None:  # Cache hit
        if cached_value == ERROR_MARKER:
            logger.info(f"Cache hit with ERROR_MARKER for {cache_key}. Returning None.")
            return None # It was a cached error
        elif isinstance(cached_value, pd.DataFrame):
            logger.info(f"Cache hit with DataFrame for {cache_key}. Returning copy.")
            return cached_value.copy() # It was cached data, return a copy
        else:
            logger.warning(f"Cache hit with unexpected data type for {cache_key}: {type(cached_value)}. Treating as miss.")

    # If cached_value was None (miss/expired) or an unexpected type, proceed to fetch:
    logger.debug(f"Proceeding to fetch for {cache_key} (cache miss, expiry, or unexpected cached type).")
    _throttle_alpaca_call()

    try:
        end_dt = datetime.now()
        start_dt = end_dt - timedelta(days=int(lookback_days * 1.7) + 15)

        logger.debug(f"Requesting bars for {upper_symbol} from {start_dt.date()} to {end_dt.date()} with feed IEX")

        request_params = StockBarsRequest(
            symbol_or_symbols=[upper_symbol],
            timeframe=TimeFrame(amount=1, unit=TimeFrameUnit.Day),
            start=start_dt,
            end=end_dt,
            feed=DataFeed.IEX
        )

        bars_data_response = stock_client.get_stock_bars(request_params)
        
        logger.debug(f"Raw bars_data_response type for {upper_symbol}: {type(bars_data_response)}")

        if not bars_data_response or not bars_data_response.data or upper_symbol not in bars_data_response.data:
            logger.warning(f"No historical bar data returned in response for {upper_symbol} from Alpaca (IEX feed).")
            _set_cache(cache_key, ERROR_MARKER)
            return None

        bars_for_symbol = bars_data_response[upper_symbol] # This is List[Bar]

        if not bars_for_symbol: # Check if the list itself is empty
            logger.warning(f"Bar list is empty for {upper_symbol} from Alpaca response.")
            _set_cache(cache_key, ERROR_MARKER)
            return None

        data_for_df = [{
            'timestamp': bar.timestamp,
            'open': bar.open,
            'high': bar.high,
            'low': bar.low,
            'close': bar.close,
            'volume': bar.volume
        } for bar in bars_for_symbol]

        df = pd.DataFrame(data_for_df)

        if df.empty:
            logger.warning(f"DataFrame created from Bar list is empty for {upper_symbol}.")
            _set_cache(cache_key, ERROR_MARKER)
            return None
        
        df = df.set_index('timestamp')

        logger.debug(f"DataFrame constructed for {upper_symbol}. Shape: {df.shape}. Columns: {df.columns.tolist()}. Index type: {type(df.index)}")

        # Rename columns
        df = df.rename(columns={
            'open': 'open',
            'high': 'high',
            'low': 'low',
            'close': 'adjusted_close', # Using IEX close as 'adjusted_close'
            'volume': 'volume'
        })

        expected_cols = ['open', 'high', 'low', 'adjusted_close', 'volume']
        df = df[[col for col in expected_cols if col in df.columns]]

        if 'adjusted_close' not in df.columns:
            logger.error(f"'adjusted_close' (from 'close') column missing after processing for {upper_symbol}.")
            _set_cache(cache_key, ERROR_MARKER)
            return None

        df = df.sort_index(ascending=True)
        
        for col in df.columns:
            if col not in ['symbol']:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        df = df.dropna(subset=['adjusted_close'])

        if df.empty:
            logger.warning(f"DataFrame empty after cleaning for {upper_symbol}.")
            _set_cache(cache_key, ERROR_MARKER)
            return None
            
        logger.info(f"Successfully processed historical data for {upper_symbol}. Shape: {df.shape}")
        _set_cache(cache_key, df.copy())
        return df.copy()

    except Exception as e:
        logger.error(f"Alpaca API error or processing error fetching historical data for {upper_symbol}: {e}", exc_info=True)
        _set_cache(cache_key, ERROR_MARKER)
        return None