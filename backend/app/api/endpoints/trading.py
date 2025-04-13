from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.order import OrderCreate
from app.schemas.trade import Trade as TradeSchema
from app.services import trading_service
from app.core.security import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/orders", response_model=TradeSchema)
def place_new_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Place a new buy or sell order. Requires authentication.
    """
    try:
        trade_result = trading_service.place_order(db=db, user=current_user, order=order)
        return trade_result
    except HTTPException as e:
        raise e
    except Exception as e:
        # Catch any other unexpected errors from the service
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while placing the order."
        )