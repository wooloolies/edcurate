# Progressive Search Results — Design Document

> **Status**: Approved
> **Date**: 2026-04-08
> **Goal**: Show search results incrementally as each pipeline stage completes, instead of waiting for the full `complete` event.

---

## Problem

Current flow blocks all result rendering until the entire pipeline (query generation + federated search + RAG + evaluation) finishes (~30-60 seconds). Users see only a ClassroomScene animation during this time. The SSE infrastructure already streams per-stage events, but the frontend ignores intermediate data.

## Approach: True Per-Resource Streaming (Option B)

- After `federated_search/done`: show all ResourceCards without verdicts
- As each resource evaluation completes: update that card's verdict individually
- ClassroomScene collapses into a compact progress bar when cards appear

### User-Facing Flow

```
Search button click
  -> ClassroomScene animation (~3-5s)
  -> Scene disappears -> 15 cards appear (no verdicts, top-4 show "Evaluating..." pulse)
  -> CompactProgressBar: "Evaluating resources... [0/4]"
  -> 1st card verdict pops in (e.g. "use_it") -> [1/4]
  -> 2nd card verdict pops in -> [2/4]
  -> ... 4th complete
  -> CompactProgressBar fades out
  -> Final sorted results (complete event)
```

---

## Backend Changes

**File**: `apps/api/src/discovery/service.py`

### 1. `federated_search/done` — Include ResourceCards

Currently sends `data={"counts": counts_by_source}` only (line 714-718).

Change to:

```python
yield SearchStageEvent(
    stage="federated_search",
    status="done",
    data={
        "counts": counts_by_source,
        "results": [card.model_dump() for card in all_results],
    },
)
```

Note: `federated_search/done` is emitted AFTER `rag_preparation/working` and relevance sorting (line 714), so `all_results` is already sorted and available at this point. Payload ~10-20KB for 15 cards — acceptable for SSE.

### 2. Extract Shared RAG Context

Separate the shared setup (steps 1-4 of `_run_rag_pipeline`) from per-resource evaluation (step 5).

```python
@dataclass
class _RagContext:
    eval_vector: list[float]
    adv_vector: list[float]
    readability_map: dict[str, dict[str, float]]
    search_id: str
    preset: ClassroomPreset
```

New function `_prepare_rag_context(cards, preset, query, search_id, eval_vector)` encapsulates:
- Weaviate collection setup
- Content fetching (parallel)
- Chunking + embedding + upserting
- Query vector embedding

`_process_one(card, ctx: _RagContext)` becomes a standalone async function (currently a closure inside `_run_rag_pipeline`).

### 3. Per-Resource Streaming with `asyncio.wait(FIRST_COMPLETED)`

Replace `_run_rag_pipeline` call in `search_resources_stream` with inline logic:

```python
# Shared RAG setup
ctx = await _prepare_rag_context(top_cards, preset, query, search_id, eval_vector)

# Emit working events
for card in top_cards:
    yield SearchStageEvent(stage="evaluation", status="working", resource_url=card.url)
    yield SearchStageEvent(stage="adversarial", status="working", resource_url=card.url)

# Per-resource evaluation with FIRST_COMPLETED
pending: set[asyncio.Task] = set()
task_to_card: dict[asyncio.Task, ResourceCard] = {}
for card in top_cards:
    task = asyncio.create_task(_process_one(card, ctx))
    pending.add(task)
    task_to_card[task] = card

judgments: list[JudgmentResult] = []
while pending:
    done, pending = await asyncio.wait(
        pending, return_when=asyncio.FIRST_COMPLETED, timeout=180.0
    )
    if not done:  # timeout
        for t in pending:
            t.cancel()
        break
    for task in done:
        card = task_to_card[task]
        try:
            result = task.result()
            if isinstance(result, JudgmentResult):
                judgments.append(result)
                card.verdict = result.verdict
                card.relevance_score = _VERDICT_SCORE.get(result.verdict, 0.5)
                card.relevance_reason = result.reasoning_chain
                yield SearchStageEvent(
                    stage="evaluation", status="done",
                    resource_url=card.url,
                    data={"judgment": result.model_dump()},
                )
                yield SearchStageEvent(
                    stage="adversarial", status="done",
                    resource_url=card.url,
                )
        except Exception as e:
            logger.warning("Resource processing failed", url=card.url, error=str(e))
```

