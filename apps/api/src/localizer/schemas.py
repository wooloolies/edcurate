import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ArtifactType = Literal[
    "quiz",
    "mindmap",
    "summary",
    "flashcards",
    "study_guide",
    "briefing_doc",
]


class GenerationOptions(BaseModel):
    """Optional parameters for artifact generation."""

    quantity: Literal["fewer", "standard"] | None = None
    difficulty: Literal["easy", "medium", "hard"] | None = None
    instructions: str | None = Field(None, max_length=2000)
    language: str | None = Field(None, pattern=r"^[a-z]{2}(-[A-Z]{2})?$")


class GenerateArtifactRequest(BaseModel):
    preset_id: uuid.UUID
    saved_resource_ids: list[uuid.UUID] = Field(..., min_length=1, max_length=10)
    artifact_type: ArtifactType
    options: GenerationOptions | None = None


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
