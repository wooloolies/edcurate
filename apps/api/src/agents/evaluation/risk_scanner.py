"""Call 2 — Risk Scanner: what's wrong with this content?

Runs blind in parallel with Call 1 (Triage Agent).
"""

from src.agents.base import BaseAgent, format_teacher_context
from src.agents.schemas import ResourceFlag, RiskScanResult
from src.presets.model import ClassroomPreset

_VALID_CATEGORIES = frozenset(
    {
        "outdated_content",
        "bias_or_framing",
        "factual_concern",
        "safety_concern",
        "misleading_match",
    }
)
_VALID_SEVERITY = frozenset({"high", "medium", "low"})

_SYSTEM_PROMPT = """\
You are a Risk Scanner for educational resources.
You independently analyze resource content for problems a teacher might miss.
You do NOT decide whether to use the resource — only flag issues.
You MUST return ONLY valid JSON.

Rules:
- Every flag MUST include a direct quote from the content as evidence_quote.
- If you cannot find a direct quote to support a flag, do not flag it.
- Be constructive: flag real issues, not hypothetical ones.
- If the content is clean, return empty flags and say so in summary.\
"""

_USER_TEMPLATE = """\
TEACHER CONTEXT:
{teacher_context}

RESOURCE:
- Title: {title}
- URL: {url}
- Source: {source}

PASSAGES — factual / verifiable claims:
{claim_chunks}

PASSAGES — framing / representation sensitivity:
{framing_chunks}

Scan for these 5 risk categories:
- outdated_content: Old data, superseded findings, stale statistics.
  Look for dates, figures, and claims that may no longer be current.
- bias_or_framing: Subtle framing issues, representation gaps,
  culturally insensitive language (e.g. passive voice around colonisation,
  stereotyping, outdated terminology, Western-default perspectives).
- factual_concern: Unverified claims, missing citations for strong assertions,
  logical errors, oversimplifications that could mislead students.
- safety_concern: Content requiring warnings or teacher preparation for the
  target year level (mental health, violence, controversial topics,
  graphic descriptions).
- misleading_match: Content that appears to match the curriculum topic but
  is actually about something different, targets the wrong year level,
  or has a misleading title/snippet.

Return ONLY this JSON:
{{
  "flags": [
    {{
      "category": "outdated_content|bias_or_framing|factual_concern"
                "|safety_concern|misleading_match",
      "severity": "high|medium|low",
      "evidence_quote": "Direct quote from the content...",
      "explanation": "Why this is a problem for this classroom",
      "suggested_action": "What the teacher should do about it"
    }}
  ],
  "summary": "1-2 sentence overview of findings (or 'No significant issues found')"
}}\
"""


class RiskScanner(BaseAgent[RiskScanResult]):
    """Independently scans resource content for risks (runs blind)."""

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

    def parse_response(self, data: dict) -> RiskScanResult:
        flags: list[ResourceFlag] = []
        raw_flags = data.get("flags", [])
        if isinstance(raw_flags, list):
            for item in raw_flags:
                if not isinstance(item, dict):
                    continue
                cat = str(item.get("category", "")).strip()
                sev = str(item.get("severity", "medium")).strip()
                if cat not in _VALID_CATEGORIES or sev not in _VALID_SEVERITY:
                    continue
                evidence = str(item.get("evidence_quote", "")).strip()
                if not evidence:
                    continue  # Skip flags without evidence
                flags.append(
                    ResourceFlag(
                        category=cat,
                        severity=sev,
                        evidence_quote=evidence,
                        explanation=(str(item.get("explanation", "")).strip() or "—"),
                        suggested_action=(
                            str(item.get("suggested_action", "")).strip() or "—"
                        ),
                    )
                )

        summary = str(data.get("summary", "")).strip() or "No summary provided."

        return RiskScanResult(flags=flags, summary=summary)


_scanner = RiskScanner()


async def scan_resource_risks(
    claim_chunks_text: str,
    framing_chunks_text: str,
    title: str,
    url: str,
    source: str,
    preset: ClassroomPreset,
) -> RiskScanResult | None:
    """Run Call 2 risk scan for one resource. Returns None on failure."""
    return await _scanner.run(
        claim_chunks_text=claim_chunks_text,
        framing_chunks_text=framing_chunks_text,
        title=title,
        url=url,
        source=source,
        preset=preset,
    )
