# Federated Search & Classroom Presets — Design Document

**Status:** Approved
**Date:** 2026-04-04
**Scope:** Teacher classroom context presets + federated search across DuckDuckGo, YouTube, OpenAlex

---

## 1. Problem

After login, teachers need to input their classroom context (curriculum, subject, grade, location, student interests, learning level, language, country, etc.) and search for educational resources across multiple sources. Results must be returned as a unified list. Search conditions should be saveable as reusable presets.

## 2. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Teacher input scope | Full profile form (all PRD fields) | Hackathon demo with pre-filled data (Ms. Chen scenario) |
| Orchestration | API-only synchronous (`asyncio.gather`) | Simplest; 3-8s latency acceptable with loading animation |
| Result format | Normalized `ResourceCard[]` | No scoring/ranking algorithm in scope |
| Query strategy | Per-source query templates (Federated Search) | Industry standard; no LLM needed |
| Persistence | DB-persisted presets | Presets saved, revisitable from dedicated menu |
| Source weighting | Configurable per preset | Controls result proportion in final list |
| Architecture | Domain-driven modules (Approach B) | Follows existing `AIProvider`/`StorageProvider` patterns |

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                  │
│                                                      │
│  /dashboard/presets     /dashboard/search             │
│  ┌──────────────┐      ┌──────────────────────────┐  │
│  │ Preset CRUD  │──────│ Select preset + Query bar│  │
│  │ + Source     │      │ → ResourceCard[] results  │  │
│  │   Weights    │      └──────────────────────────┘  │
│  └──────────────┘                                    │
└──────────────────┬───────────────────────────────────┘
                   │  Orval-generated hooks
                   ▼
