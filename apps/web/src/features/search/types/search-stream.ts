import type { EvaluatedSearchResponse } from "@/lib/api/model/evaluated-search-response";

export type Stage =
  | "query_generation"
  | "federated_search"
  | "rag_preparation"
  | "evaluation"
  | "adversarial"
  | "complete";

export type StageStatus = "working" | "done";

export interface SearchStageEvent {
  stage: Stage;
  status: StageStatus;
  resource_url?: string | null;
  cached?: boolean;
  data?: Record<string, unknown> | null;
}

/** Per-resource tracking for evaluation and adversarial stages. */
export interface ResourceAgentProgress {
  evaluationStatus: StageStatus | null;
  adversarialStatus: StageStatus | null;
}

export interface SearchStreamState {
  /** Status per stage: undefined = not started, "working" = in progress, "done" = finished. */
  stages: Partial<Record<Stage, StageStatus>>;
  activeStage: Stage | null;
  /** Keyed by resource_url. */
  resourceProgress: Map<string, ResourceAgentProgress>;
  result: EvaluatedSearchResponse | null;
  isCached: boolean;
  isStreaming: boolean;
  error: string | null;
}
