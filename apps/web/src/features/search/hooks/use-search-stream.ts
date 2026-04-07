"use client";

/**
 * SSE endpoint /api/discovery/search/stream is exempt from Orval codegen
 * because it returns text/event-stream, not JSON. The final `complete` event
 * payload is typed using the Orval-generated EvaluatedSearchResponse.
 */

import { useLatest, useMemoizedFn, useUnmount } from "ahooks";
import { useReducer, useRef } from "react";
import type {
  ResourceAgentProgress,
  SearchStageEvent,
  SearchStreamState,
  Stage,
  StageStatus,
} from "@/features/search/types/search-stream";
import { fetchSSE } from "@/features/search/utils/fetch-sse";
import { parseSSEBuffer } from "@/features/search/utils/parse-sse";
import type { EvaluatedSearchResponse } from "@/lib/api/model/evaluated-search-response";

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: "START" }
  | { type: "STAGE_EVENT"; payload: SearchStageEvent }
  | { type: "ERROR"; payload: string }
  | { type: "RESET" };

const initialState: SearchStreamState = {
  stages: {},
  activeStage: null,
  resourceProgress: new Map(),
  result: null,
  isCached: false,
  isStreaming: false,
  error: null,
};

function streamReducer(state: SearchStreamState, action: Action): SearchStreamState {
  switch (action.type) {
    case "START": {
      return {
        ...initialState,
        // Carry over a fresh Map so React sees a new reference
        resourceProgress: new Map(),
        isStreaming: true,
      };
    }

    case "STAGE_EVENT": {
      const event = action.payload;
      const { stage, status, resource_url, cached, data } = event;

      const nextStages: Partial<Record<Stage, StageStatus>> = {
        ...state.stages,
        [stage]: status,
      };

      // Per-resource progress tracking for evaluation/adversarial
      const nextResourceProgress = new Map(state.resourceProgress);
      if (resource_url && (stage === "evaluation" || stage === "adversarial")) {
        const existing: ResourceAgentProgress = nextResourceProgress.get(resource_url) ?? {
          evaluationStatus: null,
          adversarialStatus: null,
        };
        const updated: ResourceAgentProgress = {
          ...existing,
          ...(stage === "evaluation" ? { evaluationStatus: status } : {}),
          ...(stage === "adversarial" ? { adversarialStatus: status } : {}),
        };
        nextResourceProgress.set(resource_url, updated);
      }

      // On complete stage, extract result
      const isComplete = stage === "complete" && status === "done";
      const result: EvaluatedSearchResponse | null = isComplete
        ? ((data as unknown as EvaluatedSearchResponse) ?? state.result)
        : state.result;

      return {
        ...state,
        stages: nextStages,
        activeStage: stage,
        resourceProgress: nextResourceProgress,
        result,
        isCached: cached === true ? true : state.isCached,
        isStreaming: !isComplete,
      };
    }

    case "ERROR": {
      return {
        ...state,
        isStreaming: false,
        error: action.payload,
      };
    }

    case "RESET": {
      return { ...initialState, resourceProgress: new Map() };
    }

    default:
      return state;
  }
}

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
  const [state, dispatch] = useReducer(streamReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  // useLatest prevents stale closures without adding deps to useMemoizedFn
  const latestPresetId = useLatest(presetId);
  const latestQuery = useLatest(query);

  const startStream = useMemoizedFn(async () => {
    const pid = latestPresetId.current;
    const q = latestQuery.current;
    if (!pid || !q) return;

    // Abort any in-flight stream before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
    abortRef.current?.abort();
  });

  useUnmount(() => {
    abortRef.current?.abort();
  });

  return {
    ...state,
    startStream,
    stopStream,
  };
}
