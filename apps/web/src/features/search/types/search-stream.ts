import type { JudgedSearchResponse } from "@/lib/api/model/judged-search-response";
import type { JudgmentResult } from "@/lib/api/model/judgment-result";
import type { ResourceCard } from "@/lib/api/model/resource-card";

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
  result: JudgedSearchResponse | null;
  isCached: boolean;
  isStreaming: boolean;
  error: string | null;
  /** Set on federated_search/done — resource cards before evaluation */
  partialResults: ResourceCard[] | null;
  /** Accumulated per-resource judgments during evaluation streaming */
  partialJudgments: Map<string, JudgmentResult>;
  /** evaluation_id per resource_url (for Overview page link) */
  evaluationIds: Map<string, string>;
}
