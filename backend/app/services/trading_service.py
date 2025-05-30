from app.db.session import SessionLocal
from sqlalchemy.orm import Session
from typing import Union, List, Dict, Optional
from app.models.user import User
from app.models.trade import Trade, TradeType as ModelTradeType
from app.models.pending_order import PendingOrder
from app.models.enums import OrderType, OrderStatus
from app.schemas.order import OrderCreate
from app.schemas.trade import Trade as TradeSchema
from app.schemas.pending_order import PendingOrder as PendingOrderSchema
from app.crud import crud_account, crud_holding, crud_trade, crud_pending_order, crud_user, crud_portfolio_snapshot
from app.services import market_data_service, portfolio_service
from fastapi import HTTPException, status
import decimal
import logging

logger = logging.getLogger(__name__)

# Helper function for the actual database updates for an executed trade
def _execute_trade_updates(
    db: Session,
    user: User,
    symbol: str,
    quantity: int,
    execution_price: decimal.Decimal,
    execution_type: ModelTradeType # Use BUY/SELL for the actual trade record
) -> Trade:
    """ Performs DB updates for an executed trade. Assumes validation passed. Does NOT commit."""
    db_account = crud_account.get_or_create_account(db=db, user=user)
    db_holding = crud_holding.get_holding(db=db, user_id=user.id, symbol=symbol)

    if execution_type == ModelTradeType.BUY:
        order_cost = execution_price * quantity
        # Check funds again just before execution
        if db_account.cash_balance < order_cost:
             raise ValueError("Insufficient funds at time of execution.")
        db_account.cash_balance -= order_cost
        if db_holding:
            crud_holding.update_holding_on_buy(db_holding, quantity, execution_price)
        else:
            db_holding = crud_holding.create_holding(db, user.id, symbol, quantity, execution_price)
            db.add(db_holding) # Add new holding to session

    elif execution_type == ModelTradeType.SELL:
         # Check shares again just before execution
        if db_holding is None or db_holding.quantity < quantity:
             raise ValueError("Insufficient shares at time of execution.")
        proceeds = execution_price * quantity
        db_account.cash_balance += proceeds
        crud_holding.update_holding_on_sell(db_holding, quantity)
        if db_holding.quantity == 0:
            crud_holding.delete_holding(db, db_holding) # Delete if quantity is zero

    # Record the actual trade
    db_trade = crud_trade.create_trade(
        db=db, user_id=user.id, symbol=symbol, quantity=quantity,
        price=execution_price, trade_type=execution_type
    )
    db.add(db_trade) # Add trade to session
    db.flush() # Ensure trade gets ID etc.
    db.refresh(db_trade)
    return db_trade


