# LLM-as-Judge System — Critical Review & Improvement Plan

**Date:** 2026-04-07
**Scope:** Agent 3 (Deep Evaluation), Agent 4 (Adversarial Review), Reconciler, RAG retrieval pipeline
**Goal:** Identify gaps, improve evaluation quality, strengthen hackathon positioning

---

## Architecture Summary

The current system uses a dual-agent pattern:

1. **Agent 3** — 7-dimension scorer (curriculum alignment, pedagogical quality, reading level, bias & representation, factual accuracy, source credibility, licensing & IP)
2. **Agent 4** — Independent risk scanner across 5 categories (false_positive, hidden_bias, accuracy_gap, safety, licensing_trap)
3. **Deterministic Reconciler** — Merges Agent 3 scores with Agent 4 flags via score capping and verdict derivation

Both agents run in parallel (blind), powered by Gemini 2.5 Flash, with RAG-retrieved chunks as evidence. The reconciler applies deterministic rules — no additional LLM call.

**Verdict:** The architecture is solid. The gaps are in prompt engineering depth, grounding, and reconciler logic.

---

## Issues & Improvements

### 1. Agent 3 Prompt Lacks Rubric Calibration

**File:** `apps/api/src/agents/evaluation/evaluation_agent.py:7-44`

**Problem:** The prompt says "score 1-10" but gives zero guidance on what each score level means. The LLM invents its own scale each invocation, defaulting to generous scoring (most resources land 6-9).

**Impact:** Score inflation. Teachers learn to distrust scores that never go below 5.

**Fix — add anchor examples per dimension:**

```
Score 1-3: Poor — e.g. a generic Wikipedia stub loosely related to the topic
Score 4-5: Below average — covers the right topic but wrong year level, depth, or framework
Score 6-7: Adequate — relevant content but gaps in alignment, engagement, or accuracy
Score 8-9: Strong — directly addresses targeted outcomes with quality pedagogy
Score 10: Exceptional — perfectly aligned, engaging, well-sourced, and classroom-ready
```

Add calibration instruction: "Use the full 1-10 range. A generic article on the right topic should score ~4-5 on curriculum_alignment, not 7."

**Effort:** Low | **Impact:** High

---

### 2. No Curriculum Document Grounding

**File:** `apps/api/src/discovery/service.py:74-85` (`_build_eval_query`)

**Problem:** The PRD (Section 4.3, line 390) specifies that Agent 3 should "retrieve chunks most similar to targeted syllabus outcomes." The actual implementation passes only preset metadata (subject, year level, country) — no syllabus outcomes, no content descriptors, no achievement standards.

**Impact:** `curriculum_alignment` — the most important dimension for teachers — is scored on vibes. A resource about "coastal erosion" scores high for Geography just because the topic matches, even if it targets the wrong year level or wrong outcomes.

**Fix (incremental):**

1. **Quick:** Add an optional `target_outcomes` field to `ClassroomPreset` (e.g., "GE5-2, GE5-4"). Inject into Agent 3 prompt as `TARGETED SYLLABUS OUTCOMES: ...`
2. **Better:** Build a lightweight curriculum lookup (JSON mapping: framework + subject + year → outcomes list). Auto-populate from preset fields.
3. **Best:** Embed curriculum documents in Weaviate and retrieve relevant outcomes alongside resource chunks.

**Effort:** Medium | **Impact:** High — this is the hackathon differentiator ("we check against your real syllabus outcomes")

---

### 3. Overall Score Uses Unweighted Average

**Files:** `evaluation_agent.py:76-79`, `reconciler.py:120-124`

**Problem:** `overall_score = mean(all 7 dimensions)`. But curriculum alignment matters far more to a teacher than licensing. Equal weighting produces misleading rankings.

**Fix:**

```python
_DIMENSION_WEIGHTS = {
    "curriculum_alignment": 2.0,
    "pedagogical_quality": 1.5,
    "reading_level": 1.0,
    "bias_representation": 1.0,
    "factual_accuracy": 1.5,
    "source_credibility": 1.0,
    "licensing_ip": 0.5,
}

weighted_sum = sum(scores[d].score * _DIMENSION_WEIGHTS[d] for d in DIMENSIONS)
total_weight = sum(_DIMENSION_WEIGHTS.values())
overall = round(weighted_sum / total_weight, 1)
```

