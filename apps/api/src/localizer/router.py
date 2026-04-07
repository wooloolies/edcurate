import uuid

from fastapi import APIRouter, status

from src.lib.dependencies import CurrentUser, DBSession
from src.localizer import service
from src.localizer.schemas import (
    ArtifactListResponse,
    GenerateArtifactRequest,
    GeneratedArtifactResponse,
)

router = APIRouter()


@router.post("/generate")
async def generate_artifact_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    request: GenerateArtifactRequest,
) -> GeneratedArtifactResponse:
    """Generate a learning artifact from saved resources via NotebookLM."""
    user_id = uuid.UUID(current_user.id)
    return await service.create_artifact(db, user_id, request)


@router.get("")
async def list_artifacts_endpoint(
    db: DBSession,
    current_user: CurrentUser,
    preset_id: uuid.UUID,
) -> ArtifactListResponse:
    """List generated artifacts for a preset."""
    user_id = uuid.UUID(current_user.id)
    return await service.list_artifacts(db, user_id, preset_id)


@router.get("/{artifact_id}")
async def get_artifact_endpoint(
    artifact_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> GeneratedArtifactResponse:
    """Get a single generated artifact."""
    user_id = uuid.UUID(current_user.id)
    return await service.get_artifact(db, user_id, artifact_id)


@router.delete("/{artifact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artifact_endpoint(
    artifact_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> None:
    """Delete a generated artifact."""
    user_id = uuid.UUID(current_user.id)
    await service.delete_artifact(db, user_id, artifact_id)
