# RAG Pipeline & Deep Evaluation Agent — Design Document

**Status:** Approved
**Date:** 2026-04-05
**Scope:** Full RAG pipeline (fetch → parse → chunk → embed → Weaviate) + Gemini-powered 7-dimension Deep Evaluation Agent (Agent 3 from PRD)
**Approach:** Inline Pipeline (Approach A) — single `POST /api/discovery/search` endpoint

---

## 1. Problem

The existing federated search returns ~15 raw results without quality evaluation. Teachers still need to manually assess curriculum alignment, reading level, bias, and credibility. The PRD defines a 7-dimension Deep Evaluation Agent (Agent 3) that scores resources using RAG retrieval. This design implements that agent.

## 2. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| LLM provider | Vertex AI Gemini via `google-genai` SDK | `GOOGLE_CLOUD_PROJECT=edcurate`, existing `GEMINI_API_KEY` |
| Embedding model | Gemini `text-embedding-004` | Same SDK, no extra API keys |
| Vector DB | Weaviate (already configured in `.env`) | `WEAVIATE_URL=http://localhost:8080` |
| Content extraction | trafilatura | Best-in-class HTML boilerplate removal |
| Chunking | Semantic, 300-500 tokens, 50-token overlap | PRD spec |
| Evaluation scope (POC) | Top 4 results overall | Validate concept before scaling |
| Curriculum KB | Teacher preset context fields | No separate document store needed for POC |
| API shape | Single endpoint, inline pipeline | Hackathon simplicity, ~15-20s response |

## 3. Architecture

```
Teacher submits search
         │
         ▼
┌──────────────────────────────────┐
│  Existing Federated Search       │
│  (DDG + YouTube + OpenAlex)      │
│  Returns ~15 ResourceCard[]      │
└──────────────┬───────────────────┘
               │ Take top 4
               ▼
┌──────────────────────────────────┐
│  RAG Pipeline (new module)       │
│                                  │
│  1. Content Fetcher              │
│     HTML → trafilatura           │
│     YouTube → captions/metadata  │
│     Papers → abstract text       │
│                                  │
│  2. Chunker                      │
│     300-500 token semantic chunks│
│     50-token overlap             │
│                                  │
│  3. Embedder (Gemini)            │
│     text-embedding-004           │
│     Embed chunks + eval query    │
│                                  │
│  4. Weaviate Upsert              │
│     Store chunks with metadata   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Evaluation Query Embedding      │
│                                  │
│  Combine: search_query +         │
│    subject + year_level +        │
│    topic + curriculum_framework +│
│    student_interests             │
│  → Embed with text-embedding-004 │
│  → Query Weaviate per resource   │
│  → Retrieve top-k chunks        │
└──────────────┬───────────────────┘
               │ Retrieved chunks per resource
               ▼
┌──────────────────────────────────┐
│  Deep Evaluation Agent (Gemini)  │
│                                  │
│  For each resource:              │
│    Prompt = preset context +     │
│      retrieved chunks +          │
│      7-dimension rubric          │
│    → Gemini returns JSON scores  │
│                                  │
│  7 Dimensions:                   │
│   1. Curriculum alignment        │
│   2. Pedagogical quality         │
│   3. Reading level               │
│   4. Bias & representation       │
│   5. Factual accuracy            │
│   6. Source credibility          │
│   7. Licensing & IP              │
└──────────────┬───────────────────┘
               │ Scored results
               ▼
         Re-ranked top 4
         returned to frontend
```

### New Module Structure

```
apps/api/src/
├── rag/                          # NEW — RAG pipeline
│   ├── __init__.py
│   ├── fetcher.py                # Content fetcher (httpx + trafilatura)
│   ├── chunker.py                # Semantic chunking (tiktoken-based)
│   ├── embedder.py               # Gemini text-embedding-004
│   └── weaviate_store.py         # Weaviate client (upsert + query)
├── evaluation/                   # NEW — Deep Evaluation Agent
│   ├── __init__.py
│   ├── agent.py                  # Gemini-powered 7-dim scorer
│   └── schemas.py                # EvaluationScore, DimensionScore
```

---

## 4. Weaviate Collection Schema

```python
# Collection: "ResourceChunk"
{
    "class": "ResourceChunk",
    "properties": [
        {"name": "resource_url",  "dataType": ["text"]},
        {"name": "chunk_text",    "dataType": ["text"]},
        {"name": "chunk_index",   "dataType": ["int"]},
        {"name": "heading",       "dataType": ["text"]},
        {"name": "source_type",   "dataType": ["text"]},
        {"name": "search_id",     "dataType": ["text"]},
    ],
}
```

---

## 5. Evaluation Schemas