**Stretch:** Let teachers set custom weights in their preset ("I care most about reading level for my EAL/D class"). This directly addresses the hackathon problem of context-aware evaluation.

**Effort:** Low | **Impact:** High

---

### 4. `false_positive` Flags Have Zero Score Impact

**File:** `apps/api/src/agents/evaluation/reconciler.py:22-28`

**Problem:** `_CATEGORY_TO_DIMENSION` maps only 3 of 5 flag categories to dimensions. `false_positive` and `safety` are handled via "verdict override only" — meaning a resource flagged `false_positive: high` ("content appears educational but is misleading or mismatched to curriculum") keeps its Agent 3 scores completely untouched.

This is the single most critical flag category and it has zero score impact.

**Fix:**

```python
_CATEGORY_TO_DIMENSION: dict[str, str] = {
    "hidden_bias": "bias_representation",
    "accuracy_gap": "factual_accuracy",
    "licensing_trap": "licensing_ip",
    "false_positive": "curriculum_alignment",  # ADD
}

_CATEGORY_CAPS: dict[str, dict[str, int]] = {
    "hidden_bias": {"high": 4, "medium": 6, "low": 8},
    "accuracy_gap": {"high": 3, "medium": 5, "low": 7},
    "licensing_trap": {"high": 2, "medium": 5, "low": 7},
    "false_positive": {"high": 3, "medium": 5, "low": 7},  # ADD
}
```

Also consider: `safety: high` should cap `overall_score` directly (e.g., cap to 5.0) regardless of dimension scores.

**Effort:** Low | **Impact:** Medium

---

### 5. Verdict Derivation Logic Issue

**File:** `reconciler.py:38-65`

**Problem:** The severity hierarchy is inconsistent:

- 1x `safety: high` → `flagged_for_teacher_review`
- 2x `accuracy_gap: high` → `not_recommended`

A resource with dangerous safety content gets a less severe verdict than one with two accuracy issues. Safety-high should be at least as severe as two highs in any other category.

**Fix:** Reorder the rules:

```python
def _derive_verdict(review):
    high_flags = [f for f in review.flags if f.severity == "high"]
    medium_flags = [f for f in review.flags if f.severity == "medium"]
    safety_high = any(f.category == "safety" and f.severity == "high" for f in review.flags)

    if len(high_flags) >= 2:
        return "not_recommended"        # Most severe first
    if safety_high:
        return "flagged_for_teacher_review"  # Then safety
    if high_flags:
        return "flagged_for_teacher_review"
    if medium_flags:
        return "approved_with_caveats"
    return review.verdict
```

**Effort:** Low | **Impact:** Medium

---

### 6. Reading Level Is Pure LLM Guessing

**Problem:** The PRD specifies Flesch-Kincaid readability analysis. The implementation asks the LLM to score `reading_level` from chunks. LLMs don't count syllables or sentence lengths — they guess.

**Impact:** Reading level accuracy is a key credibility signal, especially with EAL/D students in the preset.

**Fix:**

```python
import textstat  # pip install textstat

def compute_readability(text: str) -> dict:
    return {
        "flesch_kincaid_grade": textstat.flesch_kincaid_grade(text),
        "coleman_liau_index": textstat.coleman_liau_index(text),
        "automated_readability_index": textstat.automated_readability_index(text),
    }
```

Inject into Agent 3 prompt:

```
COMPUTED READABILITY (automated):
- Flesch-Kincaid grade level: {fk_grade}
- Target year level: {year_level}
- EAL/D students in class: {eal_d_count}

Use these metrics to inform your reading_level score. A grade level 2+ years
above the target year should score ≤5. Consider EAL/D students who may need
content 1-2 years below the nominal year level.
```

**Effort:** Low (~10 lines) | **Impact:** Medium — credibility + EAL/D story

---

### 7. `licensing_ip` Cannot Be Scored from Body Content

**Problem:** Licensing information lives in footers, `<meta>` tags, and `/terms` pages. The RAG pipeline strips boilerplate (per PRD design), which is exactly where licensing info lives. This dimension will consistently score 5 ("no info") or hallucinate.

**Fix:**

- During content fetch (`rag/fetcher.py`), extract `<meta>` tags (especially `<meta name="license">`, `<link rel="license">`, `<meta property="dc.rights">`), footer text containing "Creative Commons" / "CC BY" / "All rights reserved", and `robots.txt` / `terms` page snippets.
- Pass as a separate field to Agent 3: `LICENSE METADATA: ...`
- When no license info is found, instruct Agent 3: "No explicit license metadata found. Score conservatively (≤5) and note the absence."