**Why `asyncio.wait` over `asyncio.as_completed`**: `as_completed` returns futures that cannot be mapped back to original tasks. `wait(FIRST_COMPLETED)` returns actual Task objects, enabling `task_to_card` reverse lookup.

### 4. REST Endpoint Unchanged

`search_resources()` continues using `_run_rag_pipeline` as-is. Only the stream path is refactored.

### 5. `complete` Event Unchanged

After all per-resource evaluations, the `complete` event still assembles and sends the full `JudgedSearchResponse` with final sorting. This ensures backwards compatibility and cache storage.

---

## Frontend Changes

### 1. State Extension (`types/search-stream.ts`)

```typescript
export interface SearchStreamState {
  // ... existing fields ...

  /** Set on federated_search/done — cards before evaluation */
  partialResults: ResourceCard[] | null;
  /** Accumulated per-resource judgments during streaming */
  partialJudgments: Map<string, JudgmentResult>;
}
```

### 2. Atom Update (`stores/search-stream-atoms.ts`)

```typescript
export const INITIAL_STREAM_STATE: SearchStreamState = {
  // ... existing fields ...
  partialResults: null,
  partialJudgments: new Map(),
};
```

`START` and `RESET` actions must create fresh Maps (consistent with existing `resourceProgress` pattern).

### 3. Reducer Extension (`hooks/use-search-stream.ts`)

In `STAGE_EVENT` case:

```typescript
// federated_search/done -> set partialResults
let nextPartialResults = state.partialResults;
if (stage === "federated_search" && status === "done" && data?.results) {
  nextPartialResults = data.results as ResourceCard[];
}

// evaluation/done + judgment data -> accumulate partialJudgments
const nextPartialJudgments = new Map(state.partialJudgments);
if (stage === "evaluation" && status === "done" && resource_url && data?.judgment) {
  nextPartialJudgments.set(resource_url, data.judgment as JudgmentResult);
}
```

### 4. Unified Data Source (`search-page-client.tsx`)

No Phase 2 / Phase 3 split. Single data source that transitions smoothly:

```typescript
const displayResults = results?.results ?? stream.partialResults;
const displayJudgments: Map<string, JudgmentResult> = results
  ? judgmentByUrl          // complete: full judgments
  : stream.partialJudgments; // streaming: incremental

const isEvaluationPhase = stream.isStreaming && !!stream.partialResults;
const showResults = !!displayResults && (!stream.isStreaming || isEvaluationPhase);
```

Category sidebar counts derived from `displayResults`:

```typescript
const displayCounts = useMemo(() => {
  if (results) return results.counts_by_source;
  const c: Record<string, number> = { ddgs: 0, youtube: 0, openalex: 0 };
  for (const card of stream.partialResults ?? []) c[card.source]++;
  return c;
}, [results, stream.partialResults]);
```

### 5. ClassroomScene Transition

```
stream.isStreaming && !stream.partialResults  -> ClassroomScene (full)
stream.isStreaming && stream.partialResults   -> CompactProgressBar + results grid
!stream.isStreaming && displayResults         -> results grid only
```

No animation library needed. Cards appearing is sufficient visual transition. ClassroomScene unmounts immediately when `partialResults` arrives.

### 6. CompactProgressBar (new component)

**File**: `src/features/search/components/compact-progress-bar.tsx`

Displays evaluation progress with real data:

```
[Bear icon] Evaluating resources...  [2/4 complete]
[=============================.............]  50%
```