def place_order(db: Session, user: User, order: OrderCreate) -> Union[Trade, PendingOrder]:
    """Handles placement of Market or Limit orders."""
    symbol = order.symbol
    quantity = order.quantity
    order_type = order.order_type

    try:
        # --- Market Order Logic ---
        if order_type in [OrderType.MARKET_BUY, OrderType.MARKET_SELL]:
            if order.limit_price is not None: # Validation already in Pydantic, but double-check
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Limit price must not be provided for Market orders.")

            current_price = market_data_service.get_current_price(symbol)
            if current_price is None:
                logger.warning(f"Market Order Fail: Could not fetch price for {symbol} for user {user.id}")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Market price for {symbol} unavailable.")

            execution_price = decimal.Decimal(str(current_price))
            # Map Market OrderType to TradeType for execution record
            execution_type = ModelTradeType.BUY if order_type == OrderType.MARKET_BUY else ModelTradeType.SELL

            # Perform the actual execution and DB updates
            db_trade = _execute_trade_updates(db, user, symbol, quantity, execution_price, execution_type)
            db.commit() # Commit the transaction for market order
            logger.info(f"User {user.id} Market {execution_type.value} {quantity} {symbol} @ {execution_price:.2f}")
            return db_trade

        # --- Limit Order Logic ---
        elif order_type in [OrderType.LIMIT_BUY, OrderType.LIMIT_SELL]:
            if order.limit_price is None: # Validation already in Pydantic, but double-check
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Limit price is required for Limit orders.")

            limit_price = order.limit_price

            # Initial validation based on limit price
            db_account = crud_account.get_or_create_account(db=db, user=user)
            if order_type == OrderType.LIMIT_BUY:
                required_cash = limit_price * quantity
                if db_account.cash_balance < required_cash:
                     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient funds to place limit buy. Required: {required_cash:.2f}, Available: {db_account.cash_balance:.2f}")
            elif order_type == OrderType.LIMIT_SELL:
                db_holding = crud_holding.get_holding(db=db, user_id=user.id, symbol=symbol)
                if db_holding is None or db_holding.quantity < quantity:
                    held_qty = db_holding.quantity if db_holding else 0
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient shares to place limit sell {symbol}. Held: {held_qty}, Trying to sell: {quantity}")

            # Create Pending Order record
            pending_order = crud_pending_order.create_pending_order(db=db, user_id=user.id, order_data=order)
            db.commit() # Commit the creation of the pending order
            db.refresh(pending_order) # Ensure all fields are loaded
            logger.info(f"User {user.id} Limit {order_type.value} {quantity} {symbol} @ {limit_price:.2f} PLACED (Pending ID: {pending_order.id})")
            return pending_order # Return the newly created pending order

        else: # Should not happen if OrderType enum is used correctly
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid order type specified.")

    except HTTPException as http_exc:
        db.rollback()
        logger.warning(f"Order placement failed for user {user.id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error during place_order for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the order."
        )

