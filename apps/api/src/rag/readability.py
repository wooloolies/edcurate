"""Programmatic readability analysis — Flesch-Kincaid + Coleman-Liau."""

import textstat

_MIN_TEXT_LENGTH = 100


def compute_readability(text: str) -> dict[str, float] | None:
    """Compute readability metrics for a text.

    Returns None when the text is too short for reliable measurement.
    """
    if not text or len(text) < _MIN_TEXT_LENGTH:
        return None
    return {
        "flesch_kincaid_grade": round(textstat.flesch_kincaid_grade(text), 1),
        "coleman_liau_index": round(textstat.coleman_liau_index(text), 1),
    }
