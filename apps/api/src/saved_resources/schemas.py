import uuid
from datetime import datetime

from pydantic import BaseModel, HttpUrl

from src.discovery.schemas import ResourceCard
from src.agents.schemas import EvaluationResult


class SaveResourceRequest(BaseModel):
    preset_id: uuid.UUID
    resource: ResourceCard


class AddCustomLinkRequest(BaseModel):
    preset_id: uuid.UUID
    url: HttpUrl
    title: str | None = None


class BatchEvaluateRequest(BaseModel):
    preset_id: uuid.UUID


class SavedResourceResponse(BaseModel):
    id: uuid.UUID
    preset_id: uuid.UUID
    resource_url: str
    resource_data: ResourceCard
    evaluation_data: EvaluationResult | None
    saved_at: datetime


class PresetGroup(BaseModel):
    preset_id: uuid.UUID
    preset_name: str
    preset_subject: str
    preset_topic: str | None = None
    items: list[SavedResourceResponse]


class SavedResourceListResponse(BaseModel):
    total: int
    groups: list[PresetGroup]
