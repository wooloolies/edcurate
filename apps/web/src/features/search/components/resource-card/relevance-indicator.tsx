import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import type {
  JudgmentResult,
  JudgmentResultVerdict,
  MetricResultRating,
  ResourceFlag,
} from "@/lib/api/model";

interface RelevanceIndicatorProps {
  verdict?: string | null;
  reason?: string | null;
  judgment?: JudgmentResult | null;
}

const VERDICT_CONFIG: Record<
  JudgmentResultVerdict,
  { badgeClass: string; icon: React.ReactNode; labelKey: string }
> = {
  use_it: {
    badgeClass: "text-emerald-800 bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
    labelKey: "verdicts.use_it",
  },
  adapt_it: {
    badgeClass: "text-amber-900 bg-amber-50 border-amber-200",
    icon: <Info className="mr-1 h-3 w-3" />,
    labelKey: "verdicts.adapt_it",
  },
  skip_it: {
    badgeClass: "text-red-800 bg-red-50 border-red-200",
    icon: <AlertCircle className="mr-1 h-3 w-3" />,
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

export function RelevanceIndicator({ verdict, judgment }: RelevanceIndicatorProps) {
  const t = useTranslations("search.evaluation");
  const [open, setOpen] = useState(false);

  if (!verdict) {
    return (
      <div className="mt-3 flex flex-col gap-2 rounded-md border bg-slate-50/50 p-3">
        <Badge variant="outline" className="w-fit text-slate-500 bg-slate-100 border-slate-200">
          {t("unevaluated")}
        </Badge>
      </div>
    );
  }

  const config = VERDICT_CONFIG[verdict as JudgmentResultVerdict] ?? VERDICT_CONFIG.adapt_it;
  const flags = judgment?.flags ?? [];
  const highFlags = flags.filter((f) => f.severity === "high");
  const adaptations = judgment?.adaptations ?? [];

  const metrics = judgment
    ? ([
        ["curriculumFit", judgment.curriculum_fit],
        ["accessibility", judgment.accessibility],
        ["trustworthiness", judgment.trustworthiness],
      ] as const)
    : null;

  return (
    <div className="mt-3 rounded-md border bg-slate-50/50">
      {/* ── Header row ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className={`shrink-0 ${config.badgeClass}`}>
            {config.icon}
            {t(config.labelKey)}
          </Badge>

          {!!judgment?.confidence && (
            <span className="text-xs text-slate-500">{t(`confidence.${judgment.confidence}`)}</span>
          )}

          <span className="text-xs font-medium text-slate-600">{t("agent")}</span>

          {highFlags.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-red-600 font-medium">
                {t("flags", { count: flags.length })}
              </span>
            </div>
          )}
        </div>

        {!!judgment && (
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="flex shrink-0 items-center gap-1 text-xs text-slate-500 hover:text-slate-700 rounded px-1.5 py-0.5 hover:bg-slate-100 transition-colors"
          >
            <span>{open ? t("hideDetails") : t("showDetails")}</span>
            <ChevronDown
              aria-hidden
              className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* ── Expanded details ────────────────────────────────────── */}
      {!!open && !!judgment && (
        <div className="border-t border-slate-200 divide-y divide-slate-100">
          {/* Call 1 — Triage */}
          {!!metrics && (
            <div className="p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <Sparkles className="h-3 w-3" />
                {t("sections.triage")}
              </p>
              <ul className="space-y-2">
                {metrics.map(([key, metric]) => (
                  <li key={key} className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700">
                        {t(`metrics.${key}`)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${RATING_BADGE[metric.rating]}`}
                      >
                        {t(`ratings.${metric.rating}`)}
                      </Badge>
                    </div>
                    {!!metric.reason && (
                      <p className="text-xs text-slate-500 leading-snug pl-0.5">{metric.reason}</p>
                    )}
                  </li>
                ))}
              </ul>
              {adaptations.length > 0 && (
                <div className="pt-1 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("sections.adaptations")}
                  </p>
                  <ul className="space-y-1">
                    {adaptations.map((a, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: adaptation list is ordered
                      <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                        <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                        <span>
                          <span className="font-medium">{a.action}</span>
                          {!!a.rationale && a.rationale !== "—" && (
                            <span className="text-slate-400"> — {a.rationale}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Call 2 — Risk Scan */}
          <div className="p-3 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <ShieldAlert className="h-3 w-3" />
              {t("sections.riskScan")}
            </p>
            {flags.length === 0 ? (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t("noFlags")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {flags.map((flag, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: flag list is ordered
                  <FlagCard key={i} flag={flag} t={t} />
                ))}
              </div>
            )}
          </div>

          {/* Call 3 — Final Reasoning */}
          {!!judgment.reasoning_chain && (
            <div className="p-3 space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("sections.reasoning")}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                {judgment.reasoning_chain}
              </p>
              {!!judgment.override_notes && (
                <div className="rounded bg-orange-50 border border-orange-100 px-2 py-1 mt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-600 mb-0.5">
                    {t("overrideNote")}
                  </p>
                  <p className="text-xs text-orange-800 leading-snug">{judgment.override_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
