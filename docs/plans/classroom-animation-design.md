# Classroom Animation Design — Search Agent Visualization

## Overview

검색 실행 시 교실 씬 애니메이션으로 에이전트 파이프라인 진행 상태를 시각화합니다.
쿼카 선생님이 분필을 들고 각 에이전트 학생(동물 캐릭터)을 지시하며 이동하는 풀 스테이지 연출입니다.

## Architecture & Data Flow

```
[사용자 검색 실행]
       │
       ▼
[SearchPageClient] ──── GET /api/discovery/search/stream (SSE)
       │
       ▼
[useSearchStream hook] ── fetch + ReadableStream
       │
       │  이벤트 수신:
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
[ClassroomScene] ── stage 상태에 따라 애니메이션 제어
       ├─ QuokkaTeacher: 현재 활성 학생 쪽으로 이동
       ├─ StudentAgent × 4: idle → working → done 상태 전환
       └─ Chalkboard: 현재 단계 텍스트 표시
```

## File Structure

```
apps/web/src/features/search/
├── components/
│   ├── classroom/
│   │   ├── classroom-scene.tsx       # 메인 씬 컨테이너
│   │   ├── chalkboard.tsx            # 칠판 배경 + 상태 텍스트
│   │   ├── quokka-teacher.tsx        # 쿼카 선생님 (이동 애니메이션)
│   │   ├── student-agent.tsx         # 학생 캐릭터 (공통 래퍼)
│   │   └── characters/
│   │       ├── quokka.tsx            # 쿼카 SVG
│   │       ├── owl.tsx               # 부엉이 SVG (Search Query Agent)
│   │       ├── fox.tsx               # 여우 SVG (Federated Search)
│   │       ├── bear.tsx              # 곰 SVG (Evaluation Agent)
│   │       └── rabbit.tsx            # 토끼 SVG (Adversarial Agent)
│   └── search-page-client.tsx        # 수정: SSE 모드 추가
├── hooks/
│   └── use-search-stream.ts          # SSE 연결 + 상태 관리 훅
├── types/
│   └── search-stream.ts              # SSE 관련 타입 정의
└── utils/
    ├── fetch-sse.ts                  # fetch 기반 SSE 헬퍼
    └── parse-sse.ts                  # SSE 버퍼 파서

apps/api/src/discovery/
├── router.py                         # 수정: SSE 엔드포인트 추가
├── service.py                        # 수정: async generator 리팩터링
└── schemas.py                        # 수정: SSE 이벤트 스키마 추가
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
