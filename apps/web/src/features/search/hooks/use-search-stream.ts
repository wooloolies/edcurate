"use client";

/**
 * SSE endpoint /api/discovery/search/stream is exempt from Orval codegen
 * because it returns text/event-stream, not JSON. The final `complete` event
 * payload is typed using the Orval-generated JudgedSearchResponse.
 *
 * Stream state is stored in a Jotai atom so it persists across route
 * navigations (e.g. search → presets → back to search).
 */

import { useLatest, useMemoizedFn } from "ahooks";
import { useAtom } from "jotai";
import { useRef } from "react";

import type {
  ResourceAgentProgress,
  SearchStageEvent,
  SearchStreamState,
  Stage,
  StageStatus,
} from "@/features/search/types/search-stream";
import { fetchSSE } from "@/features/search/utils/fetch-sse";
import { parseSSEBuffer } from "@/features/search/utils/parse-sse";
import type { JudgedSearchResponse } from "@/lib/api/model/judged-search-response";
import type { JudgmentResult } from "@/lib/api/model/judgment-result";
import type { ResourceCard } from "@/lib/api/model/resource-card";
import { INITIAL_STREAM_STATE, searchStreamAtom } from "@/stores/search-stream-atoms";

// ---------------------------------------------------------------------------
// Reducer logic (pure function, used by the hook to update the atom)
// ---------------------------------------------------------------------------

type Action =
  | { type: "START" }
  | { type: "STAGE_EVENT"; payload: SearchStageEvent }
  | { type: "ERROR"; payload: string }
  | { type: "RESET" };

function reduce(state: SearchStreamState, action: Action): SearchStreamState {
  switch (action.type) {
    case "START":
      return {
        ...INITIAL_STREAM_STATE,
        resourceProgress: new Map(),
        partialJudgments: new Map(),
        evaluationIds: new Map(),
        isStreaming: true,
      };

    case "STAGE_EVENT": {
      const { stage, status, resource_url, cached, data } = action.payload;

      const nextStages: Partial<Record<Stage, StageStatus>> = {
        ...state.stages,
        [stage]: status,
      };

      const nextResourceProgress = new Map(state.resourceProgress);
      if (resource_url && (stage === "evaluation" || stage === "adversarial")) {
        const existing: ResourceAgentProgress = nextResourceProgress.get(resource_url) ?? {
          evaluationStatus: null,
          adversarialStatus: null,
        };
        nextResourceProgress.set(resource_url, {
          ...existing,
          ...(stage === "evaluation" ? { evaluationStatus: status } : {}),
          ...(stage === "adversarial" ? { adversarialStatus: status } : {}),
        });
      }

      const isComplete = stage === "complete" && status === "done";
      const result: JudgedSearchResponse | null = isComplete
        ? ((data as unknown as JudgedSearchResponse) ?? state.result)
        : state.result;

      // 1) federated_search/done → set partialResults
      let nextPartialResults = state.partialResults;
      if (stage === "federated_search" && status === "done" && data && "results" in data) {
        nextPartialResults = data.results as ResourceCard[];
      }

      // 2) evaluation/done with judgment → accumulate partialJudgments + evaluationIds
      const nextPartialJudgments = new Map(state.partialJudgments);
      const nextEvaluationIds = new Map(state.evaluationIds);
      if (
        stage === "evaluation" &&
        status === "done" &&
        resource_url &&
        data &&
        "judgment" in data
      ) {
        nextPartialJudgments.set(resource_url, data.judgment as JudgmentResult);
        if ("evaluation_id" in data && typeof data.evaluation_id === "string") {
          nextEvaluationIds.set(resource_url, data.evaluation_id);
        }
      }

      // 3) complete event may carry evaluation_ids map (cache hits + fresh results)
      if (isComplete && data && "evaluation_ids" in data) {
        const ids = data.evaluation_ids as Record<string, string>;
        for (const [url, id] of Object.entries(ids)) {
          nextEvaluationIds.set(url, id);
        }
      }

      return {
        ...state,
        stages: nextStages,
        activeStage: stage,
        resourceProgress: nextResourceProgress,
        result,
        partialResults: nextPartialResults,
        partialJudgments: nextPartialJudgments,
        evaluationIds: nextEvaluationIds,
        isCached: cached === true ? true : state.isCached,
        isStreaming: !isComplete,
      };
    }

    case "ERROR":
      return { ...state, isStreaming: false, error: action.payload };

    case "RESET":
      return { ...INITIAL_STREAM_STATE, resourceProgress: new Map(), partialJudgments: new Map() };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Module-level abort controller — survives component unmount
// ---------------------------------------------------------------------------

let activeAbort: AbortController | null = null;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSearchStreamReturn extends SearchStreamState {
  startStream: () => Promise<void>;
  stopStream: () => void;
}

export function useSearchStream(
  presetId: string | null,
  query: string | null
): UseSearchStreamReturn {
  const [state, setState] = useAtom(searchStreamAtom);
  const latestPresetId = useLatest(presetId);
  const latestQuery = useLatest(query);
  // Keep a local ref to setState to avoid stale closures in the stream loop
  const setStateRef = useRef(setState);
  setStateRef.current = setState;

  const dispatch = useMemoizedFn((action: Action) => {
    setStateRef.current((prev) => reduce(prev, action));
  });

  const startStream = useMemoizedFn(async () => {
    const pid = latestPresetId.current;
    const q = latestQuery.current;
    if (!pid || !q) return;

    // Abort any in-flight stream before starting a new one
    activeAbort?.abort();
    const controller = new AbortController();
    activeAbort = controller;

    dispatch({ type: "START" });

    try {
      const response = await fetchSSE(
        "/api/discovery/search/stream",
        { preset_id: pid, query: q },
        controller.signal
      );

      if (!response.ok) {
        throw new Error(`SSE request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("SSE response body is null");
      }

      const reader = response.body.getReader();
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

  const stopStream = useMemoizedFn(() => {
    activeAbort?.abort();
    activeAbort = null;
    dispatch({ type: "RESET" });
  });

  return { ...state, startStream, stopStream };
}
