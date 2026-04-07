import uuid
from collections import defaultdict
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from src.discovery.schemas import ResourceCard
from src.lib.dependencies import DBSession
from src.presets.model import ClassroomPreset
from src.saved_resources.model import LibraryCollection, SavedResource
from src.saved_resources.schemas import (
    AddCustomLinkRequest,
    CollectionGroup,
    LibraryCollectionCreate,
    LibraryCollectionResponse,
    LibraryCollectionUpdate,
    PresetGroup,
    SavedResourceListResponse,
    SavedResourceResponse,
    SaveResourceRequest,
    SaveResourceToCollectionRequest,
    SuggestedCollectionResponse,
)


def _dump_eval_data(
    evaluation_data: dict[str, Any] | None, resource: ResourceCard
) -> dict[str, Any] | None:
    return evaluation_data


async def save_resource(
    db: DBSession, user_id: uuid.UUID, request: SaveResourceRequest
) -> SavedResourceResponse:
    col_exec = await db.execute(
        select(LibraryCollection)
        .where(
            LibraryCollection.user_id == user_id,
            LibraryCollection.preset_id == request.preset_id,
            LibraryCollection.search_query == request.search_query,
        )
        .order_by(LibraryCollection.created_at.desc())
        .limit(1)
    )
    col = col_exec.scalar_one_or_none()

    if not col:
        col = LibraryCollection(
            user_id=user_id,
            preset_id=request.preset_id,
            search_query=request.search_query,
            name=f"Collection for {request.search_query}",
            is_public=False,
        )
        db.add(col)
        await db.flush()

    eval_data = _dump_eval_data(request.evaluation_data, request.resource)

    stmt = (
        insert(SavedResource)
        .values(
            user_id=user_id,
            preset_id=request.preset_id,
            search_query=request.search_query,
            collection_id=col.id,
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

    await db.commit()
    return SavedResourceResponse.model_validate(saved)


async def create_collection(
    db: DBSession, user_id: uuid.UUID, request: LibraryCollectionCreate
) -> LibraryCollectionResponse:
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


    collection = LibraryCollection(
        user_id=user_id,
        preset_id=request.preset_id,
        search_query=request.search_query,
        name=request.name,
        is_public=request.is_public,
    )
    db.add(collection)
    await db.flush()

    if request.resources:
        rows = [
            {
                "user_id": user_id,
                "preset_id": request.preset_id,
                "search_query": request.search_query,
                "collection_id": collection.id,
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
        )
        await db.execute(stmt)

    await db.commit()
    await db.refresh(collection)
    return LibraryCollectionResponse.model_validate(collection)


async def update_collection(
    db: DBSession,
    user_id: uuid.UUID,
    collection_id: uuid.UUID,
    request: LibraryCollectionUpdate,
) -> LibraryCollectionResponse:
    col_exec = await db.execute(
        select(LibraryCollection).where(
            LibraryCollection.id == collection_id, LibraryCollection.user_id == user_id
        )
    )
    col = col_exec.scalar_one_or_none()

    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")

    if request.name is not None:
        col.name = request.name
    if request.is_public is not None:
        col.is_public = request.is_public

    await db.commit()
    await db.refresh(col)
    return LibraryCollectionResponse.model_validate(col)


async def delete_collection(
    db: DBSession, user_id: uuid.UUID, collection_id: uuid.UUID
) -> None:
    col_exec = await db.execute(
        select(LibraryCollection).where(
            LibraryCollection.id == collection_id, LibraryCollection.user_id == user_id
        )
    )
    col = col_exec.scalar_one_or_none()

    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")

    await db.delete(col)
    await db.commit()


async def clone_collection(
    db: DBSession, user_id: uuid.UUID, collection_id: uuid.UUID
) -> LibraryCollectionResponse:
    # Fetch existing
    orig_exec = await db.execute(
        select(LibraryCollection).where(LibraryCollection.id == collection_id)
    )
    orig_collection = orig_exec.scalar_one_or_none()

    if not orig_collection or not orig_collection.is_public:
        raise HTTPException(
            status_code=404,
            detail="Collection not found or not public",
        )

    if orig_collection.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot clone your own collection")

    # Increment clone count
    orig_collection.clone_count += 1

    # Create new
    cloned_col = LibraryCollection(
        user_id=user_id,
        preset_id=orig_collection.preset_id,
        search_query=orig_collection.search_query,
        name=f"Copy of {orig_collection.name}",
        is_public=False,  # default to private
    )
    db.add(cloned_col)
    await db.flush()

    # Copy resources
    items_exec = await db.execute(
        select(SavedResource).where(SavedResource.collection_id == collection_id)
    )
    items = items_exec.scalars().all()

    if items:
        rows = [
            {
                "user_id": user_id,
                "preset_id": orig_collection.preset_id,
                "search_query": orig_collection.search_query,
                "collection_id": cloned_col.id,
                "resource_url": i.resource_url,
                "resource_data": i.resource_data,
                "evaluation_data": i.evaluation_data,
            }
            for i in items
        ]
        stmt = (
            insert(SavedResource)
            .values(rows)
            .on_conflict_do_nothing(constraint="uq_saved_resource_v2")
        )
        await db.execute(stmt)

    await db.commit()
    await db.refresh(cloned_col)
    return LibraryCollectionResponse.model_validate(cloned_col)


async def get_suggested_collections(
    db: DBSession,
    user_id: uuid.UUID,
    search_query: str,
    preset_id: uuid.UUID | None,
    limit: int,
) -> list[SuggestedCollectionResponse]:
    # TFIDF equivalent using PostgreSQL Full Text Search
    doc_col = LibraryCollection.name + " " + LibraryCollection.search_query
    document = func.to_tsvector("english", doc_col)
    query = func.plainto_tsquery("english", search_query)
    rank = func.ts_rank_cd(document, query)

    stmt = select(LibraryCollection).where(
        LibraryCollection.is_public.is_(True),
        LibraryCollection.user_id != user_id,
        document.bool_op("@@")(query),
    )
    if preset_id:
        stmt = stmt.where(LibraryCollection.preset_id == preset_id)

    stmt = stmt.order_by(
        rank.desc(),
        LibraryCollection.clone_count.desc(),
        LibraryCollection.created_at.desc(),
    ).limit(limit)

    result = await db.execute(stmt)
    collections = result.scalars().all()

    return [
        SuggestedCollectionResponse(
            collection=LibraryCollectionResponse.model_validate(c),
            matched_by="TFIDF",
        )
        for c in collections

    ]


async def save_to_collection(
    db: DBSession, user_id: uuid.UUID, request: SaveResourceToCollectionRequest
) -> SavedResourceResponse:
    col_exec = await db.execute(
        select(LibraryCollection).where(
            LibraryCollection.id == request.collection_id,
            LibraryCollection.user_id == user_id,
        )
    )
    col = col_exec.scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")

    eval_data = _dump_eval_data(request.evaluation_data, request.resource)

    stmt = (
        insert(SavedResource)
        .values(
            user_id=user_id,
            preset_id=col.preset_id,
            search_query=col.search_query,
            collection_id=col.id,
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
                SavedResource.collection_id == col.id,
                SavedResource.resource_url == request.resource.url,
            )
        )
        saved = exist_result.scalar_one()

    return SavedResourceResponse.model_validate(saved)


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
    await db.commit()


async def list_saved_resources(
    db: DBSession, user_id: uuid.UUID, preset_id: uuid.UUID | None = None
) -> SavedResourceListResponse:
    query = (
        select(LibraryCollection, SavedResource, ClassroomPreset)
        .join(ClassroomPreset, LibraryCollection.preset_id == ClassroomPreset.id)
        .outerjoin(SavedResource, SavedResource.collection_id == LibraryCollection.id)
        .where(LibraryCollection.user_id == user_id)
    )

    if preset_id:
        query = query.where(LibraryCollection.preset_id == preset_id)

    query = query.order_by(
        ClassroomPreset.name,
        LibraryCollection.created_at.desc(),
        SavedResource.saved_at.desc(),
    )

    result = await db.execute(query)
    rows = result.all()

    preset_meta: dict[uuid.UUID, dict[str, Any]] = {}
    grouped: dict[uuid.UUID, dict[uuid.UUID, dict[str, Any]]] = defaultdict(dict)

    total_resources = 0

    for col, saved, preset in rows:
        pid = preset.id
        if pid not in preset_meta:
            preset_meta[pid] = {
                "preset_name": preset.name,
                "preset_subject": preset.subject,
                "preset_topic": None,
            }

        cid = col.id
        if cid not in grouped[pid]:
            grouped[pid][cid] = {
                "collection": LibraryCollectionResponse.model_validate(col),
                "items": [],
            }

        if saved:
            total_resources += 1
            item = SavedResourceResponse.model_validate(saved)
            grouped[pid][cid]["items"].append(item)

    groups = []
    for pid, cols in grouped.items():
        meta = preset_meta[pid]
        col_groups = [
            CollectionGroup(collection=c["collection"], items=c["items"])
            for c in cols.values()
        ]
        groups.append(
            PresetGroup(
                preset_id=pid,
                preset_name=meta["preset_name"],
                preset_subject=meta["preset_subject"],
                preset_topic=meta["preset_topic"],
                collections=col_groups,
            )
        )

    return SavedResourceListResponse(total=total_resources, groups=groups)


async def add_custom_link(
    db: DBSession, user_id: uuid.UUID, request: AddCustomLinkRequest
) -> SavedResourceResponse:
    # Auto-create a default collection if one doesn't exist
    # for this preset + search_query combination.
    col_exec = await db.execute(
        select(LibraryCollection)
        .where(
            LibraryCollection.user_id == user_id,
            LibraryCollection.preset_id == request.preset_id,
            LibraryCollection.search_query == request.search_query,
        )
        .order_by(LibraryCollection.created_at.desc())
        .limit(1)
    )
    col = col_exec.scalar_one_or_none()

    if not col:
        col = LibraryCollection(
            user_id=user_id,
            preset_id=request.preset_id,
            search_query=request.search_query,
            name=f"Collection for {request.search_query}",
            is_public=False,
        )
        db.add(col)
        await db.flush()

    import re
    from urllib.parse import urlparse

    import httpx
    import structlog

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
            preset_id=col.preset_id,
            search_query=col.search_query,
            collection_id=col.id,
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
                SavedResource.collection_id == col.id,
                SavedResource.resource_url == str(request.url),
            )
        )
        saved = exist_result.scalar_one()

    await db.commit()
    return SavedResourceResponse.model_validate(saved)


async def evaluate_single_resource(
    db: DBSession, user_id: uuid.UUID, saved_resource_id: uuid.UUID
) -> SavedResourceResponse:
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
