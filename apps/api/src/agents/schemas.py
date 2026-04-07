"""Evaluation schemas — triage + risk scan + final judgment."""

from typing import Literal

from pydantic import BaseModel, Field

from src.discovery.schemas import SearchResponse

# ── Type aliases ─────────────────────────────────────────────────────
Verdict = Literal["use_it", "adapt_it", "skip_it"]
MetricRating = Literal["strong", "adequate", "weak"]
Confidence = Literal["high", "moderate", "low"]
FlagCategory = Literal[
    "outdated_content",
    "bias_or_framing",
    "factual_concern",
    "safety_concern",
    "misleading_match",
]
FlagSeverity = Literal["high", "medium", "low"]


# ── Shared building blocks ───────────────────────────────────────────
class MetricResult(BaseModel):
    """One of the 3 evaluation metrics."""

    rating: MetricRating
    reason: str


class ResourceFlag(BaseModel):
    """A single issue found by the risk scanner, backed by evidence."""

    category: FlagCategory
    severity: FlagSeverity
    evidence_quote: str
    explanation: str
    suggested_action: str


class AdaptationSuggestion(BaseModel):
    """A concrete adaptation the teacher can apply."""

    action: str
    rationale: str


# ── Call 1 output ────────────────────────────────────────────────────
class TriageResult(BaseModel):
    """Output of the Triage Agent (Call 1)."""

    verdict: Verdict
    curriculum_fit: MetricResult
    accessibility: MetricResult
    trustworthiness: MetricResult
    fit_reason: str
    adaptations: list[AdaptationSuggestion] = Field(default_factory=list)


# ── Call 2 output ────────────────────────────────────────────────────
class RiskScanResult(BaseModel):
    """Output of the Risk Scanner (Call 2)."""

    flags: list[ResourceFlag] = Field(default_factory=list)
    summary: str


# ── Call 3 output (final, stored in DB) ──────────────────────────────
class JudgmentResult(BaseModel):
    """Final judgment combining triage + risk scan, presented to the teacher."""

    resource_url: str
    verdict: Verdict
    confidence: Confidence
    curriculum_fit: MetricResult
    accessibility: MetricResult
    trustworthiness: MetricResult
    reasoning_chain: str
    flags: list[ResourceFlag] = Field(default_factory=list)
    adaptations: list[AdaptationSuggestion] = Field(default_factory=list)
    override_notes: str | None = None


# ── Search response with judgments ───────────────────────────────────
class JudgedSearchResponse(SearchResponse):
    """Extends SearchResponse with judgment data for the top results."""

    judgments: list[JudgmentResult] = Field(default_factory=list)
