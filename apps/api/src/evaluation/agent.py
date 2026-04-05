"""Deep Evaluation Agent — Gemini-powered 7-dimension resource scorer."""

import json

from google import genai
from google.genai import types

from src.evaluation.schemas import DimensionScore, EvaluationResult
from src.lib.config import settings
from src.lib.logging import get_logger
from src.presets.model import ClassroomPreset

logger = get_logger(__name__)

_MODEL = "gemini-2.5-flash"

_DIMENSIONS = [
    "curriculum_alignment",
    "pedagogical_quality",
    "reading_level",
    "bias_representation",
    "factual_accuracy",
    "source_credibility",
    "licensing_ip",
]

_SYSTEM_PROMPT = """You are a Deep Evaluation Agent for educational resources.
You score resources across 7 dimensions on a 1-10 scale.
You MUST return ONLY valid JSON — no markdown, no explanation outside JSON.
"""

_EVAL_TEMPLATE = """TEACHER CONTEXT:
- Subject: {subject}
- Year Level: {year_level}
- Curriculum: {curriculum}
- Topic: {topic}
- Country: {country}
- Language: {language}
- Student Interests: {interests}
- Class Size: {class_size}
- EAL/D Students: {eal_d}

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


def _get_client() -> genai.Client:
    """Create a Vertex AI client using Application Default Credentials."""
    return genai.Client(
        vertexai=True,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location="us-central1",
    )


async def evaluate_resource(
    title: str,
    url: str,
    source: str,
    chunks_text: str,
    preset: ClassroomPreset,
) -> EvaluationResult | None:
    """
    Evaluate a single resource using Gemini LLM.

    Returns EvaluationResult or None if evaluation fails.
    """
    interests = ", ".join(preset.student_interests or [])

    prompt = _EVAL_TEMPLATE.format(
        subject=preset.subject,
        year_level=preset.year_level,
        curriculum=preset.curriculum_framework or "Not specified",
        topic=preset.topic or "Not specified",
        country=preset.country,
        language=preset.teaching_language,
        interests=interests or "Not specified",
        class_size=preset.class_size or "Not specified",
        eal_d=preset.eal_d_students or 0,
        title=title,
        url=url,
        source=source,
        chunks_text=chunks_text[:8000],  # Cap at ~8k chars
    )

    client = _get_client()

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=_SYSTEM_PROMPT,
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )

            raw = response.text.strip()
            data = json.loads(raw)

            scores: dict[str, DimensionScore] = {}
            for dim in _DIMENSIONS:
                dim_data = data.get(dim, {})
                scores[dim] = DimensionScore(
                    score=int(dim_data.get("score", 5)),
                    reason=str(dim_data.get("reason", "No reason provided")),
                )

            overall = float(data.get("overall_score", 0))
            if overall == 0:
                # Calculate from individual scores
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

            return EvaluationResult(
                resource_url=url,
                overall_score=overall,
                relevance_reason=relevance_reason,
                recommended_use=recommended,
                scores=scores,
            )

        except json.JSONDecodeError:
            logger.warning(
                "Gemini returned invalid JSON",
                attempt=attempt + 1,
                url=url,
            )
            if attempt == 0:
                continue  # Retry once
            return None
        except Exception as e:
            logger.error(
                "Evaluation failed",
                error=str(e),
                url=url,
                attempt=attempt + 1,
            )
            return None

    return None
