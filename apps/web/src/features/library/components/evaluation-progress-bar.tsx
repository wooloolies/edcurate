"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { EvalStage } from "../types/eval-stream";

interface EvaluationProgressBarProps {
  stage: EvalStage | null;
  completedCount: number;
  totalCount: number;
}

function computePercent(stage: EvalStage | null, completed: number, total: number): number {
  if (!stage) return 0;
  if (stage === "rag_preparation") return 15;
  if (stage === "complete") return 100;
  if (total <= 0) return 30;
  return Math.round(30 + (70 * completed) / total);
}

export function EvaluationProgressBar({ stage, completedCount, totalCount }: EvaluationProgressBarProps) {
  const t = useTranslations("library.progress");
  const percent = computePercent(stage, completedCount, totalCount);

  const label =
    stage === "rag_preparation"
      ? t("preparingResources")
      : t("evaluatingResources");

  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-green/20 bg-brand-green/5 px-4 py-2.5">
      <div className="flex shrink-0 items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-ink/60" />
        <span className="text-xs font-medium text-brand-ink/70">{label}</span>
      </div>

      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-green/20"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand-green transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {totalCount > 0 && (
        <span className="shrink-0 text-xs tabular-nums text-brand-ink/50">
          {t("resourceCount", { completed: completedCount, total: totalCount })}
        </span>
      )}
    </div>
  );
}
