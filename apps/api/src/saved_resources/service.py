import uuid
from collections import defaultdict
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from src.discovery.schemas import ResourceCard
from src.lib.dependencies import DBSession
from src.presets.model import ClassroomPreset
from src.saved_resources.model import SavedResource
from src.saved_resources.schemas import (
    AddCustomLinkRequest,
    BulkSaveResourceRequest,
    BulkSaveResourceResponse,
    PresetGroup,
    QueryGroup,
    SavedResourceListResponse,
    SavedResourceResponse,
    SaveResourceRequest,
)


async def save_resource(
    db: DBSession, user_id: uuid.UUID, request: SaveResourceRequest
) -> SavedResourceResponse:
    # Verify preset ownership
    preset_exec = await db.execute(
        select(ClassroomPreset).where(
            ClassroomPreset.id == request.preset_id,
            ClassroomPreset.user_id == user_id,
        )
    )
    preset = preset_exec.scalar_one_or_none()
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )

    eval_data = _dump_eval_data(request.evaluation_data, request.resource)

    stmt = (
        insert(SavedResource)
        .values(
            user_id=user_id,
            preset_id=request.preset_id,
            search_query=request.search_query,
            resource_url=request.resource.url,
            resource_data=request.resource.model_dump(mode="json"),
            evaluation_data=eval_data,
        )
        .on_conflict_do_nothing(
            constraint="uq_saved_resource_v2",
        )
        .returning(SavedResource)
    )
    result = await db.execute(stmt)
    saved = result.scalar_one_or_none()

    if not saved:
        exist_result = await db.execute(
            select(SavedResource).where(
                SavedResource.user_id == user_id,
                SavedResource.preset_id == request.preset_id,
                SavedResource.search_query == request.search_query,
                SavedResource.resource_url == request.resource.url,
            )
        )
        saved = exist_result.scalar_one()

    return SavedResourceResponse.model_validate(saved)


def _build_eval_data(resource: ResourceCard) -> dict | None:
    """Return stored judgment data if the resource was already evaluated.

    In the new 3-call pipeline, full JudgmentResult is attached during search.
    When saving a resource that hasn't been evaluated yet, return None —
    the user can trigger evaluation later via the /evaluate endpoints.
    """
    # No evaluation data available at save time for non-evaluated resources
    return None


def _dump_eval_data(
    evaluation_data: EvaluationResult | None, resource: ResourceCard
) -> dict[str, Any] | None:
    if evaluation_data is not None:
        if evaluation_data.resource_url != resource.url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Evaluation data does not match resource URL",
            )
        return evaluation_data.model_dump(mode="json")
    return _build_eval_data(resource)


async def bulk_save_resources(
    db: DBSession, user_id: uuid.UUID, request: BulkSaveResourceRequest
) -> BulkSaveResourceResponse:
    """Save multiple resources in a single transaction."""
    preset_exec = await db.execute(
        select(ClassroomPreset).where(
            ClassroomPreset.id == request.preset_id,
            ClassroomPreset.user_id == user_id,
        )
    )
    preset = preset_exec.scalar_one_or_none()
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )

    rows = [
        {
            "user_id": user_id,
            "preset_id": request.preset_id,
            "search_query": request.search_query,
            "resource_url": r.url,
            "resource_data": r.model_dump(mode="json"),
            "evaluation_data": _dump_eval_data(
                request.evaluation_data_list[idx]
                if request.evaluation_data_list
                and idx < len(request.evaluation_data_list)
                else None,
                r,
            ),
        }
        for idx, r in enumerate(request.resources)
    ]

    stmt = (
        insert(SavedResource)
        .values(rows)
        .on_conflict_do_nothing(constraint="uq_saved_resource_v2")
        .returning(SavedResource)
    )
    result = await db.execute(stmt)
    inserted = list(result.scalars().all())

    # Fetch any that already existed (conflict skip)
    if len(inserted) < len(request.resources):
        inserted_urls = {r.resource_url for r in inserted}
        missing_urls = [r.url for r in request.resources if r.url not in inserted_urls]
        if missing_urls:
            exist_result = await db.execute(
                select(SavedResource).where(
                    SavedResource.user_id == user_id,
                    SavedResource.preset_id == request.preset_id,
                    SavedResource.search_query == request.search_query,
                    SavedResource.resource_url.in_(missing_urls),
                )
            )
            inserted.extend(exist_result.scalars().all())

    saved = [SavedResourceResponse.model_validate(s) for s in inserted]
    return BulkSaveResourceResponse(saved=saved, total=len(saved))


