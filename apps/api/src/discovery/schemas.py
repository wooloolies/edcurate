import uuid
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, field_validator


class SearchStageEvent(BaseModel):
    """SSE payload emitted for each stage of the search pipeline."""

    stage: Literal[
        "query_generation",
        "federated_search",
        "rag_preparation",
        "evaluation",
        "adversarial",
        "complete",
    ]
    status: Literal["working", "done"]
    resource_url: str | None = None
    cached: bool = False
    data: dict[str, Any] | None = None


# --- Source-specific metadata ---


class DdgsMetadata(BaseModel):
    """Metadata from DuckDuckGo search results."""

    source: Literal["ddgs"] = "ddgs"
    domain: str
    published_date: str | None = None
    language: str | None = None


class YoutubeMetadata(BaseModel):
    """Metadata from YouTube Data API results."""

    source: Literal["youtube"] = "youtube"
    channel: str
    duration: str = ""  # ISO 8601 (e.g., PT12M30S)
    view_count: int | None = None
    published_date: str | None = None
    tags: list[str] = Field(default_factory=list)
    full_description: str | None = None


class OpenAlexMetadata(BaseModel):
    """Metadata from OpenAlex works results."""

    source: Literal["openalex"] = "openalex"
    authors: list[str] = Field(default_factory=list)
    journal: str | None = None
    citation_count: int | None = None
    doi: str | None = None
    published_date: str | None = None


class CustomMetadata(BaseModel):
    """Metadata from manually added custom links."""

    source: Literal["custom"] = "custom"
    domain: str
    og_title: str | None = None
    og_description: str | None = None
    og_image: str | None = None


# Discriminated union for metadata
ResourceMetadata = Annotated[
    DdgsMetadata | YoutubeMetadata | OpenAlexMetadata | CustomMetadata,
    Field(discriminator="source"),
]


class ResourceCard(BaseModel):
    """Normalised resource card returned by all providers."""

    title: str
    url: str
    source: Literal["ddgs", "youtube", "openalex", "custom"]
    type: Literal["webpage", "video", "paper"]
    snippet: str
    thumbnail_url: str | None = None
    metadata: ResourceMetadata
    relevance_score: float | None = None
    relevance_reason: str | None = None
    verdict: str | None = Field(default=None, description="use_it | adapt_it | skip_it")


class SourceError(BaseModel):
    """Error from a single search provider."""

    source: Literal["ddgs", "youtube", "openalex", "custom"]
    message: str


_MAX_QUERIES_PER_PROVIDER = 3


class GeneratedSearchQueries(BaseModel):
    """Agent-generated queries sent to each provider."""

    ddgs: list[str]
    youtube: list[str]
    openalex: list[str]

    @field_validator("ddgs", "youtube", "openalex", mode="before")
    @classmethod
    def _clamp_length(cls, v: list[Any]) -> list[str]:
        if not isinstance(v, list):
            raise ValueError("Expected a list of query strings")
        return [str(q) for q in v if q][:_MAX_QUERIES_PER_PROVIDER]


class EvaluateRequest(BaseModel):
    """Phase 2: evaluate a single resource."""

    search_id: str = Field(..., min_length=1)
    preset_id: uuid.UUID
    resource_url: str = Field(..., min_length=1)
    resource_title: str = Field(..., min_length=1)
    resource_source: str
    resource_snippet: str = ""
    query: str = Field(..., min_length=1, max_length=500)


class SearchResponse(BaseModel):
    """Unified federated search response."""

    query: str
    preset_id: uuid.UUID
    total_results: int
    counts_by_source: dict[str, int]
    results: list[ResourceCard]
    errors: list[SourceError]
    generated_queries: GeneratedSearchQueries | None = None