# --- Add Cancel Order Service Function ---
def cancel_pending_order(db: Session, user: User, order_id: int) -> PendingOrder:
    """Cancels a pending order if it belongs to the user and is still pending."""
    db_order = crud_pending_order.get_pending_order_by_id(db=db, order_id=order_id, user_id=user.id)

    if db_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending order not found or doesn't belong to user.")

    if db_order.status != OrderStatus.PENDING:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Order is already {db_order.status.value.lower()} and cannot be cancelled.")

    try:
        updated_order = crud_pending_order.update_pending_order_status(db=db, db_order=db_order, status=OrderStatus.CANCELLED)
        db.commit()
        db.refresh(updated_order)
        logger.info(f"User {user.id} cancelled pending order {order_id} ({updated_order.symbol})")
        return updated_order
    except Exception as e:
         db.rollback()
         logger.error(f"Error cancelling order {order_id} for user {user.id}: {e}", exc_info=True)
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not cancel order.")
     
     
def _check_and_execute_logic(db: Session) -> Dict[str, int]:
    """
    Fetches pending orders, checks market prices, and attempts execution.
    Manages transaction commit/rollback on a per-order basis.
    Returns a summary of actions taken.
    """
    logger.info("Starting pending order check cycle...")
    checked_count = 0
    executed_count = 0
    failed_count = 0

    # 1. Fetch All Pending Orders (across all users)
    pending_orders: List[PendingOrder] = crud_pending_order.get_all_pending_orders(db=db)
    checked_count = len(pending_orders)
    if not pending_orders:
        logger.info("No pending orders found to check.")
        return {"checked": 0, "executed": 0, "failed": 0}

    # 2. Optimize Price Fetching
    unique_symbols = list(set([order.symbol for order in pending_orders]))
    current_prices: Dict[str, Optional[decimal.Decimal]] = {}
    logger.info(f"Checking prices for {len(unique_symbols)} unique symbols...")
    for symbol in unique_symbols:
        price = market_data_service.get_current_price(symbol)
        current_prices[symbol] = decimal.Decimal(str(price)) if price is not None else None

    logger.info(f"Finished fetching prices. Processing {checked_count} pending orders...")

    # 3. Iterate and Attempt Execution
    for order in pending_orders:
        current_price_decimal = current_prices.get(order.symbol)

        # Skip if price couldn't be fetched for this symbol
        if current_price_decimal is None:
            logger.warning(f"Skipping order {order.id} for {order.symbol} - could not fetch current price during check.")
            continue

        should_execute = False
        execution_price = order.limit_price

        # Check execution conditions
        if order.order_type == OrderType.LIMIT_BUY and current_price_decimal <= order.limit_price:
            should_execute = True
        elif order.order_type == OrderType.LIMIT_SELL and current_price_decimal >= order.limit_price:
            should_execute = True

        if not should_execute:
            continue # Condition not met, move to next order

        # --- Attempt Execution (If should_execute is True) ---
        logger.info(f"Condition met for order {order.id}. Attempting execution...")
        try:
            # --- Step 1: Fetch the User object ---
            user = crud_user.get_user(db, user_id=order.user_id)
            if not user:
                # Should not happen if order exists, but good to check
                raise ValueError(f"User with ID {order.user_id} not found for order {order.id}")
            # --- End Fetch User ---

            # --- Step 2: Re-validate using the fetched User object ---
            # Fetch fresh account/holding state within this attempt's scope
            # Pass the full 'user' object now
            db_account = crud_account.get_or_create_account(db=db, user=user) # <-- Pass user object
            db_holding = crud_holding.get_holding(db=db, user_id=user.id, symbol=order.symbol)
            # --- End Re-validate ---

            execution_type = ModelTradeType.BUY if order.order_type == OrderType.LIMIT_BUY else ModelTradeType.SELL

            # Perform final validation
            if execution_type == ModelTradeType.BUY:
                required_cash = execution_price * order.quantity
                if db_account.cash_balance < required_cash:
                    raise ValueError(f"Insufficient funds at execution. Have {db_account.cash_balance:.2f}, need {required_cash:.2f}")
            elif execution_type == ModelTradeType.SELL:
                if db_holding is None or db_holding.quantity < order.quantity:
                     held_qty = db_holding.quantity if db_holding else 0
                     raise ValueError(f"Insufficient shares at execution. Have {held_qty}, need {order.quantity}")

            # Call the helper function, passing the full user object
            executed_trade = _execute_trade_updates(
                db=db,
                user=user,
                symbol=order.symbol,
                quantity=order.quantity,
                execution_price=execution_price,
                execution_type=execution_type
            )

            # Update the pending order status to EXECUTED
            crud_pending_order.update_pending_order_status(db=db, db_order=order, status=OrderStatus.EXECUTED)

            db.commit() # Commit transaction for THIS successful order execution
            executed_count += 1
            logger.info(f"Successfully executed pending order {order.id}. Trade ID: {executed_trade.id}")

        except Exception as exec_error:
            db.rollback() # Rollback changes for THIS specific failed order attempt
            failed_count += 1
            # Log the specific error (ValueError from validation or other exceptions)
            logger.error(f"Failed to execute pending order {order.id} for user {order.user_id}: {exec_error}", exc_info=False) # Set exc_info=True for full traceback if needed

    summary = {"checked": checked_count, "executed": executed_count, "failed": failed_count}
    logger.info(f"Finished pending order check cycle. Summary: {summary}")
    return summary

def check_pending_orders_job():
    """
    Job function called by the scheduler. Creates a DB session,
    calls the core logic, and handles session closing/errors.
    """
    logger.info("Scheduler starting check_pending_orders_job...")
    db: Session | None = None
    try:
        db = SessionLocal() # Create a new session for this job run
        result = _check_and_execute_logic(db) # Call the existing logic
        logger.info(f"Scheduler job finished. Results: {result}")
    except Exception as e:
        # Log any exceptions that weren't caught within _check_and_execute_logic
        logger.error(f"Error during scheduled execution of check_pending_orders_job: {e}", exc_info=True)
        if db:
            db.rollback() # Rollback session if error occurred at job level
    finally:
        if db:
            db.close() # Ensure the session is always closed
            logger.info("Database session closed for scheduler job.")