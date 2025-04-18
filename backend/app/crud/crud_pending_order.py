from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.pending_order import PendingOrder
from app.models.enums import OrderStatus, OrderType
from app.schemas.order import OrderCreate
import decimal

def create_pending_order(db: Session, user_id: int, order_data: OrderCreate) -> PendingOrder:
    """Creates a new PENDING order. Does NOT commit."""
    if order_data.limit_price is None: # Should not happen if validation passes
        raise ValueError("Limit price missing for limit order creation")

    db_order = PendingOrder(
        user_id=user_id,
        symbol=order_data.symbol,
        order_type=order_data.order_type,
        quantity=order_data.quantity,
        limit_price=order_data.limit_price,
        status=OrderStatus.PENDING
    )
    db.add(db_order)
    # Let the service handle flush/commit within its transaction
    db.flush() # Flush to get ID potentially needed by caller within transaction
    db.refresh(db_order) # Refresh to get defaults like created_at
    return db_order

def get_pending_order_by_id(db: Session, order_id: int, user_id: int) -> Optional[PendingOrder]:
    """Gets a specific pending order by ID, ensuring it belongs to the user."""
    return db.query(PendingOrder).filter(
        PendingOrder.id == order_id,
        PendingOrder.user_id == user_id
    ).first()

def get_all_pending_orders_for_user(db: Session, user_id: int) -> List[PendingOrder]:
    """Gets all orders with status PENDING for a specific user."""
    return db.query(PendingOrder).filter(
        PendingOrder.user_id == user_id,
        PendingOrder.status == OrderStatus.PENDING
    ).order_by(PendingOrder.created_at.desc()).all()

def update_pending_order_status(db: Session, db_order: PendingOrder, status: OrderStatus) -> PendingOrder:
    """Updates the status of a pending order. Does NOT commit."""
    if db_order.status != OrderStatus.PENDING:
         pass

    db_order.status = status
    db.flush()
    return db_order

# Function to get ALL pending orders (for the execution engine later)
def get_all_pending_orders(db: Session) -> List[PendingOrder]:
     """ Gets all orders across all users with status PENDING. """
     return db.query(PendingOrder).filter(PendingOrder.status == OrderStatus.PENDING).all()