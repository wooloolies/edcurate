import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, HttpUrl

from src.agents.schemas import JudgmentResult
from src.discovery.schemas import ResourceCard


class SaveResourceRequest(BaseModel):
    preset_id: uuid.UUID
    search_query: str
    resource: ResourceCard
    evaluation_data: dict[str, Any] | None = None


class LibraryCollectionCreate(BaseModel):
    preset_id: uuid.UUID
    search_query: str
    name: str
    is_public: bool = False
    resources: list[ResourceCard]
    evaluation_data_list: list[JudgmentResult | None] | None = None


class LibraryCollectionUpdate(BaseModel):
    name: str | None = None
    is_public: bool | None = None


class LibraryCollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    preset_id: uuid.UUID
    search_query: str
    name: str
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
    evaluation_data: JudgmentResult | None
    saved_at: datetime


class CollectionGroup(BaseModel):
    """A collection of saved resources."""

    collection: LibraryCollectionResponse
    items: list[SavedResourceResponse]


class SuggestedCollectionResponse(BaseModel):
    collection: LibraryCollectionResponse
    matched_by: str  # "TFIDF", "Exact", etc.


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
