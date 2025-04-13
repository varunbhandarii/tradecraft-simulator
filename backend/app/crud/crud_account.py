from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.user import User
import decimal

def get_account(db: Session, user_id: int) -> Account | None:
    return db.query(Account).filter(Account.user_id == user_id).first()

def create_user_account(db: Session, user: User) -> Account:
    # Uses default cash balance from model definition
    db_account = Account(user_id=user.id)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_cash_balance(db: Session, user_id: int, amount: decimal.Decimal) -> Account | None:
    """ Adds (or subtracts if amount is negative) to the cash balance """
    db_account = get_account(db=db, user_id=user_id)
    if db_account:
        db_account.cash_balance += amount
        db.commit()
        db.refresh(db_account)
        return db_account
    return None

def get_or_create_account(db: Session, user: User) -> Account:
    """ Gets account or creates one if it doesn't exist """
    db_account = get_account(db=db, user_id=user.id)
    if not db_account:
        db_account = create_user_account(db=db, user=user)
    return db_account