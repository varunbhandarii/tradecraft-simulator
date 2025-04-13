from sqlalchemy.orm import Session
from app.models.user import User
from app.models.trade import TradeType, Trade
from app.schemas.order import OrderCreate
from app.crud import crud_account, crud_holding, crud_trade
from app.services import market_data_service
from fastapi import HTTPException, status
import decimal
import logging

logger = logging.getLogger(__name__)

def place_order(db: Session, user: User, order: OrderCreate) -> Trade:
    """Places a buy or sell order."""

    symbol = order.symbol
    quantity = order.quantity
    trade_type = order.trade_type

    # 1. Get Current Market Price
    current_price = market_data_service.get_current_price(symbol)
    if current_price is None:
        logger.warning(f"Could not fetch market price for {symbol} for user {user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot place order: Market price for {symbol} is currently unavailable."
        )
    current_price_decimal = decimal.Decimal(str(current_price)) # Convert float to Decimal

    # 2. Get User Account (or create if first trade)
    db_account = crud_account.get_or_create_account(db=db, user=user)

    # 3. Get Relevant Holding (if exists)
    db_holding = crud_holding.get_holding(db=db, user_id=user.id, symbol=symbol)

    # --- Transaction Start ---
    try:
        # 4. Validation & Execution
        if trade_type == TradeType.BUY:
            order_cost = current_price_decimal * quantity
            # Check funds
            if db_account.cash_balance < order_cost:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient funds. Required: {order_cost:.2f}, Available: {db_account.cash_balance:.2f}"
                )

            # Update Account
            db_account.cash_balance -= order_cost

            # Update or Create Holding
            if db_holding:
                crud_holding.update_holding_on_buy(db_holding, quantity, current_price_decimal)
            else:
                db_holding = crud_holding.create_holding(db, user.id, symbol, quantity, current_price_decimal)
                # Add the new holding to the session if it's created here
                db.add(db_holding)

        elif trade_type == TradeType.SELL:
            # Check if holding exists and quantity is sufficient
            if db_holding is None or db_holding.quantity < quantity:
                held_qty = db_holding.quantity if db_holding else 0
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient shares to sell {symbol}. Held: {held_qty}, Trying to sell: {quantity}"
                )

            proceeds = current_price_decimal * quantity

            # Update Account
            db_account.cash_balance += proceeds

            # Update Holding
            crud_holding.update_holding_on_sell(db_holding, quantity)
            # Check if holding quantity is now zero and delete if so
            if db_holding.quantity == 0:
                 crud_holding.delete_holding(db, db_holding)

        # 5. Record Trade
        db_trade = crud_trade.create_trade(
            db=db,
            user_id=user.id,
            symbol=symbol,
            quantity=quantity,
            price=current_price_decimal,
            trade_type=trade_type
        )
        db.add(db_trade) # Add trade to session

        # 6. Commit Transaction
        db.commit()

        # Refresh objects to get updated state if needed by caller
        db.refresh(db_account)
        if db_holding and db_holding.quantity > 0 :
             db.refresh(db_holding)
        db.refresh(db_trade)

        logger.info(f"User {user.id} {trade_type.value} {quantity} {symbol} @ {current_price_decimal:.2f}")
        return db_trade # Return the recorded trade details

    except HTTPException as http_exc:
        db.rollback() # Rollback on validation errors managed by HTTPException
        logger.warning(f"Order validation failed for user {user.id}: {http_exc.detail}")
        raise http_exc # Re-raise the HTTPException
    except Exception as e:
        db.rollback() # Rollback on any unexpected database or other error
        logger.error(f"Unexpected error during place_order for user {user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the order."
        )
    # --- Transaction End ---