# Classroom Animation Design — Search Agent Visualization

## Overview

Visualizes the agent pipeline progress with a classroom scene animation during search execution.
A quokka teacher holding chalk walks between animal student characters, directing each agent in a full-stage production.

## Architecture & Data Flow

```
[User initiates search]
       │
       ▼
[SearchPageClient] ──── GET /api/discovery/search/stream (SSE)
       │
       ▼
[useSearchStream hook] ── fetch + ReadableStream
       │
       │  Events received:
       │  ├─ { stage: "query_generation", status: "working" }
       │  ├─ { stage: "query_generation", status: "done", data: queries }
       │  ├─ { stage: "federated_search", status: "working" }
       │  ├─ { stage: "federated_search", status: "done", data: { counts } }
       │  ├─ { stage: "rag_preparation", status: "working" }
       │  ├─ { stage: "rag_preparation", status: "done" }
       │  ├─ { stage: "evaluation", status: "working", resource_url: "..." }
       │  ├─ { stage: "adversarial", status: "working", resource_url: "..." }
       │  ├─ { stage: "evaluation", status: "done", resource_url: "..." }
       │  ├─ { stage: "adversarial", status: "done", resource_url: "..." }
       │  └─ { stage: "complete", data: EvaluatedSearchResponse }
       │
       ▼
[ClassroomScene] ── Controls animation based on stage state
       ├─ QuokkaTeacher: Moves toward the currently active student
       ├─ StudentAgent × 4: idle → working → done state transitions
       └─ Chalkboard: Displays current stage text
```

## File Structure

```
apps/web/src/features/search/
├── components/
│   ├── classroom/
│   │   ├── classroom-scene.tsx       # Main scene container
│   │   ├── chalkboard.tsx            # Chalkboard background + stage text
│   │   ├── quokka-teacher.tsx        # Quokka teacher (movement animation)
│   │   ├── student-agent.tsx         # Student character (shared wrapper)
│   │   └── characters/
│   │       ├── quokka.tsx            # Quokka SVG
│   │       ├── owl.tsx               # Owl SVG (Search Query Agent)
│   │       ├── fox.tsx               # Fox SVG (Federated Search)
│   │       ├── bear.tsx              # Bear SVG (Evaluation Agent)
│   │       └── rabbit.tsx            # Rabbit SVG (Adversarial Agent)
│   └── search-page-client.tsx        # Modified: SSE mode added
├── hooks/
│   └── use-search-stream.ts          # SSE connection + state management hook
├── types/
│   └── search-stream.ts              # SSE-related type definitions
└── utils/
    ├── fetch-sse.ts                  # fetch-based SSE helper
    └── parse-sse.ts                  # SSE buffer parser

apps/api/src/discovery/
├── router.py                         # Modified: SSE endpoint added
├── service.py                        # Modified: async generator refactoring
└── schemas.py                        # Modified: SSE event schema added
```

## Dependencies

- **Frontend**: `motion` (animation library)
- **Backend**: `sse-starlette` (SSE response)

## Backend: SSE Endpoint

### New Endpoint

`GET /api/discovery/search/stream`

### SSE Event Schema

```python
class SearchStageEvent(BaseModel):
    stage: Literal[
        "query_generation",
        "federated_search",
        "rag_preparation",
        "evaluation",
        "adversarial",
        "complete",
    ]
    status: Literal["working", "done"]
    resource_url: str | None = None
    cached: bool = False
    data: dict | None = None
```

### Service Refactoring

`search_resources()` remains for backward compatibility. New `search_resources_stream()` wraps the same logic as an `AsyncGenerator[SearchStageEvent, None]`.

Key stages:
1. **query_generation** — SearchQueryAgent generates provider-tailored queries
2. **federated_search** — DuckDuckGo / YouTube / OpenAlex parallel search
3. **rag_preparation** — Fetch → Chunk → Embed → Weaviate (NEW stage, not in original design)
4. **evaluation** — Per-resource, 7-dimension scoring (resource_url tracked)
5. **adversarial** — Per-resource, risk/bias review (resource_url tracked, parallel with evaluation)
6. **complete** — Final EvaluatedSearchResponse

Cache hit: single `{ stage: "complete", cached: true, data: ... }` event.

### Router

```python
@router.get("/search/stream")
@rate_limit(requests=20, window=60, key_func=_user_rate_limit_key)
async def search_stream(...) -> EventSourceResponse:
    # Same auth/preset validation as GET /search
    async def event_generator():
        async for event in service.search_resources_stream(preset, query):
            yield {"event": "stage", "data": event.model_dump_json()}
    return EventSourceResponse(event_generator())
```

Authentication: Works with `Authorization: Bearer` header because frontend uses `fetch()` (not browser `EventSource` API).

## Frontend: SSE Hook

### Key Design Decisions

