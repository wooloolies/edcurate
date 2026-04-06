"""Agent 4 — Independent adversarial risk assessment.

Runs blind in parallel with Agent 3.
"""

from src.agents.base import BaseAgent, format_teacher_context
from src.agents.schemas import (
    AdversarialFlag,
    AdversarialReviewResult,
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

_SYSTEM_PROMPT = """\
You are an Adversarial Review Agent for educational resources.
You independently analyze resource content for risks and issues.
You do NOT have access to any prior evaluation — form your own judgement
from the resource passages provided.
You MUST return ONLY valid JSON.
Be constructive: flag real issues backed by evidence from the passages.
If evidence is thin, say so in review_summary and set verdict to "approved".\
"""

_USER_TEMPLATE = """\
TEACHER CONTEXT:
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
1. Analyze the passages independently for these 5 risk categories:
   - false_positive: Content that appears educational but is misleading,
     inappropriate for the year level, or mismatched to the curriculum.
   - hidden_bias: Subtle framing issues, representation gaps,
     culturally insensitive language (e.g. passive voice around
     colonisation, stereotyping, outdated terminology).
   - accuracy_gap: Outdated data, superseded findings, unverified
     claims, missing citations for strong assertions.
   - safety: Content requiring warnings or teacher review for the
     target year level (mental health, violence, controversial topics).
   - licensing_trap: Misidentified permissions, mixed licensing
     (e.g. CC text but Getty images), restrictive terms.
2. verdict must be one of: approved | approved_with_caveats |
   flagged_for_teacher_review | not_recommended
3. flags: list of objects with category
   (false_positive|hidden_bias|accuracy_gap|safety|licensing_trap),
   severity (high|medium|low), explanation, suggested_action.

Return ONLY this JSON:
{{
  "verdict": "...",
  "flags": [],
  "review_summary": "..."
}}\
"""


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

        summary = str(data.get("review_summary", "")).strip() or "No summary provided."

        return AdversarialReviewResult(
            verdict=verdict,  # type: ignore[arg-type]
            flags=flags,
            score_adjustments={},
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
