export interface AgentFrameSet {
  name: string;
  title: string;
  description: string;
  frames: string[];
  frameInterval: number;
}

const searchQueryAgent: AgentFrameSet = {
  name: "SearchQueryAgent",
  title: "SearchQueryAgent is active",
  description:
    "Analyzing complex parameters and mapping the research trajectory for deep-dive discovery.",
  frames: [
    "/agents/search-1.png",
    "/agents/search-2.png",
    "/agents/search-3.png",
    "/agents/search-4.png",
  ],
  frameInterval: 600,
};

const triageAgent: AgentFrameSet = {
  name: "TriageAgent",
  title: "Triggering TriageAgent",
  description:
    "Filtering high-intent results and classifying data priority.",
  frames: ["/agents/triage-1.png", "/agents/triage-2.png"],
  frameInterval: 500,
};

const judgeAgent: AgentFrameSet = {
  name: "JudgeAgent",
  title: "Triggering JudgeAgent",
  description:
    "Synthesizing final results and preparing the editorial report.",
  frames: ["/agents/judge-1.png", "/agents/judge-2.png"],
  frameInterval: 350,
};

const riskScanner: AgentFrameSet = {
  name: "RiskScanner",
  title: "Triggering RiskScanner",
  description:
    "Scanning high-intent results for potential risks and anomalies.",
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

export const STAGE_LABELS: Record<string, string> = {
  query_generation: "Generating search queries",
  federated_search: "Searching across engines",
  rag_preparation: "Preparing resources",
  evaluation: "Evaluating resources",
  adversarial: "Checking for risks",
  complete: "Done",
};

export const STAGE_ORDER = [
  "query_generation",
  "federated_search",
  "evaluation",
  "adversarial",
] as const;
