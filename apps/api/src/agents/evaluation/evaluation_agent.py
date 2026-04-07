"""Deep Evaluation Agent — Gemini-powered 7-dimension resource scorer."""

from src.agents.base import DIMENSIONS, BaseAgent, format_teacher_context
from src.agents.schemas import DimensionScore, EvaluationResult
from src.presets.model import ClassroomPreset

_SYSTEM_PROMPT = """You are a Deep Evaluation Agent for educational resources.
You score resources across 7 dimensions on a 1-10 scale.
You MUST return ONLY valid JSON — no markdown, no explanation outside JSON.
"""

_EVAL_TEMPLATE = """TEACHER CONTEXT:
{teacher_context}
*(Note: ignore the 'Language' parameter when scoring resources)*

RESOURCE:
- Title: {title}
- URL: {url}
- Source: {source}

RETRIEVED CONTENT CHUNKS:
{chunks_text}

Score this resource on these 7 dimensions (1-10 each):
1. curriculum_alignment — How well does it match the targeted syllabus outcomes?
2. pedagogical_quality — Bloom's taxonomy level, inquiry depth, engagement potential
3. reading_level — Appropriate for the year level and EAL/D students?
4. bias_representation — Diverse perspectives, cultural sensitivity, balanced framing
5. factual_accuracy — Are claims accurate and well-sourced?
6. source_credibility — Domain authority, authorship, institutional backing, recency
7. licensing_ip — Is it openly licensed or freely usable?

Return ONLY this JSON structure:
{{
  "curriculum_alignment": {{"score": N, "reason": "..."}},
  "pedagogical_quality": {{"score": N, "reason": "..."}},
  "reading_level": {{"score": N, "reason": "..."}},
  "bias_representation": {{"score": N, "reason": "..."}},
  "factual_accuracy": {{"score": N, "reason": "..."}},
  "source_credibility": {{"score": N, "reason": "..."}},
  "licensing_ip": {{"score": N, "reason": "..."}},
  "overall_score": N.N,
  "relevance_reason": "Summary of why this is relevant to the curriculum intent",
  "recommended_use": "primary_resource|supplementary|reference_only"
}}"""


class EvaluationAgent(BaseAgent[EvaluationResult]):
    """Scores a single resource across 7 pedagogical dimensions."""

    temperature = 0.2

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    def build_prompt(self, **kwargs: object) -> str:
        preset: ClassroomPreset = kwargs["preset"]  # type: ignore[assignment]
        return _EVAL_TEMPLATE.format(
            teacher_context=format_teacher_context(preset),
            title=kwargs["title"],
            url=kwargs["url"],
            source=kwargs["source"],
            chunks_text=str(kwargs["chunks_text"])[:8000],
        )

    def parse_response(self, data: dict) -> EvaluationResult:
        scores: dict[str, DimensionScore] = {}
        for dim in DIMENSIONS:
            dim_data = data.get(dim, {})
            scores[dim] = DimensionScore(
                score=int(dim_data.get("score", 5)),
                reason=str(dim_data.get("reason", "No reason provided")),
            )

        overall = float(data.get("overall_score", 0))
        if overall == 0:
            overall = round(
                sum(s.score for s in scores.values()) / len(scores),
                1,
            )

        relevance_reason = str(data.get("relevance_reason", "No reason provided."))

        recommended = data.get("recommended_use", "supplementary")
        if recommended not in (
            "primary_resource",
            "supplementary",
            "reference_only",
        ):
            recommended = "supplementary"

        # resource_url is set by the caller via model_copy since it's
        # an input parameter, not part of the LLM response.
        return EvaluationResult(
            resource_url="",
            overall_score=overall,
            relevance_reason=relevance_reason,
            recommended_use=recommended,
            scores=scores,
        )


_agent = EvaluationAgent()


async def evaluate_resource(
    title: str,
    url: str,
    source: str,
    chunks_text: str,
    preset: ClassroomPreset,
) -> EvaluationResult | None:
    """Evaluate a single resource using Gemini LLM."""
    result = await _agent.run(
        title=title,
        url=url,
        source=source,
        chunks_text=chunks_text,
        preset=preset,
    )
    if result is not None:
        result = result.model_copy(update={"resource_url": url})
    return result
