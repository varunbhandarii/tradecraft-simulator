from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import List, Union
from app.db.session import get_db
from app.schemas.order import OrderCreate
from app.schemas.trade import Trade as TradeSchema
from app.schemas.pending_order import PendingOrder as PendingOrderSchema
from app.services import trading_service
from app.core.security import get_current_active_user
from app.models.user import User as UserModel
from app.crud import crud_pending_order
from app.services.trading_service import _check_and_execute_logic

router = APIRouter()

@router.post(
    "/orders",
    # Response can be either a Trade or a PendingOrder
    response_model=Union[TradeSchema, PendingOrderSchema],
    summary="Place a new Market or Limit order"
)
def place_new_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Place a new order.
    - For **Market Orders**, set `order_type` to `MARKET_BUY` or `MARKET_SELL` and omit `limit_price`. Executes immediately.
    - For **Limit Orders**, set `order_type` to `LIMIT_BUY` or `LIMIT_SELL` and provide a `limit_price`. Creates a pending order.
    Requires authentication.
    """
    try:
        result = trading_service.place_order(db=db, user=current_user, order=order)
        return result # Returns either the executed Trade or the placed PendingOrder
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing the order."
        )

@router.get(
    "/orders/pending",
    response_model=List[PendingOrderSchema],
    summary="Get user's currently pending limit orders"
)
def get_pending_orders(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Retrieves a list of the current user's limit orders that have not yet
    been executed, cancelled, or expired. Requires authentication.
    """
    return crud_pending_order.get_all_pending_orders_for_user(db=db, user_id=current_user.id)

@router.delete(
    "/orders/pending/{order_id}",
    response_model=PendingOrderSchema,
    summary="Cancel a specific pending limit order"
)
def cancel_order(
    order_id: int = Path(..., title="The ID of the pending order to cancel", gt=0),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Cancels a specific limit order placed by the current user,
    only if it is still in PENDING status. Requires authentication.
    """
    try:
        cancelled_order = trading_service.cancel_pending_order(db=db, user=current_user, order_id=order_id)
        return cancelled_order
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while cancelling the order."
        )
        
@router.post(
    "/orders/check",
    summary="Manually trigger check for pending limit orders (for testing/admin)",
    tags=["Trading", "Admin"]
)
def trigger_pending_order_check(
    db: Session = Depends(get_db),
):
    """
    Manually runs the process to check all pending limit orders against
    current market prices and executes them if conditions are met.
    """
    try:
        result = _check_and_execute_logic(db=db)
        return result
    except Exception as e:
         raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
             detail=f"An error occurred during order check: {e}"
         )
