import uuid
from typing import Any

from fastapi import APIRouter, status

from src.lib.dependencies import CurrentUser, DBSession
from src.saved_resources import service
from src.saved_resources.schemas import (
    AddCustomLinkRequest,
    BatchEvaluateRequest,
    BulkSaveResourceRequest,
    BulkSaveResourceResponse,
    EvaluateSingleRequest,
    SavedResourceListResponse,
    SavedResourceResponse,
    SaveResourceRequest,
)

router = APIRouter()


@router.get("")
async def list_saved_resources_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    preset_id: uuid.UUID | None = None,
) -> SavedResourceListResponse:
    """List grouped saved resources in the library."""
    user_id = uuid.UUID(current_user.id)
    return await service.list_saved_resources(db, user_id, preset_id)


@router.post("")
async def toggle_save_resource_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: SaveResourceRequest,
) -> SavedResourceResponse:
    """Toggle save a resource from discovery defaults to idempotent insert."""
    user_id = uuid.UUID(current_user.id)
    return await service.save_resource(db, user_id, request)


@router.post("/bulk")
async def bulk_save_resources_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: BulkSaveResourceRequest,
) -> BulkSaveResourceResponse:
    """Save multiple resources in a single request."""
    user_id = uuid.UUID(current_user.id)
    return await service.bulk_save_resources(db, user_id, request)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_resource_endpoint(
    id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> None:
    """Remove a saved resource from library."""
    user_id = uuid.UUID(current_user.id)
    await service.delete_saved_resource(db, user_id, id)


@router.post("/link")
async def add_custom_link_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: AddCustomLinkRequest,
) -> SavedResourceResponse:
    """Add and scrape a custom link."""
    user_id = uuid.UUID(current_user.id)
    return await service.add_custom_link(db, user_id, request)


@router.post("/evaluate")
async def evaluate_saved_resources_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: BatchEvaluateRequest,
) -> dict[str, Any]:
    """Batch evaluate unevaluated library resources within a preset+query group."""
    user_id = uuid.UUID(current_user.id)
    return await service.evaluate_saved_resources(
        db, user_id, request.preset_id, request.search_query
    )


@router.post("/evaluate-single")
async def evaluate_single_resource_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: EvaluateSingleRequest,
) -> SavedResourceResponse:
    """Evaluate a single saved resource."""
    user_id = uuid.UUID(current_user.id)
    return await service.evaluate_single_resource(
        db, user_id, request.saved_resource_id
    )
