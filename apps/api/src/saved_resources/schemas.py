import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, HttpUrl

from src.agents.schemas import EvaluationResult
from src.discovery.schemas import ResourceCard


class SaveResourceRequest(BaseModel):
    preset_id: uuid.UUID
    search_query: str
    resource: ResourceCard
    evaluation_data: dict[str, Any] | None = None


class BulkSaveResourceRequest(BaseModel):
    preset_id: uuid.UUID
    search_query: str
    resources: list[ResourceCard]
    evaluation_data_list: list[dict[str, Any] | None] | None = None


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
    evaluation_data: EvaluationResult | None
    saved_at: datetime


class BulkSaveResourceResponse(BaseModel):
    saved: list[SavedResourceResponse]
    total: int


class QueryGroup(BaseModel):
    """A group of saved resources from the same search query."""

    search_query: str
    items: list[SavedResourceResponse]


class PresetGroup(BaseModel):
    preset_id: uuid.UUID
    preset_name: str
    preset_subject: str
    preset_topic: str | None = None
    query_groups: list[QueryGroup]


class SavedResourceListResponse(BaseModel):
    total: int
    groups: list[PresetGroup]
