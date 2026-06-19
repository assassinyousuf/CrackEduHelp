from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch details of currently signed-in user."""
    return current_user
