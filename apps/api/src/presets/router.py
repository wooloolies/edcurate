import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from src.common.models.pagination import PaginatedResponse, PaginationParams
from src.lib.dependencies import CurrentUser, DBSession
from src.presets import service
from src.presets.schemas import (
    PresetCreate,
    PresetDefaultResponse,
    PresetResponse,
    PresetUpdate,
)

router = APIRouter()


@router.post("/", response_model=PresetResponse, status_code=status.HTTP_201_CREATED)
async def create_preset(
    body: PresetCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> PresetResponse:
    """Create a new classroom preset."""
    user_id = uuid.UUID(current_user.id)
    preset = await service.create_preset(db, user_id, body)
    return PresetResponse.model_validate(preset)


@router.get("/", response_model=PaginatedResponse[PresetResponse])
async def list_presets(
    db: DBSession,
    current_user: CurrentUser,
    pagination: Annotated[PaginationParams, Depends()],
) -> PaginatedResponse[PresetResponse]:
    """List classroom presets for the current user (paginated)."""
    user_id = uuid.UUID(current_user.id)
    return await service.list_presets(db, user_id, pagination)


@router.get("/{preset_id}", response_model=PresetResponse)
async def get_preset(
    preset_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> PresetResponse:
    """Get a single classroom preset by id."""
    user_id = uuid.UUID(current_user.id)
    preset = await service.get_preset(db, user_id, preset_id)
    return PresetResponse.model_validate(preset)


@router.put("/{preset_id}", response_model=PresetResponse)
async def update_preset(
    preset_id: uuid.UUID,
    body: PresetUpdate,
    db: DBSession,
    current_user: CurrentUser,
) -> PresetResponse:
    """Full update of a classroom preset."""
    user_id = uuid.UUID(current_user.id)
    preset = await service.update_preset(db, user_id, preset_id, body)
    return PresetResponse.model_validate(preset)


@router.delete("/{preset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_preset(
    preset_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> None:
    """Delete a classroom preset. Returns 409 if it is the default."""
    user_id = uuid.UUID(current_user.id)
    await service.delete_preset(db, user_id, preset_id)


@router.patch("/{preset_id}/default", response_model=PresetDefaultResponse)
async def set_default_preset(
    preset_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> PresetDefaultResponse:
    """Set a classroom preset as the default (atomic swap)."""
    user_id = uuid.UUID(current_user.id)
    preset = await service.set_default_preset(db, user_id, preset_id)
    return PresetDefaultResponse.model_validate(preset)
