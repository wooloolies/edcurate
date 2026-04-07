"""Call 3 — Final Judge: reconciles Triage + Risk Scanner outputs.

Sequential — runs after Calls 1 and 2 complete.
Sees both outputs and produces the final teacher-facing judgment.
"""

from src.agents.base import BaseAgent, format_teacher_context
from src.agents.schemas import (
    AdaptationSuggestion,
    JudgmentResult,
    MetricResult,
    ResourceFlag,
    RiskScanResult,
    TriageResult,
)
from src.presets.model import ClassroomPreset

_SYSTEM_PROMPT = """\
You are the Final Judge for educational resource evaluation.
You have received two independent assessments of the same resource:
1. A Triage Agent that assessed classroom fit (verdict + 3 metrics)
2. A Risk Scanner that flagged content issues (with evidence quotes)

Your job is to reconcile these into a single, final recommendation \
for the teacher. You must:
- Weigh both assessments and resolve any disagreements
- Produce a clear reasoning chain the teacher can read and trust
- Adjust metrics if the Risk Scanner found issues the Triage Agent missed
- Be transparent about uncertainty — use confidence levels honestly

You MUST return ONLY valid JSON.\
"""

_USER_TEMPLATE = """\
TEACHER CONTEXT:
{teacher_context}

RESOURCE:
- Title: {title}
- URL: {url}

TRIAGE AGENT ASSESSMENT (Call 1):
- Verdict: {triage_verdict}
- Curriculum Fit: {triage_cf_rating} — {triage_cf_reason}
- Accessibility: {triage_acc_rating} — {triage_acc_reason}
- Trustworthiness: {triage_trust_rating} — {triage_trust_reason}
- Fit Reason: {triage_fit_reason}
- Adaptations Suggested: {triage_adaptations}

RISK SCANNER FINDINGS (Call 2):
- Summary: {risk_summary}
- Flags: {risk_flags}

INSTRUCTIONS:
1. Decide the final verdict: use_it, adapt_it, or skip_it
   - If Risk Scanner found high-severity flags, the verdict should be
     at least adapt_it (or skip_it if issues are fundamental)
   - If both agents agree, reflect that confidence
   - If they disagree, explain why in the reasoning chain

2. Set confidence: high, moderate, or low
   - high: both agents agree and evidence is clear
   - moderate: minor disagreements or thin evidence
   - low: significant disagreement or uncertain evidence

3. Finalize the 3 metrics (strong/adequate/weak), adjusting from
   Triage if Risk Scanner found relevant issues

4. Write a reasoning_chain: 3-5 sentences the teacher will read.
   Explain what you found, how you weighed it, and why you reached
   this verdict. Be specific — reference evidence, not abstractions.

5. Merge flags from Risk Scanner (include all) and add any issues
   from Triage not already covered

6. Merge adaptation suggestions from Triage, adding any new ones
   prompted by Risk Scanner findings

7. If you override either agent's assessment, explain why in
   override_notes. If you agree with both, set override_notes to null.

Return ONLY this JSON:
{{
  "verdict": "use_it|adapt_it|skip_it",
  "confidence": "high|moderate|low",
  "curriculum_fit": {{"rating": "strong|adequate|weak", "reason": "..."}},
  "accessibility": {{"rating": "strong|adequate|weak", "reason": "..."}},
  "trustworthiness": {{"rating": "strong|adequate|weak", "reason": "..."}},
  "reasoning_chain": "3-5 sentences for the teacher...",
  "flags": [
    {{
      "category": "...",
      "severity": "high|medium|low",
      "evidence_quote": "...",
      "explanation": "...",
      "suggested_action": "..."
    }}
  ],
  "adaptations": [
    {{"action": "...", "rationale": "..."}}
  ],
  "override_notes": "..." or null
}}\
"""

_VALID_VERDICTS = frozenset({"use_it", "adapt_it", "skip_it"})
_VALID_RATINGS = frozenset({"strong", "adequate", "weak"})
_VALID_CONFIDENCE = frozenset({"high", "moderate", "low"})
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


