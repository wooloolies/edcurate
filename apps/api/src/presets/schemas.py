import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class SourceWeights(BaseModel):
    """Source weights for federated search result distribution."""

    ddgs: float = Field(default=0.34, ge=0.0, le=1.0)
    youtube: float = Field(default=0.33, ge=0.0, le=1.0)
    openalex: float = Field(default=0.33, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def _check_sum(self) -> "SourceWeights":
        total = self.ddgs + self.youtube + self.openalex
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"source_weights must sum to 1.0 (±0.01), got {total:.4f}")
        return self


class PresetCreate(BaseModel):
    """Schema for creating a classroom preset."""

    name: str = Field(min_length=1, max_length=255)
    is_default: bool = False

    curriculum_framework: str | None = Field(default=None, max_length=255)
    subject: str = Field(min_length=1, max_length=255)
    year_level: str = Field(min_length=1, max_length=50)

    country: str = Field(min_length=1, max_length=100)
    state_region: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)

    teaching_language: str = Field(default="en", min_length=2, max_length=10)

    class_size: int | None = Field(default=None, gt=0)
    eal_d_students: int | None = Field(default=None, ge=0)
    reading_support_students: int | None = Field(default=None, ge=0)
    extension_students: int | None = Field(default=None, ge=0)
    student_interests: list[str] = Field(default_factory=list)
    language_backgrounds: list[str] = Field(default_factory=list)
    average_reading_level: str | None = Field(default=None, max_length=50)

    source_weights: SourceWeights = Field(default_factory=SourceWeights)

    additional_notes: str | None = None


class PresetUpdate(BaseModel):
    """Schema for updating a classroom preset (full replacement)."""

    name: str = Field(min_length=1, max_length=255)
    is_default: bool = False

    curriculum_framework: str | None = Field(default=None, max_length=255)
    subject: str = Field(min_length=1, max_length=255)
    year_level: str = Field(min_length=1, max_length=50)

    country: str = Field(min_length=1, max_length=100)
    state_region: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)

    teaching_language: str = Field(default="en", min_length=2, max_length=10)

    class_size: int | None = Field(default=None, gt=0)
    eal_d_students: int | None = Field(default=None, ge=0)
    reading_support_students: int | None = Field(default=None, ge=0)
    extension_students: int | None = Field(default=None, ge=0)
    student_interests: list[str] = Field(default_factory=list)
    language_backgrounds: list[str] = Field(default_factory=list)
    average_reading_level: str | None = Field(default=None, max_length=50)

    source_weights: SourceWeights = Field(default_factory=SourceWeights)

    additional_notes: str | None = None


class PresetResponse(BaseModel):
    """Schema for preset response including id and timestamps."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    is_default: bool

    name: str
    curriculum_framework: str | None
    subject: str
    year_level: str

    country: str
    state_region: str | None
    city: str | None

    teaching_language: str

    class_size: int | None
    eal_d_students: int | None
    reading_support_students: int | None
    extension_students: int | None
    student_interests: list
    language_backgrounds: list
    average_reading_level: str | None

    source_weights: dict

    additional_notes: str | None

    created_at: datetime
    updated_at: datetime


class PresetDefaultResponse(BaseModel):
    """Minimal response after setting a preset as default."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    is_default: bool