```python
class DimensionScore(BaseModel):
    score: int           # 1-10
    max: int = 10
    reason: str          # natural language justification

class EvaluationResult(BaseModel):
    resource_url: str
    overall_score: float
    recommended_use: Literal["primary_resource", "supplementary", "reference_only"]
    scores: dict[str, DimensionScore]
    # keys: curriculum_alignment, pedagogical_quality, reading_level,
    #        bias_representation, factual_accuracy, source_credibility, licensing_ip

class EvaluatedSearchResponse(SearchResponse):
    """Extends existing SearchResponse with evaluation data."""
    evaluations: list[EvaluationResult]
```

---

## 6. Evaluation Query Construction

```python
eval_query_text = f"""
Subject: {preset.subject}
Year Level: {preset.year_level}
Curriculum: {preset.curriculum_framework}
Topic: {preset.topic}
Country: {preset.country}
Student Interests: {preset.student_interests}
Teaching Language: {preset.teaching_language}
Search Query: {query}
"""
```

This text is embedded with `text-embedding-004` and used to query Weaviate per resource, retrieving the most contextually relevant chunks for evaluation.

---

## 7. Gemini Evaluation Prompt

```
You are a Deep Evaluation Agent for educational resources.

TEACHER CONTEXT:
- Subject: {subject}, Year Level: {year_level}
- Curriculum: {curriculum_framework}
- Topic: {topic}
- Country: {country}, Language: {teaching_language}
- Student Interests: {student_interests}
- Class Size: {class_size}, EAL/D: {eal_d_students}

RESOURCE:
- Title: {title}
- URL: {url}
- Source: {source}

RETRIEVED CONTENT CHUNKS:
{chunks_text}

Score this resource on 7 dimensions (1-10 each).
Return ONLY valid JSON:
{
  "curriculum_alignment": {"score": N, "reason": "..."},
  "pedagogical_quality": {"score": N, "reason": "..."},
  "reading_level": {"score": N, "reason": "..."},
  "bias_representation": {"score": N, "reason": "..."},
  "factual_accuracy": {"score": N, "reason": "..."},
  "source_credibility": {"score": N, "reason": "..."},
  "licensing_ip": {"score": N, "reason": "..."},
  "overall_score": N.N,
  "recommended_use": "primary_resource|supplementary|reference_only"
}
```

---

## 8. Integration with Existing Code

### Updated `discovery/service.py` flow

```python
# Current:
#   federated search → merge → dedup → return SearchResponse

# New:
#   federated search → merge → dedup → take top 4
#   → RAG pipeline (fetch → chunk → embed → Weaviate)
#   → build evaluation query (query + preset context → embed)
#   → for each resource: retrieve chunks from Weaviate → Gemini 7-dim score
#   → return EvaluatedSearchResponse (all ~15 results + evaluations for top 4)
```

### Config changes (`src/lib/config.py`)

```python
# Already exists:
GEMINI_API_KEY: str | None = None
WEAVIATE_URL: str | None = None
WEAVIATE_API_KEY: str | None = None
GOOGLE_CLOUD_PROJECT: str | None = None
```

### `.env` addition

```
GOOGLE_CLOUD_PROJECT=edcurate
```

### Python dependencies to add

```
trafilatura          — HTML content extraction
google-genai         — Gemini API (LLM evaluation)
weaviate-client      — Weaviate Python v4 client
tiktoken             — Token counting for chunking
```

---

## 9. Error Handling

| Scenario | Handling |
|---|---|
| URL returns 404/403 | Skip resource, try 5th result as fallback |
| Content is JavaScript-heavy SPA | trafilatura falls back to basic HTML; if empty, skip |
| YouTube video has no captions | Use title + description + channel info only |
| Gemini returns malformed JSON | Retry once with stricter prompt; if still fails, `evaluation: null` |
| Weaviate connection fails | Return `EvaluatedSearchResponse` with empty `evaluations[]` |
| All 4 resources fail fetch | Return normal `SearchResponse` (no evaluations) |
| Content is non-English | trafilatura handles multi-lang; Gemini evaluates in context |
| Very long content (>50k tokens) | Truncate at chunking stage; cap at 20 chunks per resource |
| Duplicate chunks across resources | `search_id` scopes queries per search session |

---

## 10. Response Shape

The response returns ALL ~15 results in `results[]` but only the top 4 get entries in `evaluations[]`. This lets the frontend show all results with scores highlighted on the top 4.

---

## 11. Out of Scope (POC)

- Adversarial Review Agent (Agent 4)
- Localisation & Adaptation (Agent 5)
- Curriculum document pre-seeding
- Weaviate TTL/cleanup automation
- Streaming/SSE for progressive results
- Full content fetch for PDFs (text-only for POC)
