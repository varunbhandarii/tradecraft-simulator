from fastapi import APIRouter, HTTPException, status, Depends
from app.services import market_data_service
from app.core.security import get_current_active_user
from app import schemas

router = APIRouter()

@router.get("/price/{symbol}", response_model=float)
async def get_stock_price(
    symbol: str,
    current_user: schemas.user.User = Depends(get_current_active_user) # Protect endpoint
):
    """
    Gets the latest available price for a given stock symbol.
    Requires authentication.
    """
    price = market_data_service.get_current_price(symbol)
    if price is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not fetch price for symbol: {symbol}. Check symbol or API service status.",
        )
    return price
