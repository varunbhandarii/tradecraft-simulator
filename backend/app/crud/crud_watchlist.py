from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy.exc import IntegrityError

from ..models.watchlist_item import WatchlistItem

import logging
logger = logging.getLogger(__name__)

def get_watchlist_item_by_symbol_for_user(
    db: Session,
    user_id: int,
    symbol: str
) -> Optional[WatchlistItem]:
    """
    Retrieves a specific watchlist item for a user by symbol.
    """
    return db.query(WatchlistItem).filter(
        WatchlistItem.user_id == user_id,
        WatchlistItem.symbol == symbol.upper()
    ).first()

def add_symbol_to_watchlist(
    db: Session,
    user_id: int,
    symbol: str
) -> WatchlistItem:
    """
    Adds a new symbol to the user's watchlist.
    """
    upper_symbol = symbol.upper()

    new_watchlist_item = WatchlistItem(
        user_id=user_id,
        symbol=upper_symbol
    )
    db.add(new_watchlist_item)
    db.flush()
    db.refresh(new_watchlist_item) # Loads the new item with all its attributes from DB
    logger.info(f"Symbol {upper_symbol} added to watchlist for user {user_id} (pending commit). Item ID: {new_watchlist_item.id}")
    return new_watchlist_item

def get_watchlist_for_user(
    db: Session,
    user_id: int
) -> List[WatchlistItem]:
    """
    Retrieves all watchlist items for a specific user, ordered by symbol.
    """
    return db.query(WatchlistItem).filter(
        WatchlistItem.user_id == user_id
    ).order_by(WatchlistItem.symbol.asc()).all()

def remove_symbol_from_watchlist(
    db: Session,
    user_id: int,
    symbol: str
) -> Optional[WatchlistItem]:
    """
    Removes a symbol from the user's watchlist.
    Returns the item that was marked for deletion if found, otherwise None.
    Does NOT commit the transaction.
    """
    upper_symbol = symbol.upper()
    item_to_delete = get_watchlist_item_by_symbol_for_user(db, user_id=user_id, symbol=upper_symbol)

    if item_to_delete:
        logger.info(f"Marking symbol {upper_symbol} for deletion from watchlist for user {user_id} (pending commit).")
        db.delete(item_to_delete)
        db.flush() # Reflects the deletion in the current session state
        return item_to_delete # Return the item that was deleted (it's still in memory until commit)
    else:
        logger.warning(f"Symbol {upper_symbol} not found in watchlist for user {user_id} to delete.")
        return None