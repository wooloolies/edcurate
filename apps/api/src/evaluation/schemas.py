"""Evaluation schemas — 7-dimension scoring and evaluated search response."""

from typing import Literal

from pydantic import BaseModel, Field

from src.discovery.schemas import SearchResponse

AdversarialFlagCategory = Literal[
    "false_positive",
    "hidden_bias",
    "accuracy_gap",
    "safety",
    "licensing_trap",
]
AdversarialFlagSeverity = Literal["high", "medium", "low"]
AdversarialVerdict = Literal[
    "approved",
    "approved_with_caveats",
    "flagged_for_teacher_review",
    "not_recommended",
]


class DimensionScore(BaseModel):
    """Score for a single evaluation dimension."""

    score: int = Field(..., ge=1, le=10)
    max: int = 10
    reason: str


class AdversarialFlag(BaseModel):
    """Single issue raised by the adversarial reviewer."""

    category: AdversarialFlagCategory
    severity: AdversarialFlagSeverity
    explanation: str
    suggested_action: str


class AdversarialReviewResult(BaseModel):
    """Output of Agent 4 — challenges Agent 3 scores and surfaces risks."""

    verdict: AdversarialVerdict
    flags: list[AdversarialFlag] = Field(default_factory=list)
    score_adjustments: dict[str, DimensionScore] = Field(default_factory=dict)
    review_summary: str


class EvaluationResult(BaseModel):
    """Full evaluation of a single resource across 7 dimensions."""

    resource_url: str
    overall_score: float = Field(..., ge=0.0, le=10.0)
    relevance_reason: str
    recommended_use: Literal["primary_resource", "supplementary", "reference_only"]
    scores: dict[str, DimensionScore]
    adversarial: AdversarialReviewResult | None = None


class EvaluatedSearchResponse(SearchResponse):
    """Extends SearchResponse with evaluation data for the top 4 results."""

    evaluations: list[EvaluationResult] = Field(default_factory=list)
