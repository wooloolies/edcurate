export type EvalStage = "rag_preparation" | "evaluation" | "complete";

export interface EvalStageEvent {
  stage: EvalStage;
  status: "working" | "done";
  resource_url?: string | null;
  data?: Record<string, unknown> | null;
}

export interface EvalStreamState {
  isStreaming: boolean;
  stage: EvalStage | null;
  completedCount: number;
  totalCount: number;
  error: string | null;
}

export const INITIAL_EVAL_STREAM_STATE: EvalStreamState = {
  isStreaming: false,
  stage: null,
  completedCount: 0,
  totalCount: 0,
  error: null,
};
