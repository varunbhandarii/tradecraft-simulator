from sqlalchemy.orm import Session
from app.models.trade import Trade, TradeType
import decimal
from typing import List

def create_trade(db: Session, user_id: int, symbol: str, quantity: int, price: decimal.Decimal, trade_type: TradeType) -> Trade:
    db_trade = Trade(
        user_id=user_id,
        symbol=symbol,
        quantity=quantity,
        price=price,
        trade_type=trade_type
    )
    db.add(db_trade)
    return db_trade

def get_trades_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Trade]:
    return db.query(Trade)\
        .filter(Trade.user_id == user_id)\
        .order_by(Trade.timestamp.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()