def _format_flags(flags: list[ResourceFlag]) -> str:
    if not flags:
        return "None found."
    parts = []
    for f in flags:
        parts.append(
            f"- [{f.severity.upper()}] {f.category}: {f.explanation}\n"
            f'  Evidence: "{f.evidence_quote}"\n'
            f"  Suggested: {f.suggested_action}"
        )
    return "\n".join(parts)


def _format_adaptations(adaptations: list[AdaptationSuggestion]) -> str:
    if not adaptations:
        return "None."
    return "\n".join(f"- {a.action} ({a.rationale})" for a in adaptations)


class FinalJudge(BaseAgent[JudgmentResult]):
    """Reconciles Call 1 + Call 2 into a final teacher-facing judgment."""

    temperature = 0.15

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    def build_prompt(self, **kwargs: object) -> str:
        preset: ClassroomPreset = kwargs["preset"]  # type: ignore[assignment]
        triage: TriageResult = kwargs["triage"]  # type: ignore[assignment]
        risk: RiskScanResult = kwargs["risk"]  # type: ignore[assignment]

        return _USER_TEMPLATE.format(
            teacher_context=format_teacher_context(preset),
            title=kwargs["title"],
            url=kwargs["url"],
            triage_verdict=triage.verdict,
            triage_cf_rating=triage.curriculum_fit.rating,
            triage_cf_reason=triage.curriculum_fit.reason,
            triage_acc_rating=triage.accessibility.rating,
            triage_acc_reason=triage.accessibility.reason,
            triage_trust_rating=triage.trustworthiness.rating,
            triage_trust_reason=triage.trustworthiness.reason,
            triage_fit_reason=triage.fit_reason,
            triage_adaptations=_format_adaptations(triage.adaptations),
            risk_summary=risk.summary,
            risk_flags=_format_flags(risk.flags),
        )

    def parse_response(self, data: dict) -> JudgmentResult:
        verdict = str(data.get("verdict", "adapt_it")).strip()
        if verdict not in _VALID_VERDICTS:
            verdict = "adapt_it"

        confidence = str(data.get("confidence", "moderate")).strip()
        if confidence not in _VALID_CONFIDENCE:
            confidence = "moderate"

        def _parse_metric(key: str) -> MetricResult:
            raw = data.get(key, {})
            if not isinstance(raw, dict):
                return MetricResult(rating="adequate", reason="No data provided")
            rating = str(raw.get("rating", "adequate")).strip()
            if rating not in _VALID_RATINGS:
                rating = "adequate"
            reason = str(raw.get("reason", "No reason provided")).strip()
            return MetricResult(rating=rating, reason=reason)

        # Parse flags
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
                flags.append(
                    ResourceFlag(
                        category=cat,
                        severity=sev,
                        evidence_quote=evidence or "—",
                        explanation=(str(item.get("explanation", "")).strip() or "—"),
                        suggested_action=(
                            str(item.get("suggested_action", "")).strip() or "—"
                        ),
                    )
                )

        # Parse adaptations
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

        reasoning = str(data.get("reasoning_chain", "No reasoning provided.")).strip()

        override = data.get("override_notes")
        override_notes = str(override).strip() if override is not None else None

        # resource_url is set by the caller via model_copy
        return JudgmentResult(
            resource_url="",
            verdict=verdict,
            confidence=confidence,
            curriculum_fit=_parse_metric("curriculum_fit"),
            accessibility=_parse_metric("accessibility"),
            trustworthiness=_parse_metric("trustworthiness"),
            reasoning_chain=reasoning,
            flags=flags,
            adaptations=adaptations,
            override_notes=override_notes,
        )


_judge = FinalJudge()


async def judge_resource(
    triage: TriageResult,
    risk: RiskScanResult,
    title: str,
    url: str,
    preset: ClassroomPreset,
) -> JudgmentResult | None:
    """Run Call 3 — reconcile triage + risk scan. Returns None on failure."""
    result = await _judge.run(
        triage=triage,
        risk=risk,
        title=title,
        url=url,
        preset=preset,
    )
    if result is not None:
        result = result.model_copy(update={"resource_url": url})
    return result