┌─────────────────────────────────────────────────────┐
│  API (FastAPI)                                       │
│                                                      │
│  /api/presets/*           /api/discovery/search       │
│  ┌──────────────┐        ┌──────────────────────┐    │
│  │ presets/     │        │ discovery/            │    │
│  │  router      │        │  router               │    │
│  │  service     │        │  service (orchestrator)│   │
│  │  model       │        │  providers/           │    │
│  │  schemas     │        │   ├ base.py           │    │
│  └──────┬───────┘        │   ├ ddgs.py           │    │
│         │                │   ├ youtube.py        │    │
│         ▼                │   └ openalex.py       │    │
│    PostgreSQL            └──────────┬────────────┘    │
│    (presets)                        │                 │
│                          asyncio.gather               │
│                          ┌─────┬────┴─────┐          │
│                          ▼     ▼          ▼          │
│                        DDGS  YouTube   OpenAlex      │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. Teacher creates a preset (profile + source weights) → saved to PostgreSQL
2. Teacher selects a preset, types a search query
3. `POST /api/discovery/search` receives `{ preset_id, query }`
4. Discovery service loads the preset, builds per-source queries via query templates
5. `asyncio.gather` calls all three providers in parallel
6. Each provider returns `list[ResourceCard]`
7. Service merges results, applies source weights (result proportion), deduplicates by URL
8. Returns unified `ResourceCard[]` to frontend

### Source Weighting

- Each preset stores weights: `{ ddgs: 0.34, youtube: 0.33, openalex: 0.33 }` (sum = 1.0)
- Weights control result proportion — e.g., 15 results: ~5 DDGS, ~5 YouTube, ~5 OpenAlex at equal weights
- Default: equal distribution

### Federated Query Templates

| Source | Text Query | Native Filters |
|---|---|---|
| DDGS | `"{topic} {subject} {grade} resources"` | `region` (e.g., `au-en`), `safesearch=strict` |
| YouTube | `"{topic} {subject} lesson"` | `regionCode`, `relevanceLanguage`, `type=video`, `safeSearch=strict` |
| OpenAlex | `"{topic}"` | `filter=concepts.display_name:{subject}`, structured field search |

---

## 4. Database Schema

```sql
CREATE TABLE classroom_presets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name            VARCHAR(255) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT false,

    curriculum_framework VARCHAR(255),
    subject         VARCHAR(255) NOT NULL,
    year_level      VARCHAR(50) NOT NULL,
    topic           VARCHAR(500),

    country         VARCHAR(100) NOT NULL,
    state_region    VARCHAR(100),
    city            VARCHAR(100),

    teaching_language VARCHAR(10) NOT NULL DEFAULT 'en',

    class_size              INTEGER,
    eal_d_students          INTEGER,
    reading_support_students INTEGER,
    extension_students      INTEGER,
    student_interests       JSONB DEFAULT '[]',
    language_backgrounds    JSONB DEFAULT '[]',
    average_reading_level   VARCHAR(50),

    source_weights  JSONB NOT NULL DEFAULT '{"ddgs": 0.34, "youtube": 0.33, "openalex": 0.33}',

    additional_notes TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_classroom_presets_class_size
        CHECK (class_size IS NULL OR class_size > 0),
    CONSTRAINT ck_classroom_presets_eal_d
        CHECK (eal_d_students IS NULL OR eal_d_students >= 0),
    CONSTRAINT ck_classroom_presets_reading_support
        CHECK (reading_support_students IS NULL OR reading_support_students >= 0),
    CONSTRAINT ck_classroom_presets_extension
        CHECK (extension_students IS NULL OR extension_students >= 0),
    CONSTRAINT ck_classroom_presets_source_weights_range
        CHECK (
            (source_weights->>'ddgs')::numeric BETWEEN 0 AND 1 AND
            (source_weights->>'youtube')::numeric BETWEEN 0 AND 1 AND
            (source_weights->>'openalex')::numeric BETWEEN 0 AND 1
        ),
    CONSTRAINT ck_classroom_presets_source_weights_sum
        CHECK (
            ABS(
                COALESCE((source_weights->>'ddgs')::numeric, 0) +
                COALESCE((source_weights->>'youtube')::numeric, 0) +
                COALESCE((source_weights->>'openalex')::numeric, 0) - 1.0
            ) <= 0.01
        )
);

CREATE INDEX ix_classroom_presets_user_id ON classroom_presets(user_id);
CREATE UNIQUE INDEX uq_classroom_presets_user_default
    ON classroom_presets(user_id) WHERE is_default = true;
```

### Schema Notes

- Single table, 3NF satisfied — no normalization needed at this scale
- JSONB for `student_interests`, `language_backgrounds`, `source_weights` — variable-length, no relational queries needed
- Partial unique index ensures one default preset per user
- Timestamps inline (not via mixin) — matches `User` model pattern
- CHECK constraints enforce data integrity at DB level

---

## 5. API Contract

### 5.1 Presets API — `/api/presets`

```
POST   /api/presets              — Create preset
GET    /api/presets              — List (paginated: limit, offset, sort_by, sort_order)
GET    /api/presets/{id}         — Get single preset
PUT    /api/presets/{id}         — Full update
DELETE /api/presets/{id}         — Delete (409 Conflict if default)
PATCH  /api/presets/{id}/default — Set as default (atomic swap)
```

- List uses existing `PaginatedResponse[T]` model from `src/common/models/pagination.py`
- All endpoints scoped to authenticated user (ownership check)
- Delete default preset returns `409 Conflict` — must set another as default first

### 5.2 Discovery API — `/api/discovery/search`

```
POST /api/discovery/search — Federated search (rate-limited: 20 req/min per user)
```

**Request:**
```json
{
  "preset_id": "uuid",
  "query": "coastal erosion interactive activities"
}
```

- `query`: `Field(min_length=1, max_length=500)`
- `preset_id` must belong to the authenticated user (404 if not)

**Response:**
```json
{
  "query": "coastal erosion interactive activities",
  "preset_id": "uuid",
  "total_results": 15,
  "counts_by_source": { "ddgs": 8, "youtube": 4, "openalex": 3 },
  "results": [
    {
      "title": "Coastal Erosion - Interactive Simulation",
      "url": "https://example.com/coastal-sim",
      "source": "ddgs",
      "type": "webpage",
      "snippet": "Explore coastal erosion processes through an interactive...",
      "thumbnail_url": null,
      "metadata": {
        "domain": "example.com",
        "published_date": "2024-03-15",
        "language": "en"
      }
    }
  ],
  "errors": []
}
```

### 5.3 ResourceCard Metadata — Discriminated Union

```python
class DdgsMetadata(BaseModel):
    domain: str
    published_date: str | None = None
    language: str | None = None

class YoutubeMetadata(BaseModel):
    channel: str
    duration: str                    # ISO 8601 (PT12M30S)
    view_count: int | None = None
    published_date: str | None = None

class OpenAlexMetadata(BaseModel):
    authors: list[str]
    journal: str | None = None
    citation_count: int | None = None
    doi: str | None = None
    published_date: str | None = None
```

### 5.4 Error Handling

| Case | Status |
|---|---|
| Preset not found / not owned | 404 |
| Source weights don't sum to 1.0 | 422 |
| Query empty or too long | 422 |
| Delete default preset | 409 Conflict |
| 1-2 sources fail | 200 + `errors[]` |
| All sources fail | 502 Bad Gateway |

### 5.5 Source Label Map

| Key | Display Name |
|---|---|
| `ddgs` | DuckDuckGo |
| `youtube` | YouTube |
| `openalex` | OpenAlex |

Documented in OpenAPI spec description for frontend rendering.

---

## 6. Backend Module Structure

```
apps/api/src/
├── presets/                         # Classroom context presets
│   ├── model.py                     # ClassroomPreset (SQLAlchemy)
│   ├── router.py                    # CRUD /api/presets
│   ├── service.py                   # Preset business logic
│   └── schemas.py                   # Pydantic request/response models
├── discovery/                       # Federated search engine
│   ├── router.py                    # POST /api/discovery/search
│   ├── service.py                   # Orchestrator (asyncio.gather)
│   ├── schemas.py                   # ResourceCard, SearchRequest/Response
│   └── providers/                   # Per-source query builders + clients
│       ├── base.py                  # Abstract SearchProvider interface
│       ├── ddgs.py                  # DuckDuckGo provider
│       ├── youtube.py               # YouTube Data API provider
│       └── openalex.py              # OpenAlex provider
```

### SearchProvider Interface

```python
class SearchProvider(ABC):
    @abstractmethod
    async def search(
        self, query: str, context: ClassroomPreset, limit: int
    ) -> list[ResourceCard]:
        ...
```

Each provider:
1. Builds a source-specific query from `query` + `context` fields
2. Calls the external API
3. Normalizes results into `ResourceCard` schema

---

## 7. Frontend Structure

### 7.1 Pages

```
src/app/[locale]/dashboard/
├── presets/
│   ├── page.tsx                     # Server Component → PresetListClient
│   ├── loading.tsx                  # Route-level Suspense skeleton
│   ├── new/
│   │   └── page.tsx                 # Server Component → PresetFormClient
│   └── [id]/
│       └── edit/
│           └── page.tsx             # Server Component → PresetFormClient
└── search/
    ├── page.tsx                     # Server Component → SearchPageClient
    └── loading.tsx                  # Route-level Suspense skeleton
```

### 7.2 Feature Components (FSD-lite)

```
src/features/
├── presets/
│   ├── components/
│   │   ├── preset-list-client.tsx        # "use client" — useGetPresets()
│   │   ├── preset-card.tsx               # Card with actions
│   │   ├── preset-form-client.tsx        # "use client" — TanStack Form
│   │   ├── tag-input.tsx                 # Badge + Input composition
│   │   ├── weight-sliders.tsx            # Linked Slider + Label + Input
│   │   └── skeleton/
│   │       ├── preset-card-skeleton.tsx
│   │       └── preset-form-skeleton.tsx
│   └── utils/
│       └── normalize-weights.ts          # Auto-normalize to 100% (>90% test coverage)
├── search/
│   ├── components/
│   │   ├── search-page-client.tsx        # "use client" — nuqs, mutation
│   │   ├── preset-selector.tsx           # Select bound to ?preset_id=
│   │   ├── search-bar.tsx                # Input + Button
│   │   ├── source-tabs.tsx              # Tabs with counts_by_source
│   │   ├── resource-card/
│   │   │   ├── index.tsx                 # Discriminated union renderer
│   │   │   ├── ddgs-card.tsx             # Server-compatible
│   │   │   ├── youtube-card.tsx          # Server-compatible (next/image)
│   │   │   └── open-alex-card.tsx        # Server-compatible
│   │   ├── error-banner.tsx              # role="alert"
│   │   └── skeleton/
│   │       ├── resource-card-skeleton.tsx
│   │       └── source-tabs-skeleton.tsx
│   └── utils/
```

### 7.3 Required Shadcn Installs

```bash
npx shadcn add select tabs slider badge skeleton dropdown-menu separator toast alert dialog
```

### 7.4 Accessibility Requirements

- Weight sliders: `aria-label` + `aria-live="polite"` on percentage readout
- Tag input: `role="list"` + `role="listitem"` + `aria-label="Remove {tag}"` on remove buttons
- Form sections: `<fieldset>` + `<legend>`
- Source tabs: shadcn `Tabs` (Radix keyboard nav)
- YouTube thumbnails: `alt` text + `next/image`
- Error banner: `role="alert"`
- Overflow menu: shadcn `DropdownMenu` — touch target >= 44x44px

### 7.5 Mobile Responsiveness

- Preset grid: `grid-cols-1` (320px) → `grid-cols-2` (768px) → `grid-cols-3` (1024px+)
- Weight sliders: stack vertically on mobile
- Source tabs: `overflow-x-auto scrollbar-none` at narrow viewports
- Preset form: `max-w-2xl mx-auto px-4`

### 7.6 i18n

New translation namespaces in `packages/i18n/src/`:
- `presets__*` — list, form labels, validation messages, empty states
- `search__*` — search bar placeholder, source tabs, result counts, error messages
- `common__*` additions — "Set Default", "Edit", "New Preset"

Use `next-intl` `useFormatter` for number formatting (citation counts).

---

## 8. Out of Scope

- Scoring/ranking algorithm
- LLM-based query diversification
- RAG pipeline / vector embeddings
- Adversarial review (Agent 4)
- Localisation suggestions (Agent 5)
- Search history persistence
- Resource caching
