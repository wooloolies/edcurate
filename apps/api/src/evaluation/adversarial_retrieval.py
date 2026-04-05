"""Hybrid query + heuristic bucketing for Agent 4 adversarial retrieval."""

import re

from src.presets.model import ClassroomPreset

ADV_RETRIEVAL_LIMIT = 14
_CLAIM_MAX_CHARS = 3500
_FRAMING_MAX_CHARS = 3500

_CLAIM_RES = [
    re.compile(r"\b\d{4}\b"),
    re.compile(r"\d+\s*%"),
    re.compile(
        r"\d[\d,\.]*\s*(million|billion|thousand|trillion|km\b|km²|m\b|°C|°F|percent)\b",
        re.I,
    ),
    re.compile(
        r"\b(study|studies|research|survey|meta-analysis|according to|found that)\b",
        re.I,
    ),
    re.compile(r"\b\d[\d,\.]*\b"),
]

_FRAMING_SUBSTRINGS = (
    "was settled",
    "were settled",
    "land was",
    "discovered america",
    "discovered the",
    "primitive ",
    "tribal people",
    "slave trade",
    " slaves ",
    "colonial power",
    "manifest destiny",
    "given to them",
    "granted them",
)

_PASSIVE_HINT = re.compile(
    r"\b(was|were|is|are)\s+(built|taken|given|discovered|colonized|settled)\b",
    re.I,
)


def build_adversarial_hybrid_query_text(preset: ClassroomPreset, query: str) -> str:
    """
    Single embedding string for near_vector: dual intent (claims + framing).
    Scoped by search session preset + query, not per-URL
    (same vector for all resources in the batch).
    """
    interests = ", ".join(preset.student_interests or [])
    return (
        "Find educational resource passages that contain: "
        "(1) verifiable factual claims, statistics, dates, study citations, "
        "and causal assertions; "
        "(2) potentially biased, exclusionary, or culturally sensitive framing "
        "(e.g. passive voice around colonisation, stereotyping, "
        "outdated terminology).\n\n"
        f"Subject: {preset.subject}\n"
        f"Year Level: {preset.year_level}\n"
        f"Curriculum: {preset.curriculum_framework or 'Not specified'}\n"
        f"Topic: {preset.topic or 'Not specified'}\n"
        f"Country: {preset.country}\n"
        f"Teaching Language: {preset.teaching_language}\n"
        f"Student Interests: {interests or 'Not specified'}\n"
        f"Search Query: {query}"
    )


def _claim_score(text: str) -> float:
    if not text.strip():
        return 0.0
    s = 0.0
    for rx in _CLAIM_RES:
        s += len(rx.findall(text)) * 1.0
    return s


def _framing_score(text: str) -> float:
    if not text.strip():
        return 0.0
    low = text.lower()
    s = 0.0
    for frag in _FRAMING_SUBSTRINGS:
        s += low.count(frag) * 2.0
    s += len(_PASSIVE_HINT.findall(text)) * 1.5
    return s


def _chunk_key(row: dict[str, object | None]) -> int:
    raw = row.get("chunk_index", 0)
    return int(raw) if isinstance(raw, int) else 0


def _append_until_cap(
    parts: list[str],
    ordered_rows: list[dict[str, object | None]],
    max_chars: int,
) -> None:
    total = sum(len(p) for p in parts)
    for row in ordered_rows:
        t = str(row.get("chunk_text", "")).strip()
        if not t:
            continue
        heading = row.get("heading")
        head = f"[{heading}]\n" if heading else ""
        block = f"{head}{t}"
        if total + len(block) > max_chars:
            remain = max_chars - total
            if remain > 80:
                parts.append(block[:remain] + "…")
            break
        parts.append(block)
        total += len(block)


def bucket_chunks_for_adversarial(
    chunks: list[dict[str, object | None]],
    snippet_fallback: str,
) -> tuple[str, str]:
    """
    Rerank retrieved chunks into claim-focused vs framing-focused text blocks.
    """
    if not chunks:
        fb = snippet_fallback.strip() or "(No passage retrieved; use snippet only.)"
        both = f"[FALLBACK — limited evidence]\n{fb}"
        return both, both

    scored: list[tuple[dict[str, object | None], float, float]] = []
    for row in chunks:
        text = str(row.get("chunk_text", ""))
        scored.append((row, _claim_score(text), _framing_score(text)))

    by_claim = sorted(scored, key=lambda x: x[1], reverse=True)
    by_framing = sorted(scored, key=lambda x: x[2], reverse=True)

    claim_parts: list[str] = []
    framing_parts: list[str] = []
    _append_until_cap(claim_parts, [r for r, _, _ in by_claim], _CLAIM_MAX_CHARS)
    _append_until_cap(framing_parts, [r for r, _, _ in by_framing], _FRAMING_MAX_CHARS)

    sep = "\n\n---\n\n"
    claim_text = sep.join(claim_parts) if claim_parts else snippet_fallback
    framing_text = sep.join(framing_parts) if framing_parts else snippet_fallback
    return claim_text, framing_text