- **No `useRequest`** — manual `fetch` + `ReadableStream` for full control
- **ahooks utilities**: `useMemoizedFn` (stable fn refs), `useLatest` (stale closure prevention), `useUnmount` (cleanup)
- **`useReducer`** for complex state (not Jotai — single component scope)
- **API contract exception**: SSE endpoint is not Orval-codegen'd; final response uses Orval-generated `EvaluatedSearchResponse` type
- **REST fallback**: On SSE failure, auto-switches to existing `useSearchApiDiscoverySearchGet`

### Hook Implementation

```typescript
// hooks/use-search-stream.ts
import { useLatest, useMemoizedFn, useUnmount } from "ahooks";
import { useReducer, useRef } from "react";

export function useSearchStream(presetId: string | null, query: string | null) {
  const [state, dispatch] = useReducer(streamReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const latestPresetId = useLatest(presetId);
  const latestQuery = useLatest(query);

  const startStream = useMemoizedFn(async () => {
    const pid = latestPresetId.current;
    const q = latestQuery.current;
    if (!pid || !q) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "START" });

    try {
      const response = await fetchSSE(
        "/api/discovery/search/stream",
        { preset_id: pid, query: q },
        controller.signal,
      );
      if (!response.ok) throw new Error(`SSE failed: ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { parsed, remainder } = parseSSEBuffer(buffer);
        buffer = remainder;
        for (const event of parsed) {
          dispatch({ type: "STAGE_EVENT", payload: event });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        dispatch({ type: "ERROR", payload: error.message });
      }
    }
  });

  const stopStream = useMemoizedFn(() => abortRef.current?.abort());
  useUnmount(() => abortRef.current?.abort());

  return { ...state, startStream, stopStream };
}
```

### SearchPageClient Integration

```typescript
const stream = useSearchStream(presetId, searchQuery);

// SSE failure → REST fallback
const useFallback = stream.error !== null;
const { data: fallbackResults, isFetching } = useSearchApiDiscoverySearchGet(
  { preset_id: presetId!, query: searchQuery! },
  { query: { enabled: searchEnabled && useFallback, staleTime: 3 * 60 * 1000 } },
);
const results = stream.result ?? fallbackResults;

// Loading UI
{stream.isStreaming ? (
  <ClassroomScene stages={stream.stages} activeStage={stream.activeStage}
    resourceProgress={stream.resourceProgress} isCached={stream.isCached} />
) : isFetching ? (
  <EvaluationProgress />
) : null}
```

## Animation: Classroom Scene

### Layout (Front View, viewBox 600×400)

```
┌─────────────────────────────────────────────┐
│              ┌───────────────┐              │
│              │   Chalkboard  │              │  y: 0~120
│              └───────────────┘              │
│                  🐹 ←→                      │  y: 140~200  Quokka teacher
│          🦉            🦊                   │  y: 240~320  Row 1
│      Query Agent   Fed.Search               │
│          🐻            🐰                   │  y: 340~400  Row 2
│      Evaluation    Adversarial              │
└─────────────────────────────────────────────┘
```

### Agent ↔ Character Mapping

| Agent | Animal | Position | Prop |
|---|---|---|---|
| Search Query Agent | Owl | Top-left | Magnifying glass |
| Federated Search | Fox | Top-right | Laptop |
| Evaluation Agent | Bear | Bottom-left | Checklist |
| Adversarial Agent | Rabbit | Bottom-right | Red pen |

### Quokka Teacher Movement

```typescript
const TEACHER_POSITIONS: Record<Stage, { x: number; y: number }> = {
  query_generation:  { x: 150, y: 180 },
  federated_search:  { x: 400, y: 180 },
  rag_preparation:   { x: 275, y: 140 },
  evaluation:        { x: 150, y: 300 },
  adversarial:       { x: 400, y: 300 },
  complete:          { x: 275, y: 140 },
};
```

- Movement: `motion` `animate={{ x, y }}` with `spring` transition
- Direction: `scaleX: -1/1` flip based on movement direction
- Chalk writing: chalk SVG rotation when at chalkboard (`rag_preparation`)

### Student State Animations

| State | Visual |
|---|---|
| `idle` | Sitting at desk, subtle idle wobble |
| `working` | Prop usage animation + speech bubble + bounce |
| `done` | Hand raise + green checkmark |

### Cache Hit Animation

When `isCached === true`: Quokka shows "Already ready!" speech bubble → all students simultaneously `done` → 1s delay → show results.

### Responsive

Container: `max-w-[600px]`, internal coordinates via SVG `viewBox="0 0 600 400"` — ratio preserved at any width.

### SVG Assets

All characters are code-based SVG placeholders, designed for easy replacement with designer assets later. Each character is a standalone component in `characters/`.

## Animation Library

`motion` (formerly framer-motion):
- Declarative React API
- Spring physics for natural movement
- `animate` prop for position/scale/opacity transitions
- Layout animations for state changes
