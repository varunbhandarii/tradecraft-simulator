from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/me", response_model=schemas.user.User)
async def read_users_me(current_user: UserModel = Depends(get_current_active_user)):
    """
    Get current logged-in user's details.
    Requires authentication.
    """
    return current_user