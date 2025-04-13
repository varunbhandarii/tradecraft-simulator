from sqlalchemy.orm import Session
from app.models.holding import Holding
import decimal
from typing import List

def get_holding(db: Session, user_id: int, symbol: str) -> Holding | None:
    return db.query(Holding).filter(Holding.user_id == user_id, Holding.symbol == symbol).first()

def get_all_holdings(db: Session, user_id: int) -> List[Holding]:
    return db.query(Holding).filter(Holding.user_id == user_id).all()

def create_holding(db: Session, user_id: int, symbol: str, quantity: int, purchase_price: decimal.Decimal) -> Holding:
    db_holding = Holding(
        user_id=user_id,
        symbol=symbol,
        quantity=quantity,
        average_cost_basis=purchase_price
    )
    db.add(db_holding)
    return db_holding

def update_holding_on_buy(db_holding: Holding, quantity: int, purchase_price: decimal.Decimal):
    """ Updates existing holding after a buy. Does NOT commit. """
    old_total_cost = db_holding.average_cost_basis * db_holding.quantity
    new_purchase_cost = purchase_price * quantity
    new_total_quantity = db_holding.quantity + quantity
    db_holding.average_cost_basis = (old_total_cost + new_purchase_cost) / new_total_quantity
    db_holding.quantity = new_total_quantity

def update_holding_on_sell(db_holding: Holding, quantity: int):
    """ Updates existing holding after a sell. Does NOT commit. Returns True if holding deleted. """
    db_holding.quantity -= quantity

def delete_holding(db: Session, db_holding: Holding):
     """ Deletes a holding record. Call within transaction. """
     db.delete(db_holding)