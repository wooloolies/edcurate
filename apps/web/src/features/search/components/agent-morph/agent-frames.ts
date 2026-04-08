export interface AgentFrameSet {
  key: string;
  frames: string[];
  frameInterval: number;
}

const searchQueryAgent: AgentFrameSet = {
  key: "SearchQuery",
  frames: [
    "/agents/search-1.png",
    "/agents/search-2.png",
    "/agents/search-3.png",
    "/agents/search-4.png",
  ],
  frameInterval: 600,
};

const triageAgent: AgentFrameSet = {
  key: "Triage",
  frames: ["/agents/triage-1.png", "/agents/triage-2.png"],
  frameInterval: 500,
};

const judgeAgent: AgentFrameSet = {
  key: "Judge",
  frames: ["/agents/judge-1.png", "/agents/judge-2.png"],
  frameInterval: 350,
};

const riskScanner: AgentFrameSet = {
  key: "RiskScanner",
  frames: ["/agents/risk-1.png", "/agents/risk-2.png"],
  frameInterval: 750,
};

export const AGENT_FRAME_SETS = [
  searchQueryAgent,
  triageAgent,
  judgeAgent,
  riskScanner,
] as const;

export const STAGE_TO_AGENT_INDEX: Record<string, number> = {
  query_generation: 0,
  federated_search: 1,
  rag_preparation: 2,
  evaluation: 2,
  adversarial: 3,
  complete: 2,
};

export const STAGE_KEY: Record<string, string> = {
  query_generation: "stageQueryGeneration",
  federated_search: "stageFederatedSearch",
  rag_preparation: "stageRagPreparation",
  evaluation: "stageEvaluation",
  adversarial: "stageAdversarial",
  complete: "stageComplete",
};

export const STAGE_ORDER = [
  "query_generation",
  "federated_search",
  "evaluation",
  "adversarial",
] as const;
