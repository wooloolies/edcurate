import uuid

from fastapi import HTTPException, status
from sqlalchemy import select

from src.discovery.schemas import ResourceCard
from src.lib.dependencies import DBSession
from src.localizer.model import GeneratedArtifact
from src.localizer.notebooklm_client import (
    NotebookLMConfigurationError,
    ResourceInfo,
    generate_artifact,
)
from src.localizer.schemas import (
    ArtifactListResponse,
    GenerateArtifactRequest,
    GeneratedArtifactResponse,
)
from src.presets.model import ClassroomPreset
from src.saved_resources.model import SavedResource


async def create_artifact(
    db: DBSession,
    user_id: uuid.UUID,
    request: GenerateArtifactRequest,
) -> GeneratedArtifactResponse:
    """Generate a learning artifact from saved resources via NotebookLM."""
    await _verify_preset_ownership(db, user_id, request.preset_id)

    resources = await _fetch_resources(
        db, user_id, request.preset_id, request.saved_resource_ids
    )

    resource_infos = [_to_resource_info(r) for r in resources]

    try:
        content = await generate_artifact(
            resource_infos,
            request.artifact_type,
            options=request.options.model_dump(exclude_none=True)
            if request.options
            else None,
        )
    except NotebookLMConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NotebookLM artifact generation is not configured",
        ) from exc

    artifact = GeneratedArtifact(
        user_id=user_id,
        preset_id=request.preset_id,
        artifact_type=request.artifact_type,
        content=content,
        source_resource_ids=[str(rid) for rid in request.saved_resource_ids],
    )
    db.add(artifact)
    await db.flush()
    await db.refresh(artifact)

    return GeneratedArtifactResponse.model_validate(artifact)


async def list_artifacts(
    db: DBSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
) -> ArtifactListResponse:
    """List all generated artifacts for a preset."""
    result = await db.execute(
        select(GeneratedArtifact)
        .where(
            GeneratedArtifact.user_id == user_id,
            GeneratedArtifact.preset_id == preset_id,
        )
        .order_by(GeneratedArtifact.created_at.desc())
    )
    rows = list(result.scalars().all())
    artifacts = [GeneratedArtifactResponse.model_validate(r) for r in rows]
    return ArtifactListResponse(artifacts=artifacts, total=len(artifacts))


async def get_artifact(
    db: DBSession,
    user_id: uuid.UUID,
    artifact_id: uuid.UUID,
) -> GeneratedArtifactResponse:
    """Fetch a single artifact by ID."""
    result = await db.execute(
        select(GeneratedArtifact).where(
            GeneratedArtifact.id == artifact_id,
            GeneratedArtifact.user_id == user_id,
        )
    )
    artifact = result.scalar_one_or_none()
    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found",
        )
    return GeneratedArtifactResponse.model_validate(artifact)


async def delete_artifact(
    db: DBSession,
    user_id: uuid.UUID,
    artifact_id: uuid.UUID,
) -> None:
    """Delete a generated artifact."""
    result = await db.execute(
        select(GeneratedArtifact).where(
            GeneratedArtifact.id == artifact_id,
            GeneratedArtifact.user_id == user_id,
        )
    )
    artifact = result.scalar_one_or_none()
    if artifact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artifact not found",
        )
    await db.delete(artifact)


async def _verify_preset_ownership(
    db: DBSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
) -> ClassroomPreset:
    """Verify the preset belongs to the user."""
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
    return preset


async def _fetch_resources(
    db: DBSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
    resource_ids: list[uuid.UUID],
) -> list[SavedResource]:
    """Fetch saved resources and verify ownership."""
    result = await db.execute(
        select(SavedResource).where(
            SavedResource.id.in_(resource_ids),
            SavedResource.user_id == user_id,
            SavedResource.preset_id == preset_id,
        )
    )
    resources = list(result.scalars().all())
    if len(resources) != len(resource_ids):
        found_ids = {r.id for r in resources}
        missing = [str(rid) for rid in resource_ids if rid not in found_ids]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resources not found: {', '.join(missing)}",
        )
    return resources


def _to_resource_info(saved: SavedResource) -> ResourceInfo:
    """Extract URL and source type from saved resource data."""
    card = ResourceCard.model_validate(saved.resource_data)
    source_type = card.type  # "webpage" | "video" | "paper"
    return ResourceInfo(url=card.url, source_type=source_type)
