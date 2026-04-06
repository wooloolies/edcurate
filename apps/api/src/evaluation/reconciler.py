"""Deterministic reconciler — merges Agent 3 scores with Agent 4 flags.

Agent 3 produces 7-dimension scores (1-10).
Agent 4 produces flags in 5 risk categories + a verdict.
This module merges them without any LLM call:
  - Caps Agent 3 scores when Agent 4 flags a matching dimension
  - Derives a final verdict from flag severity counts
  - Populates score_adjustments so the frontend shows original → adjusted
"""

from src.evaluation.schemas import (
    AdversarialReviewResult,
    AdversarialVerdict,
    DimensionScore,
    EvaluationResult,
)
from src.lib.logging import get_logger

logger = get_logger(__name__)

# ── Flag category → Agent 3 dimension mapping ────────────────────────
# "false_positive" and "safety" do not map to a single dimension;
# they are handled via verdict override only.
_CATEGORY_TO_DIMENSION: dict[str, str] = {
    "hidden_bias": "bias_representation",
    "accuracy_gap": "factual_accuracy",
    "licensing_trap": "licensing_ip",
}

# ── Score caps by (category, severity) ────────────────────────────────
_CATEGORY_CAPS: dict[str, dict[str, int]] = {
    "hidden_bias": {"high": 4, "medium": 6, "low": 8},
    "accuracy_gap": {"high": 3, "medium": 5, "low": 7},
    "licensing_trap": {"high": 2, "medium": 5, "low": 7},
}

# ── Verdict severity ordering (higher = more severe) ─────────────────
_VERDICT_RANK: dict[str, int] = {
    "approved": 0,
    "approved_with_caveats": 1,
    "flagged_for_teacher_review": 2,
    "not_recommended": 3,
}


def _derive_verdict(
    review: AdversarialReviewResult,
) -> AdversarialVerdict:
    """Compute final verdict from Agent 4's flags using deterministic rules.

    Rules (evaluated in order):
      1. Any safety flag with severity=high → flagged_for_teacher_review
      2. ≥ 2 high-severity flags (any category) → not_recommended
      3. Any single high-severity flag → flagged_for_teacher_review
      4. Any medium-severity flag → approved_with_caveats
      5. Otherwise → Agent 4's own verdict (fallback)
    """
    high_flags = [f for f in review.flags if f.severity == "high"]
    medium_flags = [f for f in review.flags if f.severity == "medium"]
    safety_high = any(
        f.category == "safety" and f.severity == "high" for f in review.flags
    )

    if safety_high:
        return "flagged_for_teacher_review"
    if len(high_flags) >= 2:
        return "not_recommended"
    if high_flags:
        return "flagged_for_teacher_review"
    if medium_flags:
        return "approved_with_caveats"

    return review.verdict


def reconcile(
    evaluation: EvaluationResult,
    review: AdversarialReviewResult,
) -> EvaluationResult:
    """Merge Agent 3 evaluation with Agent 4 adversarial review.

    Returns a new EvaluationResult with:
      - scores: Agent 3 scores, capped where Agent 4 flagged issues
      - overall_score: recalculated from adjusted scores
      - adversarial: populated with verdict, flags, score_adjustments,
        and review_summary
    """
    adjusted_scores: dict[str, DimensionScore] = dict(evaluation.scores)
    score_adjustments: dict[str, DimensionScore] = {}

    for flag in review.flags:
        dim = _CATEGORY_TO_DIMENSION.get(flag.category)
        if dim is None:
            # false_positive / safety → verdict override only
            continue
        if dim not in adjusted_scores:
            continue

        caps = _CATEGORY_CAPS.get(flag.category)
        if caps is None:
            continue
        cap = caps.get(flag.severity, 8)

        original = adjusted_scores[dim]
        if original.score > cap:
            capped = DimensionScore(
                score=cap,
                max=original.max,
                reason=(
                    f"Capped from {original.score}/10 — "
                    f"{flag.category} ({flag.severity}): {flag.explanation}"
                ),
            )
            adjusted_scores[dim] = capped
            score_adjustments[dim] = capped

            logger.info(
                "Score capped by adversarial flag",
                dimension=dim,
                original=original.score,
                capped_to=cap,
                flag_category=flag.category,
                flag_severity=flag.severity,
                url=evaluation.resource_url,
            )

    # Recalculate overall from adjusted dimension scores
    if adjusted_scores:
        overall = round(
            sum(s.score for s in adjusted_scores.values()) / len(adjusted_scores),
            1,
        )
    else:
        overall = evaluation.overall_score

    # Derive deterministic verdict
    verdict = _derive_verdict(review)

    reconciled_adversarial = AdversarialReviewResult.model_validate(
        {
            "verdict": verdict,
            "flags": [f.model_dump() for f in review.flags],
            "score_adjustments": {
                k: v.model_dump() for k, v in score_adjustments.items()
            },
            "review_summary": review.review_summary,
        }
    )

    return evaluation.model_copy(
        update={
            "scores": adjusted_scores,
            "overall_score": overall,
            "adversarial": reconciled_adversarial,
        }
    )
