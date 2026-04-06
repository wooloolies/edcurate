"""Agent 4 — Independent adversarial risk assessment.

Runs blind in parallel with Agent 3.
"""

from src.agents.base import DIMENSIONS_SET, BaseAgent, format_teacher_context
from src.agents.schemas import (
    AdversarialFlag,
    AdversarialReviewResult,
    DimensionScore,
)
from src.presets.model import ClassroomPreset

_VALID_CATEGORIES = frozenset(
    {
        "false_positive",
        "hidden_bias",
        "accuracy_gap",
        "safety",
        "licensing_trap",
    }
)
_VALID_SEVERITY = frozenset({"high", "medium", "low"})
_VALID_VERDICT = frozenset(
    {
        "approved",
        "approved_with_caveats",
        "flagged_for_teacher_review",
        "not_recommended",
    }
)

_SYSTEM_PROMPT = """You are an Adversarial Review Agent for educational resources.
You independently assess a resource for hidden risks, biases, accuracy gaps,
safety concerns, and licensing traps based on its content passages.
You MUST return ONLY valid JSON.
Be constructive: flag real issues; do not invent problems.
If evidence is thin, say so in review_summary.
"""

_USER_TEMPLATE = """TEACHER CONTEXT:
{teacher_context}

RESOURCE:
- Title: {title}
- URL: {url}
- Source: {source}

PASSAGES — factual / verifiable claims (retrieved):
{claim_chunks}

PASSAGES — framing / representation sensitivity (retrieved):
{framing_chunks}

Tasks:
1. Assess the resource passages for hidden bias, accuracy gaps,
   safety edges, licensing traps, and potential false positives
   (content that looks educational but is misleading).
2. verdict must be one of: approved | approved_with_caveats |
   flagged_for_teacher_review | not_recommended
3. flags: list of objects with category
   (false_positive|hidden_bias|accuracy_gap|safety|licensing_trap),
   severity (high|medium|low), explanation, suggested_action.
4. score_adjustments: for any of the 7 dimensions you believe should be
   penalised, include an entry with score (1-10), max 10, reason.
   Dimensions: curriculum_alignment, pedagogical_quality, reading_level,
   bias_representation, factual_accuracy, source_credibility, licensing_ip.

Return ONLY this JSON:
{{
  "verdict": "...",
  "flags": [],
  "score_adjustments": {{}},
  "review_summary": "..."
}}"""


class AdversarialAgent(BaseAgent[AdversarialReviewResult]):
    """Independently assesses resource risks (runs blind, without Agent 3 output)."""

    temperature = 0.15

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    def build_prompt(self, **kwargs: object) -> str:
        preset: ClassroomPreset = kwargs["preset"]  # type: ignore[assignment]
        return _USER_TEMPLATE.format(
            teacher_context=format_teacher_context(preset),
            title=kwargs["title"],
            url=kwargs["url"],
            source=kwargs["source"],
            claim_chunks=str(kwargs["claim_chunks_text"])[:8000],
            framing_chunks=str(kwargs["framing_chunks_text"])[:8000],
        )

    def parse_response(self, data: dict) -> AdversarialReviewResult:
        verdict = str(data.get("verdict", "approved_with_caveats")).strip()
        if verdict not in _VALID_VERDICT:
            verdict = "approved_with_caveats"

        flags: list[AdversarialFlag] = []
        raw_flags = data.get("flags", [])
        if isinstance(raw_flags, list):
            for item in raw_flags:
                if not isinstance(item, dict):
                    continue
                cat = str(item.get("category", "")).strip()
                sev = str(item.get("severity", "medium")).strip()
                if cat not in _VALID_CATEGORIES or sev not in _VALID_SEVERITY:
                    continue
                flags.append(
                    AdversarialFlag(
                        category=cat,  # type: ignore[arg-type]
                        severity=sev,  # type: ignore[arg-type]
                        explanation=(str(item.get("explanation", "")).strip() or "—"),
                        suggested_action=(
                            str(item.get("suggested_action", "")).strip() or "—"
                        ),
                    )
                )

        adjustments: dict[str, DimensionScore] = {}
        raw_adj = data.get("score_adjustments", {})
        if isinstance(raw_adj, dict):
            for key, val in raw_adj.items():
                if key not in DIMENSIONS_SET or not isinstance(val, dict):
                    continue
                try:
                    adjustments[key] = DimensionScore(
                        score=int(val.get("score", 5)),
                        max=int(val.get("max", 10)),
                        reason=str(
                            val.get("reason", "Adjusted after adversarial review.")
                        ),
                    )
                except (TypeError, ValueError):
                    continue

        summary = str(data.get("review_summary", "")).strip() or "No summary provided."

        return AdversarialReviewResult(
            verdict=verdict,  # type: ignore[arg-type]
            flags=flags,
            score_adjustments=adjustments,
            review_summary=summary,
        )


_agent = AdversarialAgent()


async def adversarial_review_resource(
    claim_chunks_text: str,
    framing_chunks_text: str,
    title: str,
    url: str,
    source: str,
    preset: ClassroomPreset,
) -> AdversarialReviewResult | None:
    """Run Agent 4 for one resource. Returns None on failure."""
    return await _agent.run(
        claim_chunks_text=claim_chunks_text,
        framing_chunks_text=framing_chunks_text,
        title=title,
        url=url,
        source=source,
        preset=preset,
    )
