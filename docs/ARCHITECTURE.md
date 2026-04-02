# System Architecture

## Production Infrastructure

```mermaid
graph TB
    subgraph Vercel
        WEB[Next.js 16<br/>edcurate-2026]
        API[FastAPI<br/>edcurate-2026-api]
    end

    subgraph Supabase
        PG[(PostgreSQL)]
    end

    subgraph Upstash
        REDIS[(Redis)]
    end

    USER([User]) -->|Browser| WEB
    WEB -->|better-auth<br/>JWT/JWE| WEB
    WEB -->|Authorization: Bearer| API
    API -->|asyncpg + SSL| PG
    API -->|rediss:// TLS| REDIS
    API -->|Alembic migrate<br/>on build| PG

    style WEB fill:#0070f3,color:#fff
    style API fill:#009688,color:#fff
    style PG fill:#3ecf8e,color:#fff
    style REDIS fill:#dc382c,color:#fff
```

**Auth flow:** better-auth (Web) → localStorage JWT/JWE → `Authorization: Bearer` header → FastAPI validates JWE

---

## Pipeline Overview

```
Input -> Search -> RAG -> Verification -> Proposal & Recommendation
```

## 1. Input

Collect student information while observing PII rules. Curriculum data can be provided directly or generated from available information.

- Student profile (age, level, background, learning goals)
- Curriculum / subject context
- PII anonymisation at ingestion

## 2. Search Engine

Retrieve relevant educational resources from external sources.

- Brave Search API
- DuckDuckGo API
- YouTube Data API

## 3. RAG (Retrieval-Augmented Generation)

Process and index retrieved content for context-aware generation.

- Chunking
- Indexing
- Embedding

## 4. Verification using Agents

Ensure content accuracy and safety through multi-agent review.

- **Adversarial Agent** — challenges factual claims, detects hallucinations
- **Referencing Agent** — cross-checks against authoritative curriculum sources

## 5. Proposal & Recommendation

Generate tailored educational content and resource recommendations.

- Resources suited to different learner levels
- Culturally and contextually appropriate materials
- Adapted to diverse backgrounds and learning goals
