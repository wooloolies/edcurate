import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from src.lib.dependencies import CurrentUser, DBSession
from src.users.model import User, UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    db: DBSession,
    current_user: CurrentUser,
) -> UserResponse:
    """Return the profile of the currently authenticated user."""
    user_id = uuid.UUID(current_user.id)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse.model_validate(user)
