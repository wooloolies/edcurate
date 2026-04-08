import { CheckCircle2, ChevronDown, ClipboardCheck, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import type {
  JudgmentResult,
  JudgmentResultVerdict,
  MetricResultRating,
  ResourceFlag,
} from "@/lib/api/model";

const VERDICT_CONFIG: Record<JudgmentResultVerdict, { badgeClass: string; labelKey: string }> = {
  use_it: {
    badgeClass: "text-emerald-800 bg-emerald-50 border-emerald-200",
    labelKey: "verdicts.use_it",
  },
  adapt_it: {
    badgeClass: "text-amber-900 bg-amber-50 border-amber-200",
    labelKey: "verdicts.adapt_it",
  },
  skip_it: {
    badgeClass: "text-red-800 bg-red-50 border-red-200",
    labelKey: "verdicts.skip_it",
  },
};

const RATING_BADGE: Record<MetricResultRating, string> = {
  strong: "text-emerald-700 bg-emerald-50 border-emerald-200",
  adequate: "text-amber-700 bg-amber-50 border-amber-200",
  weak: "text-red-700 bg-red-50 border-red-200",
};

const SEVERITY_BADGE: Record<string, string> = {
  high: "text-red-700 bg-red-50 border-red-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  low: "text-slate-600 bg-slate-50 border-slate-200",
};

function FlagCard({ flag, t }: { flag: ResourceFlag; t: ReturnType<typeof useTranslations> }) {
  const [open, setOpen] = useState(false);
  const categoryLabel = t.has(`flagCategories.${flag.category}`)
    ? t(`flagCategories.${flag.category}`)
    : flag.category.replace(/_/g, " ");

  return (
    <div className="rounded-md border border-slate-200 bg-white text-xs">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-2 p-2 text-left hover:bg-slate-50 rounded-md"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Badge
            variant="outline"
            className={`shrink-0 uppercase text-[10px] px-1 py-0 ${SEVERITY_BADGE[flag.severity] ?? SEVERITY_BADGE.low}`}
          >
            {flag.severity}
          </Badge>
          <span className="font-medium text-slate-700 truncate">{categoryLabel}</span>
        </div>
        <ChevronDown
          aria-hidden
          className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {!!open && (
        <div className="border-t border-slate-100 p-2 space-y-1.5">
          {!!flag.evidence_quote && flag.evidence_quote !== "—" && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                {t("evidence")}
              </p>
              <p className="italic text-slate-600 leading-snug">"{flag.evidence_quote}"</p>
            </div>
          )}
          {!!flag.explanation && flag.explanation !== "—" && (
            <p className="text-slate-600 leading-snug">{flag.explanation}</p>
          )}
          {!!flag.suggested_action && flag.suggested_action !== "—" && (
            <div className="rounded bg-amber-50 border border-amber-100 px-2 py-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">
                {t("suggested")}
              </p>
              <p className="text-amber-800 leading-snug">{flag.suggested_action}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function VerdictBadge({
  verdict,
  isEvaluating,
}: {
  verdict?: string | null;
  isEvaluating?: boolean;
}) {
  const t = useTranslations("search.evaluation");

  // State 1: Evaluating — blue pulse
  if (isEvaluating) {
    return (
      <Badge
        variant="outline"
        className="w-fit animate-pulse text-blue-600 bg-blue-50 border-blue-200 px-3 py-1 text-sm font-semibold"
      >
        {t("evaluating")}
      </Badge>
    );
  }

  // State 2: No verdict — unevaluated
  if (!verdict) {
    return (
      <Badge
        variant="outline"
        className="w-fit text-slate-500 bg-slate-100 border-slate-200 px-3 py-1 text-sm font-semibold"
      >
        {t("unevaluated")}
      </Badge>
    );
  }

  // State 3: Has verdict
  const config = VERDICT_CONFIG[verdict as JudgmentResultVerdict] ?? VERDICT_CONFIG.adapt_it;

  return (
    <Badge
      variant="outline"
      className={`shrink-0 ${config.badgeClass} flex items-center w-fit px-3 py-1 text-sm font-semibold`}
    >
      {t(config.labelKey)}
    </Badge>
  );
}

export function RelevanceDetails({ judgment }: { judgment: JudgmentResult }) {
  const t = useTranslations("search.evaluation");

  const flags = judgment?.flags ?? [];
  const adaptations = judgment?.adaptations ?? [];

  const metrics = [
    ["curriculumFit", judgment.curriculum_fit],
    ["accessibility", judgment.accessibility],
    ["trustworthiness", judgment.trustworthiness],
  ] as const;

  return (
    <div className="divide-y divide-slate-100 bg-white">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <ClipboardCheck className="h-3.5 w-3.5" />
            {t("sections.triage")}
          </p>
          {!!judgment.confidence && (
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              {t(`confidence.${judgment.confidence}`)}
            </span>
          )}
        </div>
        <ul className="space-y-3">
          {metrics.map(([key, metric]) => (
            <li key={key} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{t(`metrics.${key}`)}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${RATING_BADGE[metric.rating]}`}
                >
                  {t(`ratings.${metric.rating}`)}
                </Badge>
              </div>
              {!!metric.reason && (
                <p className="text-sm text-slate-600 leading-snug">{metric.reason}</p>
              )}
            </li>
          ))}
        </ul>
        {adaptations.length > 0 && (
          <div className="pt-2 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("sections.adaptations")}
            </p>
            <ul className="space-y-1.5">
              {adaptations.map((a, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: adaptation list is ordered
                <li key={i} className="text-sm text-slate-600 flex gap-2">
                  <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                  <span>
                    <span className="font-medium text-slate-800">{a.action}</span>
                    {!!a.rationale && a.rationale !== "—" && (
                      <span className="text-slate-500"> — {a.rationale}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <ShieldAlert className="h-3.5 w-3.5" />
          {t("sections.riskScan")}
        </p>
        {flags.length === 0 ? (
          <p className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            {t("noFlags")}
          </p>
        ) : (
          <div className="space-y-2">
            {flags.map((flag, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: flag list is ordered
              <FlagCard key={i} flag={flag} t={t} />
            ))}
          </div>
        )}
      </div>

      {!!judgment.reasoning_chain && (
        <div className="p-4 space-y-2 bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {t("sections.reasoning")}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed italic">
            "{judgment.reasoning_chain}"
          </p>
          {!!judgment.override_notes && (
            <div className="rounded bg-orange-50 border border-orange-100 px-3 py-2 mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-600 mb-1">
                {t("overrideNote")}
              </p>
              <p className="text-sm text-orange-800 leading-snug">{judgment.override_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
