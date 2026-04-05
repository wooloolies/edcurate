"""Evaluation schemas — 7-dimension scoring and evaluated search response."""

from typing import Literal

from pydantic import BaseModel, Field

from src.discovery.schemas import SearchResponse


class DimensionScore(BaseModel):
    """Score for a single evaluation dimension."""

    score: int = Field(..., ge=1, le=10)
    max: int = 10
    reason: str


class EvaluationResult(BaseModel):
    """Full evaluation of a single resource across 7 dimensions."""

    resource_url: str
    overall_score: float = Field(..., ge=0.0, le=10.0)
    relevance_reason: str
    recommended_use: Literal["primary_resource", "supplementary", "reference_only"]
    scores: dict[str, DimensionScore]


class EvaluatedSearchResponse(SearchResponse):
    """Extends SearchResponse with evaluation data for the top 4 results."""

    evaluations: list[EvaluationResult] = Field(default_factory=list)
