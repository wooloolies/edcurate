import { AlertCircle, CheckCircle2, ChevronDown, HelpCircle, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  AdversarialReviewResult,
  AdversarialReviewResultVerdict,
  ResourceCardEvaluationDetails,
} from "@/lib/api/model";

interface RelevanceIndicatorProps {
  score?: number | null;
  reason?: string | null;
  details?: ResourceCardEvaluationDetails;
  adversarial?: AdversarialReviewResult | null;
}

/** Maps API verdict → card copy (product spec). */
function peerCheckFromVerdict(verdict: AdversarialReviewResultVerdict): {
  label: string;
  badgeClass: string;
} {
  switch (verdict) {
    case "approved":
      return {
        label: "Recommend",
        badgeClass: "text-emerald-800 bg-emerald-50 border-emerald-200",
      };
    case "approved_with_caveats":
      return {
        label: "Recommend with Caveats",
        badgeClass: "text-amber-900 bg-amber-50 border-amber-200",
      };
    case "flagged_for_teacher_review":
      return {
        label: "Need to Review",
        badgeClass: "text-orange-900 bg-orange-50 border-orange-200",
      };
    case "not_recommended":
      return {
        label: "Not Recommend",
        badgeClass: "text-red-800 bg-red-50 border-red-200",
      };
  }
}

function getDimensionValue(value: unknown, key: "score" | "max"): number | string {
  if (typeof value !== "object" || value == null) {
    return "—";
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate[key] === "number" ? candidate[key] : "—";
}

export function RelevanceIndicator({
  score,
  reason,
  details,
  adversarial,
}: RelevanceIndicatorProps) {
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

  const peerCheckDisplay = adversarial != null ? peerCheckFromVerdict(adversarial.verdict) : null;

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
      <div className="flex w-full flex-col items-start justify-between gap-3 sm:flex-row">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className={`shrink-0 ${colorClass}`}>
            {icon}
            Score: {score}/10
          </Badge>
          <span className="text-xs font-medium text-slate-700">Deep Evaluation Agent</span>

          {details ? (
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 outline-none"
                  >
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

        {peerCheckDisplay ? (
          <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Peer check</span>
            <Badge
              variant="outline"
              className={`text-xs max-w-[min(100%,12rem)] whitespace-normal text-left leading-snug sm:max-w-[18rem] ${peerCheckDisplay.badgeClass}`}
            >
              {peerCheckDisplay.label}
            </Badge>
          </div>
        ) : null}
      </div>
      {reason ? (
        <details className="group mt-1 rounded-md border border-slate-200/80 bg-white/40 px-2 py-1.5">
          <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-slate-600 outline-none marker:hidden [&::-webkit-details-marker]:hidden hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
            <span className="min-w-0 text-left">Show evaluation reason</span>
            <ChevronDown
              aria-hidden
              className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <p className="mt-2 border-t border-slate-200/60 pt-2 text-sm italic text-slate-600">
            {reason}
          </p>
        </details>
      ) : null}
    </div>
  );
}
