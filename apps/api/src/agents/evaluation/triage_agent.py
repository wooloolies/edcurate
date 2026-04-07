"""Call 1 — Triage Agent: should this teacher use this resource?"""

from src.agents.base import BaseAgent, format_teacher_context
from src.agents.schemas import AdaptationSuggestion, MetricResult, TriageResult
from src.presets.model import ClassroomPreset

_SYSTEM_PROMPT = """\
You are a Triage Agent for educational resources.
Your job is to answer ONE question: should this specific teacher use this \
resource in their classroom?

You evaluate 3 metrics:
- curriculum_fit: Does it match the targeted syllabus outcomes, year level, \
and framework?
- accessibility: Is the reading level right for this class, including EAL/D \
students?
- trustworthiness: Is the source credible, the content accurate, and the \
material safe?

You MUST return ONLY valid JSON — no markdown, no explanation outside JSON.
Be rigorous. Most resources are adequate at best — do not inflate ratings.\
"""

_USER_TEMPLATE = """\
TEACHER CONTEXT:
{teacher_context}

RESOURCE:
- Title: {title}
- URL: {url}
- Source: {source}

RETRIEVED CONTENT CHUNKS:
{chunks_text}
{readability_block}
{license_block}
INSTRUCTIONS:
1. Decide a verdict: use_it, adapt_it, or skip_it.
   - use_it: resource is directly usable in this classroom with minimal effort
   - adapt_it: good core content but needs changes for this specific context
   - skip_it: not suitable — wrong level, inaccurate, unsafe, or irrelevant
2. Rate each metric as strong, adequate, or weak with a 1-sentence reason.
   - strong: clearly meets the need for this specific classroom
   - adequate: usable but has gaps or limitations
   - weak: does not meet the need
3. If verdict is adapt_it, provide concrete adaptation suggestions.

Return ONLY this JSON:
{{
  "verdict": "use_it|adapt_it|skip_it",
  "curriculum_fit": {{"rating": "strong|adequate|weak", "reason": "..."}},
  "accessibility": {{"rating": "strong|adequate|weak", "reason": "..."}},
  "trustworthiness": {{"rating": "strong|adequate|weak", "reason": "..."}},
  "fit_reason": "2-3 sentences on why this resource fits or doesn't fit this classroom",
  "adaptations": [
    {{"action": "Replace X with Y", "rationale": "Why this helps"}}
  ]
}}\
"""

_READABILITY_BLOCK = """\

COMPUTED READABILITY (automated — use these, do not estimate your own):
- Flesch-Kincaid grade level: {fk_grade}
- Coleman-Liau index: {cli}
- Target year level: {year_level}
- EAL/D students in class: {eal_d_count}

Anchor your accessibility rating to these metrics.
Grade level 2+ years above target → weak accessibility.
Classes with EAL/D students need content 1-2 grades below nominal.\
"""

_LICENSE_BLOCK = """\

LICENSE METADATA (extracted from page):
{license_text}
If no license info found, factor that into trustworthiness \
(unknown licensing = adequate at best).\
"""

_VALID_VERDICTS = frozenset({"use_it", "adapt_it", "skip_it"})
_VALID_RATINGS = frozenset({"strong", "adequate", "weak"})


class TriageAgent(BaseAgent[TriageResult]):
    """Scores a resource for classroom fit across 3 metrics."""

    temperature = 0.2

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    def build_prompt(self, **kwargs: object) -> str:
        preset: ClassroomPreset = kwargs["preset"]  # type: ignore[assignment]

        # Build optional readability block
        readability = kwargs.get("readability_metrics")
        if readability and isinstance(readability, dict):
            readability_block = _READABILITY_BLOCK.format(
                fk_grade=readability.get("flesch_kincaid_grade", "N/A"),
                cli=readability.get("coleman_liau_index", "N/A"),
                year_level=preset.year_level,
                eal_d_count=preset.eal_d_students or 0,
            )
        else:
            readability_block = ""

        # Build optional license block
        license_text = kwargs.get("license_metadata")
        if license_text and isinstance(license_text, str) and license_text.strip():
            license_block = _LICENSE_BLOCK.format(license_text=license_text.strip())
        else:
            license_block = ""

        return _USER_TEMPLATE.format(
            teacher_context=format_teacher_context(preset),
            title=kwargs["title"],
            url=kwargs["url"],
            source=kwargs["source"],
            chunks_text=str(kwargs["chunks_text"])[:12000],
            readability_block=readability_block,
            license_block=license_block,
        )

    def parse_response(self, data: dict) -> TriageResult:
        verdict = str(data.get("verdict", "adapt_it")).strip()
        if verdict not in _VALID_VERDICTS:
            verdict = "adapt_it"

        def _parse_metric(key: str) -> MetricResult:
            raw = data.get(key, {})
            if not isinstance(raw, dict):
                return MetricResult(rating="adequate", reason="No data provided")
            rating = str(raw.get("rating", "adequate")).strip()
            if rating not in _VALID_RATINGS:
                rating = "adequate"
            reason = str(raw.get("reason", "No reason provided")).strip()
            return MetricResult(rating=rating, reason=reason)

        adaptations: list[AdaptationSuggestion] = []
        raw_adaptations = data.get("adaptations", [])
        if isinstance(raw_adaptations, list):
            for item in raw_adaptations:
                if isinstance(item, dict) and item.get("action"):
                    adaptations.append(
                        AdaptationSuggestion(
                            action=str(item["action"]).strip(),
                            rationale=str(item.get("rationale", "")).strip() or "—",
                        )
                    )

        return TriageResult(
            verdict=verdict,
            curriculum_fit=_parse_metric("curriculum_fit"),
            accessibility=_parse_metric("accessibility"),
            trustworthiness=_parse_metric("trustworthiness"),
            fit_reason=str(data.get("fit_reason", "No reason provided")).strip(),
            adaptations=adaptations,
        )


_agent = TriageAgent()


async def triage_resource(
    title: str,
    url: str,
    source: str,
    chunks_text: str,
    preset: ClassroomPreset,
    readability_metrics: dict[str, float] | None = None,
    license_metadata: str | None = None,
) -> TriageResult | None:
    """Run Call 1 triage for one resource. Returns None on failure."""
    return await _agent.run(
        title=title,
        url=url,
        source=source,
        chunks_text=chunks_text,
        preset=preset,
        readability_metrics=readability_metrics,
        license_metadata=license_metadata,
    )
