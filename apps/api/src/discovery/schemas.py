import uuid
from typing import Annotated, Literal

from pydantic import BaseModel, Field

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


# Discriminated union for metadata
ResourceMetadata = Annotated[
    DdgsMetadata | YoutubeMetadata | OpenAlexMetadata,
    Field(discriminator="source"),
]


class ResourceCard(BaseModel):
    """Normalised resource card returned by all providers."""

    title: str
    url: str
    source: Literal["ddgs", "youtube", "openalex"]
    type: Literal["webpage", "video", "paper"]
    snippet: str
    thumbnail_url: str | None = None
    metadata: ResourceMetadata
    relevance_score: float | None = None
    relevance_reason: str | None = None
    evaluation_details: dict[str, dict[str, object]] | None = Field(
        default=None, description="Detailed dimension scores"
    )


class SourceError(BaseModel):
    """Error from a single search provider."""

    source: Literal["ddgs", "youtube", "openalex"]
    message: str


class SearchResponse(BaseModel):
    """Unified federated search response."""

    query: str
    preset_id: uuid.UUID
    total_results: int
    counts_by_source: dict[str, int]
    results: list[ResourceCard]
    errors: list[SourceError]
