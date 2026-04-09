"use client";

/**
 * SSE endpoint /api/discovery/search/stream is exempt from Orval codegen
 * because it returns text/event-stream, not JSON. The final `complete` event
 * payload is typed using the Orval-generated JudgedSearchResponse.
 *
 * ## Two-phase architecture
 *
 * **Phase 1 (SSE stream):** query_generation → federated_search → rag_preparation → complete
 *   Returns search results + `search_id`. Chunks are stored in Weaviate.
 *
 * **Phase 2 (REST per-resource):** parallel GET /evaluate calls per top resource
 *   Each call runs Triage + Risk Scanner + Final Judge (~10-15 s).
 *   Results are merged into partialJudgments / evaluationIds as they arrive.
 *
 * Stream state is stored in a Jotai atom so it persists across route
 * navigations (e.g. search → presets → back to search).
 */

import { useLatest, useMemoizedFn } from "ahooks";
import { useAtom } from "jotai";
import { useRef } from "react";

import type {
  SearchStageEvent,
  SearchStreamState,
  Stage,
  StageStatus,
} from "@/features/search/types/search-stream";
import { fetchSSE } from "@/features/search/utils/fetch-sse";
import { parseSSEBuffer } from "@/features/search/utils/parse-sse";
import { useEvaluateResourceApiDiscoveryEvaluatePostHook } from "@/lib/api/discovery/discovery";
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
  | { type: "EVAL_START" }
  | { type: "EVAL_WORKING"; payload: { resource_url: string } }
  | {
      type: "EVAL_DONE";
      payload: {
        resource_url: string;
        judgment: JudgmentResult;
        evaluation_id: string | null;
      };
    }
  | { type: "EVAL_COMPLETE" }
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

      const isComplete = stage === "complete" && status === "done";
      const result: JudgedSearchResponse | null = isComplete
        ? ((data as unknown as JudgedSearchResponse) ?? state.result)
        : state.result;

      // federated_search/done → set partialResults
      let nextPartialResults = state.partialResults;
      if (stage === "federated_search" && status === "done" && data && "results" in data) {
        nextPartialResults = data.results as ResourceCard[];
      }

      // Extract search_id from complete event
      let nextSearchId = state.searchId;
      if (isComplete && data && "search_id" in data && typeof data.search_id === "string") {
        nextSearchId = data.search_id;
      }

      // Cache hit may carry evaluation_ids from previous runs
      const nextEvaluationIds = new Map(state.evaluationIds);
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
        result,
        partialResults: nextPartialResults,
        evaluationIds: nextEvaluationIds,
        searchId: nextSearchId,
        isCached: cached === true ? true : state.isCached,
        isStreaming: !isComplete,
      };
    }

    // --- Phase 2 actions ---------------------------------------------------

    case "EVAL_START":
      return {
        ...state,
        isEvaluating: true,
        stages: { ...state.stages, evaluation: "working" },
        activeStage: "evaluation",
      };

    case "EVAL_WORKING": {
      const nextRP = new Map(state.resourceProgress);
      nextRP.set(action.payload.resource_url, {
        evaluationStatus: "working",
        adversarialStatus: "working",
      });
      return { ...state, resourceProgress: nextRP };
    }

    case "EVAL_DONE": {
      const { resource_url, judgment, evaluation_id } = action.payload;
      const nextJudgments = new Map(state.partialJudgments);
      nextJudgments.set(resource_url, judgment);

      const nextIds = new Map(state.evaluationIds);
      if (evaluation_id) nextIds.set(resource_url, evaluation_id);

      const nextRP = new Map(state.resourceProgress);
      nextRP.set(resource_url, {
        evaluationStatus: "done",
        adversarialStatus: "done",
      });

      return {
        ...state,
        partialJudgments: nextJudgments,
        evaluationIds: nextIds,
        resourceProgress: nextRP,
      };
    }

    case "EVAL_COMPLETE":
      return {
        ...state,
        isEvaluating: false,
        stages: {
          ...state.stages,
          evaluation: "done",
          adversarial: "done",
        },
        activeStage: "complete",
      };

    case "ERROR":
      return { ...state, isStreaming: false, isEvaluating: false, error: action.payload };

    case "RESET":
      return {
        ...INITIAL_STREAM_STATE,
        resourceProgress: new Map(),
        partialJudgments: new Map(),
        evaluationIds: new Map(),
      };

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
  const evaluateResource = useEvaluateResourceApiDiscoveryEvaluatePostHook();
  // Keep a local ref to setState to avoid stale closures in the stream loop
  const setStateRef = useRef(setState);
  setStateRef.current = setState;

  const dispatch = useMemoizedFn((action: Action) => {
    setStateRef.current((prev) => reduce(prev, action));
  });

  // ------------------------------------------------------------------
  // Phase 2: evaluate top resources via REST (parallel)
  // ------------------------------------------------------------------
  const runEvaluations = useMemoizedFn(
    async (
      searchId: string,
      pid: string,
      q: string,
      resources: ResourceCard[],
      signal: AbortSignal
    ) => {
      dispatch({ type: "EVAL_START" });

      // Mark all resources as "working"
      for (const r of resources) {
        dispatch({ type: "EVAL_WORKING", payload: { resource_url: r.url } });
      }

      // Fire all evaluation requests in parallel via Orval-generated client
      const promises = resources.map(async (resource) => {
        try {
          const res = await evaluateResource(
            {
              search_id: searchId,
              preset_id: pid,
              resource_url: resource.url,
              resource_title: resource.title,
              resource_source: resource.source,
              resource_snippet: resource.snippet ?? "",
              query: q,
            },
            signal
          );
          const data = res as Record<string, unknown>;
          dispatch({
            type: "EVAL_DONE",
            payload: {
              resource_url: resource.url,
              judgment: data.judgment as unknown as JudgmentResult,
              evaluation_id: (data.evaluation_id as string) ?? null,
            },
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
          // Individual failure is non-fatal — resource just stays unevaluated
          console.warn(`Evaluation failed for ${resource.url}`, error);
        }
      });

      await Promise.allSettled(promises);

      if (!signal.aborted) {
        dispatch({ type: "EVAL_COMPLETE" });
      }
    }
  );

  // ------------------------------------------------------------------
  // Phase 1: SSE stream
  // ------------------------------------------------------------------
  const startStream = useMemoizedFn(async () => {
    const pid = latestPresetId.current;
    const q = latestQuery.current;
    if (!pid || !q) return;

    // Abort any in-flight stream before starting a new one
    activeAbort?.abort();
    const controller = new AbortController();
    activeAbort = controller;

    dispatch({ type: "START" });

    let completedData: (JudgedSearchResponse & { search_id?: string }) | null = null;
    let partialResources: ResourceCard[] | null = null;

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

          // Capture federated_search results for Phase 2
          if (
            event.stage === "federated_search" &&
            event.status === "done" &&
            event.data &&
            "results" in event.data
          ) {
            partialResources = event.data.results as ResourceCard[];
          }

          // Capture complete data for Phase 2
          if (event.stage === "complete" && event.status === "done" && event.data) {
            completedData = event.data as unknown as JudgedSearchResponse & {
              search_id?: string;
            };
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        dispatch({ type: "ERROR", payload: error.message });
      }
      return;
    }

    // --- Phase 2: trigger per-resource evaluation ---
    if (
      completedData?.search_id &&
      !completedData.judgments?.length &&
      !controller.signal.aborted
    ) {
      // Use top 4 resources (same as backend _TOP_K_EVALUATE)
      const topResources = (partialResources ?? completedData.results ?? []).slice(0, 4);
      if (topResources.length > 0) {
        await runEvaluations(
          completedData.search_id,
          pid,
          q,
          topResources,
          controller.signal
        );
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
