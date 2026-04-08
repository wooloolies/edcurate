"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { fetchSSE } from "@/features/search/utils/fetch-sse";
import { parseSSEBuffer } from "@/features/search/utils/parse-sse";
import { getListSavedResourcesEndpointApiSavedGetQueryKey } from "@/lib/api/saved-resources/saved-resources";

import type { EvalStageEvent, EvalStreamState } from "../types/eval-stream";
import { INITIAL_EVAL_STREAM_STATE } from "../types/eval-stream";

export function useEvaluationStream() {
  const queryClient = useQueryClient();
  const [streams, setStreams] = useState<Map<string, EvalStreamState>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const updateStream = useCallback((key: string, update: Partial<EvalStreamState>) => {
    setStreams((prev) => {
      const next = new Map(prev);
      const current = next.get(key) ?? { ...INITIAL_EVAL_STREAM_STATE };
      next.set(key, { ...current, ...update });
      return next;
    });
  }, []);

  const consumeSSE = useCallback(
    async (key: string, path: string, params: Record<string, string>) => {
      abortControllers.current.get(key)?.abort();

      const controller = new AbortController();
      abortControllers.current.set(key, controller);

      updateStream(key, {
        isStreaming: true,
        stage: null,
        completedCount: 0,
        totalCount: 0,
        error: null,
      });

      try {
        const response = await fetchSSE(path, params, controller.signal);

        if (!response.ok || !response.body) {
          updateStream(key, { isStreaming: false, error: "Failed to connect" });
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { parsed, remainder } = parseSSEBuffer<EvalStageEvent>(buffer);
          buffer = remainder;

          for (const event of parsed) {
            if (event.stage === "rag_preparation") {
              const total = typeof event.data?.total === "number" ? event.data.total : 0;
              updateStream(key, { stage: "rag_preparation", totalCount: total });
            } else if (event.stage === "evaluation") {
              if (event.status === "done") {
                setStreams((prev) => {
                  const next = new Map(prev);
                  const current = next.get(key) ?? { ...INITIAL_EVAL_STREAM_STATE };
                  next.set(key, {
                    ...current,
                    stage: "evaluation",
                    completedCount: current.completedCount + 1,
                  });
                  return next;
                });
              } else {
                updateStream(key, { stage: "evaluation" });
              }
            } else if (event.stage === "complete") {
              updateStream(key, { isStreaming: false, stage: "complete" });
              queryClient.invalidateQueries({
                queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
              });
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          updateStream(key, { isStreaming: false, error: "Stream failed" });
        }
      } finally {
        abortControllers.current.delete(key);
        setStreams((prev) => {
          const next = new Map(prev);
          const current = next.get(key);
          if (current?.isStreaming) {
            next.set(key, { ...current, isStreaming: false });
          }
          return next;
        });
        setTimeout(() => {
          setStreams((prev) => {
            const next = new Map(prev);
            const entry = next.get(key);
            if (entry && !entry.isStreaming) {
              next.delete(key);
            }
            return next;
          });
        }, 3000);
      }
    },
    [queryClient, updateStream]
  );

  const startStream = useCallback(
    (presetId: string, searchQuery: string) => {
      const key = `batch:${presetId}:${searchQuery}`;
      void consumeSSE(key, "/api/saved/evaluate/stream", {
        preset_id: presetId,
        search_query: searchQuery,
      });
    },
    [consumeSSE]
  );

  const startSingleStream = useCallback(
    (resourceId: string) => {
      const key = `single:${resourceId}`;
      void consumeSSE(key, "/api/saved/evaluate-single/stream", {
        saved_resource_id: resourceId,
      });
    },
    [consumeSSE]
  );

  const getStreamState = useCallback(
    (key: string): EvalStreamState | null => {
      return streams.get(key) ?? null;
    },
    [streams]
  );

  const getBatchState = useCallback(
    (presetId: string, searchQuery: string): EvalStreamState | null => {
      return streams.get(`batch:${presetId}:${searchQuery}`) ?? null;
    },
    [streams]
  );

  const getSingleState = useCallback(
    (resourceId: string): EvalStreamState | null => {
      return streams.get(`single:${resourceId}`) ?? null;
    },
    [streams]
  );

  return { startStream, startSingleStream, getStreamState, getBatchState, getSingleState };
}
