"""Agent 4 — Blind adversarial review of educational resources (single Gemini pass).

This agent evaluates resources INDEPENDENTLY — it never sees Agent 3's scores.
It focuses on 5 risk categories: false_positive, hidden_bias, accuracy_gap,
safety, and licensing_trap.  A deterministic reconciler (reconciler.py) later
merges its flags with Agent 3's scores.
"""

import asyncio
import json

from google import genai
from google.genai import types

from src.evaluation.schemas import AdversarialReviewResult
from src.lib.config import settings
from src.lib.logging import get_logger
from src.presets.model import ClassroomPreset

logger = get_logger(__name__)

_MODEL = "gemini-2.5-flash"

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
- Subject: {subject}
- Year Level: {year_level}
- Curriculum: {curriculum}
- Topic: {topic}
- Country: {country}
- Language: {language}

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


def _get_client() -> genai.Client:
    return genai.Client(
        vertexai=True,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location="us-central1",
    )


def _parse_review(data: dict[str, object]) -> AdversarialReviewResult:
    verdict_raw = data.get("verdict", "approved_with_caveats")
    verdict = str(verdict_raw).strip()
    if verdict not in _VALID_VERDICT:
        verdict = "approved_with_caveats"

    flags_payload: list[dict[str, str]] = []
    raw_flags = data.get("flags", [])
    if isinstance(raw_flags, list):
        for item in raw_flags:
            if not isinstance(item, dict):
                continue
            cat = str(item.get("category", "")).strip()
            sev = str(item.get("severity", "medium")).strip()
            if cat not in _VALID_CATEGORIES or sev not in _VALID_SEVERITY:
                continue
            flags_payload.append(
                {
                    "category": cat,
                    "severity": sev,
                    "explanation": str(item.get("explanation", "")).strip() or "—",
                    "suggested_action": (
                        str(item.get("suggested_action", "")).strip() or "—"
                    ),
                }
            )

    summary = str(data.get("review_summary", "")).strip() or "No summary provided."

    return AdversarialReviewResult.model_validate(
        {
            "verdict": verdict,
            "flags": flags_payload,
            "score_adjustments": {},
            "review_summary": summary,
        }
    )


async def adversarial_review_resource(
    claim_chunks_text: str,
    framing_chunks_text: str,
    title: str,
    url: str,
    source: str,
    preset: ClassroomPreset,
) -> AdversarialReviewResult | None:
    """Run Agent 4 (blind) for one resource. Returns None on failure.

    This function does NOT receive Agent 3's evaluation — it forms an
    independent assessment based solely on the resource passages and
    the teacher's classroom context.
    """
    prompt = _USER_TEMPLATE.format(
        subject=preset.subject,
        year_level=preset.year_level,
        curriculum=preset.curriculum_framework or "Not specified",
        topic=preset.topic or "Not specified",
        country=preset.country,
        language=preset.teaching_language,
        title=title,
        url=url,
        source=source,
        claim_chunks=claim_chunks_text[:8000],
        framing_chunks=framing_chunks_text[:8000],
    )

    client = _get_client()

    for attempt in range(2):
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=_SYSTEM_PROMPT,
                    temperature=0.15,
                    response_mime_type="application/json",
                ),
            )
            raw_text = response.text
            if raw_text is None or not raw_text.strip():
                raise ValueError("Empty adversarial response")
            data = json.loads(raw_text.strip())
            if not isinstance(data, dict):
                raise ValueError("Adversarial JSON root must be object")
            return _parse_review(data)
        except json.JSONDecodeError:
            logger.warning(
                "Adversarial invalid JSON",
                attempt=attempt + 1,
                url=url,
            )
            if attempt == 0:
                continue
            return None
        except Exception as e:
            logger.error(
                "Adversarial review failed",
                error=str(e),
                url=url,
                attempt=attempt + 1,
            )
            return None

    return None
