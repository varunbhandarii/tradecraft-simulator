from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from fastapi import HTTPException, status
import decimal
import logging

from ..crud import crud_watchlist
from ..models.user import User as UserModel
from ..models.watchlist_item import WatchlistItem as WatchlistItemModel
from ..schemas.watchlist import WatchlistItemResponse
from . import market_data_service

logger = logging.getLogger(__name__)

def add_symbol_to_user_watchlist(
    db: Session, user: UserModel, symbol: str
) -> WatchlistItemModel:
    """Adds a symbol to the user's watchlist. Handles duplicates."""
    upper_symbol = symbol.upper()
    existing_item = crud_watchlist.get_watchlist_item_by_symbol_for_user(
        db=db, user_id=user.id, symbol=upper_symbol
    )
    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Symbol {upper_symbol} is already in your watchlist."
        )
    try:
        new_item = crud_watchlist.add_symbol_to_watchlist(
            db=db, user_id=user.id, symbol=upper_symbol
        )
        db.commit()
        db.refresh(new_item)
        return new_item
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Symbol {upper_symbol} is already in your watchlist."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding {upper_symbol} to watchlist for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not add symbol to watchlist."
        )

def get_user_watchlist_with_prices(
    db: Session, user: UserModel
) -> List[WatchlistItemResponse]:
    """Retrieves user's watchlist and enriches items with current prices."""
    db_watchlist_items = crud_watchlist.get_watchlist_for_user(db=db, user_id=user.id)

    watchlist_with_prices: List[WatchlistItemResponse] = []
    for item in db_watchlist_items:
        current_price_float = market_data_service.get_current_price(item.symbol)
        current_price_decimal = decimal.Decimal(str(current_price_float)) if current_price_float is not None else None

        watchlist_with_prices.append(
            WatchlistItemResponse(
                id=item.id,
                symbol=item.symbol,
                current_price=current_price_decimal,
                created_at=item.created_at
            )
        )
    return watchlist_with_prices

def remove_symbol_from_user_watchlist(
    db: Session, user: UserModel, symbol: str
) -> None: # Returns None for a 204 response
    """Removes a symbol from the user's watchlist."""
    upper_symbol = symbol.upper()
    deleted_item = crud_watchlist.remove_symbol_from_watchlist(
        db=db, user_id=user.id, symbol=upper_symbol
    )
    if not deleted_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol {upper_symbol} not found in your watchlist."
        )
    try:
        db.commit()
        logger.info(f"Symbol {upper_symbol} removed from watchlist for user {user.id}.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error committing removal of {upper_symbol} from watchlist for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not remove symbol from watchlist."
        )
    return None