import uuid
from datetime import datetime
from typing import Any, Literal

import structlog
from pydantic import BaseModel, ConfigDict, HttpUrl, model_validator

from src.agents.schemas import JudgmentResult
from src.discovery.schemas import ResourceCard

logger = structlog.get_logger(__name__)


class SaveResourceRequest(BaseModel):
    preset_id: uuid.UUID
    search_query: str
    resource: ResourceCard
    evaluation_data: JudgmentResult | dict[str, Any] | None = None


class LibraryCollectionCreate(BaseModel):
    preset_id: uuid.UUID
    search_query: str
    name: str
    description: str | None = None
    is_public: bool = False
    resources: list[ResourceCard]
    evaluation_data_list: list[JudgmentResult | None] | None = None


class LibraryCollectionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None


class LibraryCollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    preset_id: uuid.UUID
    search_query: str
    name: str
    description: str | None = None
    is_public: bool
    clone_count: int
    created_at: datetime


class SaveResourceToCollectionRequest(BaseModel):
    collection_id: uuid.UUID
    resource: ResourceCard
    evaluation_data: JudgmentResult | None = None


class AddCustomLinkRequest(BaseModel):
    preset_id: uuid.UUID
    search_query: str
    url: HttpUrl
    title: str | None = None


class BatchEvaluateRequest(BaseModel):
    preset_id: uuid.UUID
    search_query: str


class EvaluateSingleRequest(BaseModel):
    saved_resource_id: uuid.UUID


class SavedResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    preset_id: uuid.UUID
    search_query: str
    resource_url: str
    resource_data: ResourceCard
    evaluation_data: JudgmentResult | None = None
    evaluation_id: uuid.UUID | None = None
    saved_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _coerce_legacy_evaluation_data(
        cls,
        values: Any,
    ) -> Any:
        """Handle old-format evaluation_data gracefully."""
        # When validating from ORM, values is the ORM object
        if hasattr(values, "evaluation_data"):
            raw = values.evaluation_data
        elif isinstance(values, dict):
            raw = values.get("evaluation_data")
        else:
            return values

        if raw is None:
            return values

        # Try to validate as JudgmentResult; if it fails, null it out
        try:
            JudgmentResult.model_validate(raw)
        except Exception:
            rid = getattr(
                values,
                "id",
                values.get("id") if isinstance(values, dict) else None,
            )
            logger.warning(
                "Legacy eval_data, setting to None",
                resource_id=rid,
            )
            if hasattr(values, "__dict__"):
                # ORM object: override via a wrapper dict
                data = {c.key: getattr(values, c.key) for c in values.__table__.columns}
                data["evaluation_data"] = None
                return data
            elif isinstance(values, dict):
                values["evaluation_data"] = None
        return values


class CollectionGroup(BaseModel):
    """A collection of saved resources."""

    collection: LibraryCollectionResponse
    items: list[SavedResourceResponse]


class SuggestedCollectionResponse(BaseModel):
    collection: LibraryCollectionResponse
    matched_by: str  # "TFIDF", "Exact", etc.
    resources_count: int = 0
    publisher_name: str | None = None
    is_cloned_by_user: bool = False
    needs_sync: bool = False
    resources: list[SavedResourceResponse] = []


class QueryGroup(BaseModel):
    """A group of saved resources from the same search query."""

    search_query: str
    items: list[SavedResourceResponse]


class PresetGroup(BaseModel):
    preset_id: uuid.UUID
    preset_name: str
    preset_subject: str
    preset_topic: str | None = None
    collections: list[CollectionGroup]


class SavedResourceListResponse(BaseModel):
    total: int
    groups: list[PresetGroup]


class EvalStageEvent(BaseModel):
    """SSE event for library evaluation progress."""

    stage: Literal["rag_preparation", "evaluation", "complete"]
    status: Literal["working", "done"]
    resource_url: str | None = None
    data: dict[str, Any] | None = None
