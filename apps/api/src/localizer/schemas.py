import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ArtifactType = Literal["quiz", "mindmap", "summary", "flashcards"]


class GenerateArtifactRequest(BaseModel):
    preset_id: uuid.UUID
    saved_resource_ids: list[uuid.UUID] = Field(..., min_length=1, max_length=10)
    artifact_type: ArtifactType


class GeneratedArtifactResponse(BaseModel):
    id: uuid.UUID
    preset_id: uuid.UUID
    artifact_type: str
    content: dict[str, Any]
    source_resource_ids: list[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class ArtifactListResponse(BaseModel):
    artifacts: list[GeneratedArtifactResponse]
    total: int
