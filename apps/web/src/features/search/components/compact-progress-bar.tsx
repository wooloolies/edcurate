"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import type { Stage, StageStatus } from "@/features/search/types/search-stream";

interface CompactProgressBarProps {
  /** Current streaming stages map */
  stages: Partial<Record<Stage, StageStatus>>;
  /** Active stage being processed */
  activeStage: Stage | null;
  /** Number of completed evaluations */
  completedEvaluations?: number;
  /** Total evaluations expected */
  totalEvaluations?: number;
}

const STAGE_ORDER: Stage[] = [
  "query_generation",
  "federated_search",
  "rag_preparation",
  "evaluation",
  "adversarial",
  "complete",
];

function computePercent(
  stages: Partial<Record<Stage, StageStatus>>,
  completedEvaluations: number,
  totalEvaluations: number
): number {
  // query_generation: 0-15, federated_search: 15-45, rag_preparation: 45-55, evaluation: 55-100
  const weights: Record<string, [number, number]> = {
    query_generation: [0, 15],
    federated_search: [15, 45],
    rag_preparation: [45, 55],
    evaluation: [55, 100],
  };

  let percent = 0;
  for (const stage of STAGE_ORDER) {
    const status = stages[stage];
    const range = weights[stage];
    if (!range) continue;

    if (status === "done") {
      if (stage === "evaluation" && totalEvaluations > 0) {
        percent = range[0] + ((range[1] - range[0]) * completedEvaluations) / totalEvaluations;
      } else {
        percent = range[1];
      }
    } else if (status === "working") {
      if (stage === "evaluation" && totalEvaluations > 0) {
        percent = range[0] + ((range[1] - range[0]) * completedEvaluations) / totalEvaluations;
      } else {
        percent = range[0] + (range[1] - range[0]) * 0.5;
      }
    }
  }

  return Math.round(percent);
}

export function CompactProgressBar({
  stages,
  activeStage,
  completedEvaluations = 0,
  totalEvaluations = 4,
}: CompactProgressBarProps) {
  const t = useTranslations("search.progress");

  const percent = computePercent(stages, completedEvaluations, totalEvaluations);

  const labelKey =
    activeStage === "query_generation"
      ? "stageQueryGeneration"
      : activeStage === "federated_search"
        ? "stageFederatedSearch"
        : activeStage === "rag_preparation"
          ? "stageRagPreparation"
          : activeStage === "evaluation" || activeStage === "adversarial"
            ? "stageEvaluation"
            : "stageSearching";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-3">
      <div className="flex shrink-0 items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">{t(labelKey)}</span>
      </div>

      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-blue-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="shrink-0 tabular-nums text-sm font-medium text-blue-600">
        {percent}%
      </span>
    </div>
  );
}
