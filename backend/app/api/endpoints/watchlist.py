from fastapi import APIRouter, Depends, HTTPException, status, Path, Response
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User as UserModel
from app.schemas.watchlist import WatchlistSymbolCreate, WatchlistItemResponse, WatchlistItemBase
from app.services import watchlist_service

router = APIRouter()

@router.post(
    "",
    response_model=WatchlistItemBase, # Returns the created DB item without live price
    status_code=status.HTTP_201_CREATED,
    summary="Add a symbol to the user's watchlist"
)
def add_to_watchlist(
    item_in: WatchlistSymbolCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Adds a new stock symbol to the authenticated user's watchlist.
    Prevents adding duplicate symbols for the same user.
    """
    try:
        # The service function handles duplicate checks and commits
        watchlist_item = watchlist_service.add_symbol_to_user_watchlist(
            db=db, user=current_user, symbol=item_in.symbol
        )
        return watchlist_item
    except HTTPException as e:
        raise e
    except Exception as e: # Catch any other unexpected errors
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get(
    "",
    response_model=List[WatchlistItemResponse],
    summary="Get the user's watchlist with current prices"
)
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Retrieves the authenticated user's current watchlist, with live prices
    fetched for each symbol.
    """
    return watchlist_service.get_user_watchlist_with_prices(db=db, user=current_user)


@router.delete(
    "/{symbol}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a symbol from the user's watchlist"
)
def remove_from_watchlist(
    symbol: str = Path(..., description="The stock symbol to remove from the watchlist", min_length=1, max_length=10),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Removes a specific stock symbol from the authenticated user's watchlist.
    """
    try:
        # The service function handles not found and commits
        watchlist_service.remove_symbol_from_user_watchlist(
            db=db, user=current_user, symbol=symbol
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")