- Progress: `partialJudgments.size / 4`
- Smooth CSS `transition` on width
- Fade out on `complete`

### 7. VerdictBadge — Three States

Add `isEvaluating?: boolean` prop to `VerdictBadge` in `relevance-indicator.tsx`:

| State | Condition | Display |
|:------|:----------|:--------|
| Evaluating | `resourceProgress.has(url) && !partialJudgments.has(url)` | Blue pulse badge "Evaluating..." |
| Verdict | `partialJudgments.has(url)` or `resource.verdict` | use_it / adapt_it / skip_it badge with scale-in animation |
| Unevaluated | Neither | Static gray "Unevaluated" badge |

Verdict pop-in: `animate-[scale-in_0.3s_ease-out]` on mount via Tailwind.

### 8. Results Grid Extraction

Extract the inline results grid (current lines 312-419 of `search-page-client.tsx`) into `<SearchResultsGrid>`:

```typescript
interface SearchResultsGridProps {
  results: ResourceCard[];
  judgments: Map<string, JudgmentResult>;
  resourceProgress: Map<string, ResourceAgentProgress>;
  isEvaluationPhase: boolean;
  presetId?: string;
  searchQuery?: string;
  // ... category, pagination, bookmark props
}
```

Shared by both streaming and complete rendering paths.

### 9. Bookmark/Save During Phase 2

`selectedResources` state works on `displayResults` (which includes `partialResults`). Users can select and save resources before evaluation completes. `evaluation_data_list` in save payload uses `displayJudgments.get(url) ?? null` — naturally handles partial judgments.

---

## Cache Hit Path

Cache hit -> `complete/done/cached=true` -> `partialResults` stays `null` -> `result` set immediately -> renders via `displayResults = results.results`. No progressive loading. Identical to current behavior.

---

## Edge Cases

| Case | Behavior |
|:-----|:---------|
| All providers fail | `complete/done` with empty results + errors. No `partialResults` emitted. |
| RAG pipeline timeout | Per-resource `evaluation/done` events for completed ones. Remaining cards stay "Evaluating..." until `complete`. |
| Single resource evaluation fails | No `evaluation/done` for that URL. Card shows "Evaluating..." then falls back to "Unevaluated" on `complete`. |
| SSE connection drops mid-stream | Existing REST fallback kicks in (`useFallback` flag). |
| Same query re-search | `START` action resets `partialResults` and `partialJudgments`. Fresh stream. |

---

## Files to Change

### Backend
| File | Change |
|:-----|:-------|
| `apps/api/src/discovery/service.py` | Add `results` to `federated_search/done` data; extract `_RagContext` + `_prepare_rag_context`; `asyncio.wait(FIRST_COMPLETED)` loop; `judgment` data in `evaluation/done` |

### Frontend
| File | Change |
|:-----|:-------|
| `src/features/search/types/search-stream.ts` | Add `partialResults`, `partialJudgments` to `SearchStreamState` |
| `src/stores/search-stream-atoms.ts` | Extend `INITIAL_STREAM_STATE` |
| `src/features/search/hooks/use-search-stream.ts` | Parse `federated_search/done` and `evaluation/done` data in reducer |
| `src/features/search/components/search-page-client.tsx` | Unified `displayResults`/`displayJudgments`; ClassroomScene conditional; extract grid |
| `src/features/search/components/compact-progress-bar.tsx` | **New** — real-time evaluation progress bar |
| `src/features/search/components/resource-card/relevance-indicator.tsx` | `VerdictBadge` `isEvaluating` prop + pulse state |
| `src/features/search/components/search-results-grid.tsx` | **New** — extracted results grid shared by streaming/complete paths |

### i18n
| Key | Value (en) |
|:----|:-----------|
| `search.evaluation.evaluating` | "Evaluating..." |
| `search.progress.compactTitle` | "Evaluating resources..." |
| `search.progress.compactCount` | "{count}/{total} complete" |
