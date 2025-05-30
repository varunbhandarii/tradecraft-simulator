from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.db.session import get_db
from app.schemas.portfolio import Portfolio as PortfolioSchema
from app.schemas.trade import Trade as TradeSchema
from app.schemas.portfolio_snapshot import PortfolioSnapshotResponse
from app.services import portfolio_service, risk_service
from app.crud import crud_trade, crud_portfolio_snapshot
from app.core.security import get_current_active_user
from app.models.user import User as UserModel
import decimal

router = APIRouter()

@router.get("", response_model=PortfolioSchema) # Route is /api/v1/portfolio
def get_user_portfolio(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Get the current user's portfolio including cash, holdings, and calculated values.
    Requires authentication.
    """
    return portfolio_service.get_portfolio(db=db, user=current_user)

@router.get("/trades", response_model=List[TradeSchema]) # Route is /api/v1/portfolio/trades
def get_user_trades(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Get the current user's trade history. Requires authentication.
    """
    trades = crud_trade.get_trades_for_user(db=db, user_id=current_user.id, skip=skip, limit=limit)
    return trades

@router.get("/risk/var", response_model=Dict[str, Any]) # Route is /api/v1/portfolio/risk/var
def get_portfolio_var(
    confidence_level: float = Query(0.95, gt=0, lt=1),
    lookback_days: int = Query(126, gt=10),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Calculate the Value at Risk (VaR) for the user's current portfolio
    using the Historical Simulation method.

    - confidence_level: Confidence level for VaR (e.g., 0.95 for 95%).
    - lookback_days: Number of trading days of historical data to use.
    """
    var_result = risk_service.calculate_historical_var(
        db=db,
        user=current_user,
        confidence_level=confidence_level,
        lookback_days=lookback_days
    )

    if var_result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not calculate VaR due to missing data or internal error. Check server logs."
        )

    if isinstance(var_result.get("var_amount"), decimal.Decimal):
         var_result["var_amount"] = float(var_result["var_amount"])
    if isinstance(var_result.get("portfolio_value"), decimal.Decimal):
         var_result["portfolio_value"] = float(var_result["portfolio_value"])

    return var_result

@router.get(
    "/value-history",
    response_model=List[PortfolioSnapshotResponse],
    summary="Get user's historical portfolio values"
)
def get_portfolio_value_history(
    start_date: Optional[datetime] = Query(None, description="Filter from this date (ISO format, e.g., YYYY-MM-DDTHH:MM:SSZ or YYYY-MM-DD)"),
    end_date: Optional[datetime] = Query(None, description="Filter up to this date (ISO format)"),
    limit: Optional[int] = Query(1000, description="Maximum number of data points to return", gt=0), # Default limit, must be > 0
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Retrieves a list of historical total portfolio values for the logged-in user,
    ordered by time. Useful for plotting portfolio performance.
    """
    snapshots = crud_portfolio_snapshot.get_portfolio_snapshots_for_user(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )
    # Pydantic will automatically convert the list of ORM objects to list of PortfolioSnapshotResponse
    return snapshots