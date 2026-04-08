import uuid
from typing import Any

from fastapi import APIRouter, Query, Request, status
from sse_starlette.sse import EventSourceResponse

from src.lib.dependencies import CurrentUser, DBSession
from src.saved_resources import service
from src.saved_resources.schemas import (
    AddCustomLinkRequest,
    BatchEvaluateRequest,
    EvaluateSingleRequest,
    LibraryCollectionCreate,
    LibraryCollectionResponse,
    LibraryCollectionUpdate,
    SavedResourceListResponse,
    SavedResourceResponse,
    SaveResourceRequest,
    SaveResourceToCollectionRequest,
    SuggestedCollectionResponse,
)

router = APIRouter()


@router.get("")
async def list_saved_resources_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    preset_id: uuid.UUID | None = None,
) -> SavedResourceListResponse:
    """List grouped saved resources in the library by collection."""
    user_id = uuid.UUID(current_user.id)
    return await service.list_saved_resources(db, user_id, preset_id)


@router.get("/suggested")
async def get_suggested_collections_endpoint(
    search_query: str,
    db: DBSession,
    current_user: CurrentUser,
    preset_id: uuid.UUID | None = None,
    limit: int = 5,
) -> list[SuggestedCollectionResponse]:
    """Get suggested public collections matching the search query via TF-IDF / FTS."""
    user_id = uuid.UUID(current_user.id)
    return await service.get_suggested_collections(
        db, user_id, search_query, preset_id, limit
    )


@router.post("/collections")
async def create_collection_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: LibraryCollectionCreate,
) -> LibraryCollectionResponse:
    """Create a new collection from multiple resources."""
    user_id = uuid.UUID(current_user.id)
    return await service.create_collection(db, user_id, request)


@router.patch("/collections/{collection_id}")
async def update_collection_endpoint(
    collection_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
    request: LibraryCollectionUpdate,
) -> LibraryCollectionResponse:
    """Update a collection (e.g. rename, make public)."""
    user_id = uuid.UUID(current_user.id)
    return await service.update_collection(db, user_id, collection_id, request)


@router.delete("/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection_endpoint(
    collection_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> None:
    """Delete a library collection permanently."""
    user_id = uuid.UUID(current_user.id)
    await service.delete_collection(db, user_id, collection_id)


@router.post("/collections/{collection_id}/clone")
async def clone_collection_endpoint(
    collection_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> LibraryCollectionResponse:
    """Clone another user's public collection."""
    user_id = uuid.UUID(current_user.id)
    return await service.clone_collection(db, user_id, collection_id)


@router.post("/collections/{collection_id}/sync")
async def sync_cloned_collection_endpoint(
    collection_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> LibraryCollectionResponse:
    """Sync a cloned collection with its original source."""
    user_id = uuid.UUID(current_user.id)
    return await service.sync_cloned_collection(db, user_id, collection_id)


@router.post("")
async def save_resource_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: SaveResourceRequest,
) -> SavedResourceResponse:
    """Save a single resource, auto-creating a collection if needed."""
    user_id = uuid.UUID(current_user.id)
    return await service.save_resource(db, user_id, request)


@router.post("/collection-item")
async def save_resource_to_collection_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: SaveResourceToCollectionRequest,
) -> SavedResourceResponse:
    """Save a single resource to an existing collection."""
    user_id = uuid.UUID(current_user.id)
    return await service.save_to_collection(db, user_id, request)


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


@router.get("/evaluate/stream")
async def evaluate_stream_endpoint(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    preset_id: uuid.UUID = Query(...),
    search_query: str = Query(...),
) -> EventSourceResponse:
    """Stream evaluation progress as SSE events."""
    user_id = uuid.UUID(current_user.id)

    async def _event_generator():
        async for event in service.evaluate_saved_resources_stream(
            db, user_id, preset_id, search_query
        ):
            if await request.is_disconnected():
                break
            yield {"event": "stage", "data": event.model_dump_json()}

    return EventSourceResponse(_event_generator())


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
