"""Discovery router — federated search endpoint."""

import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException, Query, Request, status
from sqlalchemy import select
from sse_starlette.sse import EventSourceResponse

from src.agents.schemas import JudgedSearchResponse
from src.discovery import service
from src.lib.auth import decode_token
from src.lib.dependencies import CurrentUser, DBSession
from src.lib.rate_limit import rate_limit
from src.presets.model import ClassroomPreset

router = APIRouter()


def _user_rate_limit_key(request: Request) -> str:
    """Rate limit key scoped to authenticated user id from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = decode_token(auth.removeprefix("Bearer ").strip())
            return f"discovery:search:{payload.user_id}"
        except Exception:  # noqa: S110
            pass
    # Fallback to IP
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    return f"discovery:search:{ip}"


@router.get("/search", response_model=JudgedSearchResponse)
@rate_limit(requests=20, window=60, key_func=_user_rate_limit_key)
async def search(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    preset_id: uuid.UUID = Query(...),
    query: str = Query(..., min_length=1, max_length=500),
) -> JudgedSearchResponse:
    """
    Federated search across DuckDuckGo, YouTube, and OpenAlex.

    Rate limited to 20 requests per minute per user.
    Source labels: ddgs=DuckDuckGo, youtube=YouTube, openalex=OpenAlex
    """
    user_id = uuid.UUID(current_user.id)

    # Verify preset ownership
    result = await db.execute(
        select(ClassroomPreset).where(
            ClassroomPreset.id == preset_id,
            ClassroomPreset.user_id == user_id,
        )
    )
    preset = result.scalar_one_or_none()
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preset not found",
        )

    return await service.search_resources(preset, query)


@router.get("/search/stream")
@rate_limit(requests=20, window=60, key_func=_user_rate_limit_key)
async def search_stream(
    request: Request,
    db: DBSession,
    current_user: CurrentUser,
    preset_id: uuid.UUID = Query(...),
    query: str = Query(..., min_length=1, max_length=500),
) -> EventSourceResponse:
    """
    SSE stream of search pipeline progress.

    Emits `SearchStageEvent` messages under the `stage` event name as the
    multi-agent pipeline executes.  Rate limited to 20 requests per minute
    per user.

    The stream always terminates with a ``complete / done`` event whose
    ``data`` field contains the full ``JudgedSearchResponse``.
    """
    user_id = uuid.UUID(current_user.id)

    # Verify preset ownership (identical guard to /search)
    result = await db.execute(
        select(ClassroomPreset).where(
            ClassroomPreset.id == preset_id,
            ClassroomPreset.user_id == user_id,
        )
    )
    preset = result.scalar_one_or_none()
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preset not found",
        )

    async def _event_generator() -> AsyncGenerator[dict, None]:
        async for event in service.search_resources_stream(preset, query):
            yield {"event": "stage", "data": event.model_dump_json()}

    return EventSourceResponse(_event_generator())
