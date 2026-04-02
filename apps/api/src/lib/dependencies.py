from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.auth import (
    CurrentUser,
    CurrentUserInfo,
    OptionalUser,
    get_current_user,
    get_optional_user,
)
from src.lib.database import get_db

# Type alias for database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db)]

# Re-export auth dependencies for convenience
__all__ = [
    "CurrentUser",
    "CurrentUserInfo",
    "DBSession",
    "OptionalUser",
    "get_current_user",
    "get_optional_user",
]
