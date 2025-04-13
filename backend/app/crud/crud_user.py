from sqlalchemy.orm import Session
from app.models.user import User as UserModel
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_user(db: Session, user_id: int) -> UserModel | None:
    """Gets a user by their ID."""
    return db.query(UserModel).filter(UserModel.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> UserModel | None:
    """Gets a user by their email address."""
    return db.query(UserModel).filter(UserModel.email == email).first()

def get_user_by_username(db: Session, username: str) -> UserModel | None:
    """Gets a user by their username."""
    return db.query(UserModel).filter(UserModel.username == username).first()

def create_user(db: Session, user: UserCreate) -> UserModel:
    """Creates a new user in the database."""
    hashed_password = get_password_hash(user.password)
    db_user = UserModel(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user) # Refresh to get ID and other defaults like created_at
    return db_user