async def delete_saved_resource(
    db: DBSession, user_id: uuid.UUID, id: uuid.UUID
) -> None:
    result = await db.execute(
        select(SavedResource).where(
            SavedResource.id == id, SavedResource.user_id == user_id
        )
    )
    resource = result.scalar_one_or_none()
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Saved resource not found"
        )
    await db.delete(resource)


async def list_saved_resources(
    db: DBSession, user_id: uuid.UUID, preset_id: uuid.UUID | None = None
) -> SavedResourceListResponse:
    query = (
        select(SavedResource, ClassroomPreset)
        .join(ClassroomPreset, SavedResource.preset_id == ClassroomPreset.id)
        .where(SavedResource.user_id == user_id)
    )

    if preset_id:
        query = query.where(SavedResource.preset_id == preset_id)

    query = query.order_by(
        ClassroomPreset.name,
        SavedResource.search_query,
        SavedResource.saved_at.desc(),
    )

    result = await db.execute(query)
    rows = result.all()

    # Group by preset_id -> search_query
    preset_meta: dict[uuid.UUID, dict[str, Any]] = {}
    grouped: dict[uuid.UUID, dict[str, list[SavedResourceResponse]]] = defaultdict(
        lambda: defaultdict(list)
    )
    total = 0

    for saved, preset in rows:
        total += 1
        pid = preset.id
        if pid not in preset_meta:
            preset_meta[pid] = {
                "preset_name": preset.name,
                "preset_subject": preset.subject,
                "preset_topic": None,
            }
        item = SavedResourceResponse.model_validate(saved)
        grouped[pid][saved.search_query].append(item)

    groups = []
    for pid, queries in grouped.items():
        meta = preset_meta[pid]
        query_groups = [
            QueryGroup(search_query=sq, items=items) for sq, items in queries.items()
        ]
        groups.append(
            PresetGroup(
                preset_id=pid,
                preset_name=meta["preset_name"],
                preset_subject=meta["preset_subject"],
                preset_topic=meta["preset_topic"],
                query_groups=query_groups,
            )
        )

    return SavedResourceListResponse(total=total, groups=groups)


