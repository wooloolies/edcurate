# Resource Discovery & Adaptation System Design

## 1. Overview and Intent

**Problem:** Teachers spend too much time finding, evaluating, and adapting resources for local contexts.
**Solution:** A Next.js + FastAPI platform acting as a unified "ContextBridge" for educators. It enables teachers to define a persistent Classroom Profile and run searches across a proprietary database, live web, or file uploads.
**Core Value:** Evaluates trust (safety, bias, IP) and automatically adapts the resource using a Multi-LLM "Adversarial" approach to match local curriculum and student needs.

## 2. Architecture Overview

**Frontend (Next.js 16 + Tailwind v4 + Jotai)**

- **Global Context Sidebar:** Jotai state managing the `ClassroomProfile` (e.g., Year 8, ACARA, ESL/Low Literacy).
- **Tabbed Workflows:**
  - `Library` (Proprietary Search querying PostgreSQL/pgvector).
  - `Web Explorer` (Live Web Search).
  - `Studio` (Bring-Your-Own-Resource PDF/URL parser).

**Production Infrastructure & Backend (FastAPI)**

- **Ingestion Routers:** Standardizes inputs from internal DB, live Web (via Brave Search, DuckDuckGo, **YouTube Data API**), or direct file drops into a standard `RawResource`. User uploads are stored in **Backblaze B2** (S3-compatible).
- **Cores & Storage:** **Supabase (PostgreSQL + pgvector)** for standard data/vectors, **Upstash (Redis)** for cache/queues, and optionally **Weaviate** for scalable vector search.
- **Auth Flow:** `better-auth` (Next.js) issues JWE -> authenticated `Authorization: Bearer` calls to FastAPI.
- **RAG & LLM Pipeline (`src/lib/ai/`)**: Follows a strict `Input -> Search -> RAG (Chunk/Index/Embed) -> Verification -> Proposal` flow.
  - `Localiser Agent`: Adapts the content against the `ClassroomProfile` (student info, learning goals) dynamically.
  - `Verification Agents`:
    - `Adversarial Agent (EdGuard)`: Challenges factual claims, detects hallucinations, and strictly monitors PII/safety.
    - `Referencing Agent`: Cross-checks adapted content against authoritative curriculum sources.

## 3. Key Interfaces & API Contracts

**A. Input: Classroom Profile**

```python
class ClassroomProfile(BaseModel):
    year_level: str
    curriculum: str
    special_needs: list[str]
    local_context: str
```

**B. Output: Unified Adapted Resource Contract**

```python
class EvaluationMetrics(BaseModel):
    is_safe: bool
    bias_detected: bool
    curriculum_alignment: int
    ip_status: str
    pii_redacted: bool

class AdaptedResourceResponse(BaseModel):
    original_source_url: str | None
    raw_content_preview: str
    adapted_content: str
    adaptation_notes: list[str]
    metrics: EvaluationMetrics
```

## 4. Integration Points with Existing Code

- **React UI**: Placed under `apps/web/src/app/(dashboard)/` using Server Components by default, bringing in React Query for data fetching.
- **Client Endpoints**: Strictly generated using `bun run gen:api` (Orval). Absolutely no manual fetch/axios calls in UI.
- **Backend Domain**: Placed in `apps/api/src/api/v1/resources/`. Logic contained gracefully via FastAPI Dependency Injections.
- **PII / Security**: A dedicated `pii_scrubber.py` to mask student info locally before any external LLM request is dispatched.

## 5. Edge Cases & Error Handling

- **High AI Latency:** WebSockets or SSE (Server-Sent Events) implemented on FastAPI and consumed by the Next.js frontend to stream adapted blocks progressively, paired with skeleton loaders.
- **Scraping Blocks:** Utilize dedicated crawler APIs (Brave Search API / DuckDuckGo API) directly instead of raw curl/beautifulsoup to mitigate scraping 403 errors and Cloudflare captchas safely.
- **Hallucination & PII Failure:** Deploys an "Adversarial Agent" (Red-teaming pattern) immediately after generation. If the adversarial agent catches hallucinations or PII loss, it flags the response `is_safe=False` and provides an original-source comparison toggle for the teacher to exercise professional agency.