**Effort:** Medium | **Impact:** Medium

---

### 8. No Teacher Feedback on Evaluations

**Problem:** The PRD describes Agent 6 learning from teacher behavior. The implementation stores evaluations as frozen JSONB with no mechanism for teachers to say "this score is wrong" or "this flag is irrelevant."

**Impact:** Missed hackathon opportunity. "Teachers can correct the AI" is a compelling narrative for judges.

**Quick win:**

- Add thumbs-up/thumbs-down per dimension score and per adversarial flag
- Store feedback in a `evaluation_feedback` table (user_id, resource_url, dimension, feedback_type, comment)
- Even without using feedback for retraining, surface it in the demo: "23 teachers agreed, 2 disagreed on reading level"
- Future: use aggregated feedback to calibrate Agent 3 prompts or adjust dimension weights

**Effort:** Medium | **Impact:** High for demo

---

### 9. Chunk Truncation Silently Hides Problems

**Files:** `evaluation_agent.py:63` (8,000 char cap), `adversarial_retrieval.py:8-9` (3,500 char per bucket)

**Problem:** If problematic content is in the truncated portion, it's invisible to the judge. This is especially bad for Agent 4, whose job is to catch hidden issues.

**Fix:**

- Log when truncation occurs and include it in the evaluation: `"analysis_coverage": "67% of content analyzed"`
- Surface to teachers: "Note: this evaluation is based on partial content (first 8,000 characters)"
- Increase adversarial bucket caps from 3,500 to 5,000 chars (Gemini 2.5 Flash handles 1M tokens)

**Effort:** Low | **Impact:** Low (edge case, but builds trust)

---

### 10. Agent 4 Framing Detection Is English/Western-Centric

**File:** `adversarial_retrieval.py:26-39`

**Problem:** `_FRAMING_SUBSTRINGS` contains only English colonial framing patterns ("was settled", "discovered america", "manifest destiny"). The system supports teaching in multiple languages and countries (the preset has `teaching_language` and `country` fields), but the bias detection is hardcoded for English-language content about Anglo-colonial history.

**Impact:** A resource in Vietnamese or Thai with biased framing will never get flagged. Even English resources about non-Western topics (e.g., Japanese history, African geography) won't trigger framing detection.

**Fix:**

- Make framing patterns configurable by country/region
- Add patterns for other common biases: gender stereotyping, disability framing, religious bias, socioeconomic assumptions
- For non-English content, rely more heavily on the LLM's framing analysis (Agent 4 prompt) and less on regex heuristics

**Effort:** Medium | **Impact:** Medium (important for international positioning)

---

## Priority Matrix

| # | Fix | Effort | Impact | Priority |
|---|-----|--------|--------|----------|
| 1 | Rubric anchor examples in Agent 3 prompt | Low | High | P0 |
| 3 | Weighted overall score | Low | High | P0 |
| 6 | Programmatic readability score injection | Low | Medium | P0 |
| 4 | `false_positive` score capping in reconciler | Low | Medium | P1 |
| 5 | Verdict derivation logic fix | Low | Medium | P1 |
| 2 | Curriculum outcomes in evaluation prompt | Medium | High | P1 |
| 8 | Teacher feedback on evaluations | Medium | High | P1 |
| 7 | License metadata extraction | Medium | Medium | P2 |
| 9 | Truncation awareness / coverage metric | Low | Low | P2 |
| 10 | Internationalize framing detection | Medium | Medium | P2 |

---

## What's Already Good

- **Dual-agent + deterministic reconciler** — no LLM-in-the-loop for score merging. Reproducible, debuggable, fast.
- **Parallel blind execution** — better latency than chained calls, avoids Agent 4 anchoring to Agent 3 output.
- **Structured JSON output with validation** — Pydantic schemas, enum enforcement, graceful fallbacks for malformed LLM output.
- **Score capping over score replacement** — preserves Agent 3's reasoning while bounding inflated scores.
- **Adversarial chunk bucketing** — separating claim-focused vs framing-focused retrieval is a smart design for targeted risk detection.
- **Graceful degradation** — Agent 4 failure doesn't block results; evaluation failure returns results without scores.