async def add_custom_link(
    db: DBSession, user_id: uuid.UUID, request: AddCustomLinkRequest
) -> SavedResourceResponse:
    preset_exec = await db.execute(
        select(ClassroomPreset).where(
            ClassroomPreset.id == request.preset_id,
            ClassroomPreset.user_id == user_id,
        )
    )
    preset = preset_exec.scalar_one_or_none()
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found"
        )

    import re
    from urllib.parse import urlparse

    import httpx

    from src.discovery.schemas import CustomMetadata

    title = request.title or "Unknown Custom Link"
    desc = ""
    img = None

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(str(request.url), follow_redirects=True)
            text_html = resp.text

            if not request.title:
                t_match = re.search(r"<title>(.*?)</title>", text_html, re.IGNORECASE)
                if t_match:
                    title = t_match.group(1).strip()

            d_match = re.search(
                r'<meta[^>]*property="og:description"[^>]*content="([^"]*)"',
                text_html,
                re.IGNORECASE,
            )
            if not d_match:
                d_match = re.search(
                    r'<meta[^>]*name="description"[^>]*content="([^"]*)"',
                    text_html,
                    re.IGNORECASE,
                )
            if d_match:
                desc = d_match.group(1).strip()

            i_match = re.search(
                r'<meta[^>]*property="og:image"[^>]*content="([^"]*)"',
                text_html,
                re.IGNORECASE,
            )
            if i_match:
                img = i_match.group(1).strip()
    except Exception:
        import structlog

        logger = structlog.get_logger(__name__)
        logger.error("Error fetching custom link metadata", exc_info=True)

    domain = urlparse(str(request.url)).netloc or "custom"

    metadata = CustomMetadata(
        domain=domain,
        og_title=title,
        og_description=desc,
        og_image=img,
    )

    card = ResourceCard(
        title=title,
        url=str(request.url),
        source="custom",
        type="webpage",
        snippet=desc or domain,
        thumbnail_url=img,
        metadata=metadata,
    )

    stmt = (
        insert(SavedResource)
        .values(
            user_id=user_id,
            preset_id=request.preset_id,
            search_query=request.search_query,
            resource_url=str(request.url),
            resource_data=card.model_dump(mode="json"),
            evaluation_data=None,
        )
        .on_conflict_do_nothing(
            constraint="uq_saved_resource_v2",
        )
        .returning(SavedResource)
    )
    result = await db.execute(stmt)
    saved = result.scalar_one_or_none()

    if not saved:
        exist_result = await db.execute(
            select(SavedResource).where(
                SavedResource.user_id == user_id,
                SavedResource.preset_id == request.preset_id,
                SavedResource.search_query == request.search_query,
                SavedResource.resource_url == str(request.url),
            )
        )
        saved = exist_result.scalar_one()

    return SavedResourceResponse.model_validate(saved)


async def evaluate_single_resource(
    db: DBSession, user_id: uuid.UUID, saved_resource_id: uuid.UUID
) -> SavedResourceResponse:
    """Evaluate a single saved resource."""
    result = await db.execute(
        select(SavedResource, ClassroomPreset)
        .join(ClassroomPreset, SavedResource.preset_id == ClassroomPreset.id)
        .where(
            SavedResource.id == saved_resource_id,
            SavedResource.user_id == user_id,
        )
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Saved resource not found"
        )

    saved, preset = row
    card = ResourceCard.model_validate(saved.resource_data)

    from src.discovery.service import _run_rag_pipeline

    search_id = str(uuid.uuid4())
    evaluations = await _run_rag_pipeline(
        [card], preset, saved.search_query or "Evaluate resource", search_id
    )

    if evaluations:
        ev = evaluations[0]
        saved.evaluation_data = ev.model_dump(mode="json")
        await db.commit()
        await db.refresh(saved)

    return SavedResourceResponse.model_validate(saved)


async def evaluate_saved_resources(
    db: DBSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
    search_query: str,
) -> dict[str, Any]:
    """Batch evaluate unevaluated resources in a specific preset+query group."""
    result = await db.execute(
        select(SavedResource).where(
            SavedResource.user_id == user_id,
            SavedResource.preset_id == preset_id,
            SavedResource.search_query == search_query,
            SavedResource.evaluation_data.is_(None),
        )
    )
    unevaluated = result.scalars().all()

    if not unevaluated:
        return {"processed": 0}

    preset_exec = await db.execute(
        select(ClassroomPreset).where(
            ClassroomPreset.id == preset_id,
            ClassroomPreset.user_id == user_id,
        )
    )
    preset = preset_exec.scalar_one()

    cards = [ResourceCard.model_validate(r.resource_data) for r in unevaluated]

    from src.discovery.service import _run_rag_pipeline

    search_id = str(uuid.uuid4())
    evaluations = await _run_rag_pipeline(cards, preset, search_query, search_id)

    eval_map = {e.resource_url: e for e in evaluations}

    processed = 0
    for r in unevaluated:
        ev = eval_map.get(r.resource_url)
        if ev:
            r.evaluation_data = ev.model_dump(mode="json")
            processed += 1

    await db.commit()
    return {"processed": processed}
