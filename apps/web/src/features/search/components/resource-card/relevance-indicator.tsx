import { AlertCircle, CheckCircle2, HelpCircle, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ResourceCardEvaluationDetails } from "@/lib/api/model";

interface RelevanceIndicatorProps {
  score?: number | null;
  reason?: string | null;
  details?: ResourceCardEvaluationDetails;
}

function getDimensionValue(value: unknown, key: "score" | "max"): number | string {
  if (typeof value !== "object" || value == null) {
    return "—";
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate[key] === "number" ? candidate[key] : "—";
}

export function RelevanceIndicator({ score, reason, details }: RelevanceIndicatorProps) {
  if (score == null) {
    return (
      <div className="mt-3 flex flex-col gap-2 rounded-md border bg-slate-50/50 p-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="shrink-0 text-slate-500 bg-slate-100 border-slate-200"
          >
            Unevaluated
          </Badge>
        </div>
      </div>
    );
  }

  // Determine color and icon based on score (0-10)
  let icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
  let colorClass = "text-green-700 bg-green-50 border-green-200";

  if (score >= 8) {
    colorClass = "text-green-700 bg-green-50 border-green-200";
    icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
  } else if (score >= 5) {
    colorClass = "text-yellow-700 bg-yellow-50 border-yellow-200";
    icon = <Info className="mr-1 h-3 w-3" />;
  } else {
    colorClass = "text-red-700 bg-red-50 border-red-200";
    icon = <AlertCircle className="mr-1 h-3 w-3" />;
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-md border bg-slate-50/50 p-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`shrink-0 ${colorClass}`}>
          {icon}
          Score: {score}/10
        </Badge>
        <span className="text-xs font-medium text-slate-700">Deep Evaluation Agent</span>

        {details ? (
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button type="button" className="text-slate-400 hover:text-slate-600 outline-none">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-sm p-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Evaluation Criteria</p>
                  <ul className="grid grid-cols-1 gap-1.5 text-xs">
                    {Object.entries(details).map(([key, value]) => {
                      // Normalize the key e.g. "curriculum_alignment" -> "Curriculum Alignment"
                      const label = key
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ");
                      const scoreVal = getDimensionValue(value, "score");
                      const maxVal = getDimensionValue(value, "max");
                      return (
                        <li
                          key={key}
                          className="flex justify-between border-b border-border/40 pb-1 last:border-0 last:pb-0"
                        >
                          <span className="font-medium text-muted-foreground mr-4">{label}:</span>
                          <span className="shrink-0">
                            {scoreVal} / {maxVal}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      {reason ? <p className="text-sm italic text-slate-600">{reason}</p> : null}
    </div>
  );
}
