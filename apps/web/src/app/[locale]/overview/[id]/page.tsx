"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, ExternalLink, Globe, Play, ShieldAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackButton } from "@/app/[locale]/overview/back-button";
import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { VerdictBadge } from "@/features/search/components/resource-card/relevance-indicator";
import { apiClient } from "@/lib/api-client";
import type { JudgmentResult, MetricResultRating, ResourceFlag } from "@/lib/api/model";

// ─── Constants ───────────────────────────────────────────────────────────────

const SOURCE_ICON: Record<string, React.ReactNode> = {
  ddgs: <Globe className="h-5 w-5 text-slate-500" />,
  youtube: <Play className="h-5 w-5 text-red-500" />,
  openalex: <BookOpen className="h-5 w-5 text-blue-500" />,
};

const SEVERITY_BADGE: Record<string, string> = {
  high: "text-red-700 bg-red-50 border-red-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  low: "text-slate-600 bg-slate-50 border-slate-200",
};

// ─── API ─────────────────────────────────────────────────────────────────────

async function fetchEvaluation(id: string): Promise<JudgmentResult> {
  const { data } = await apiClient.get<JudgmentResult>(`/api/discovery/evaluation/${id}`);
  return data;
}

// ─── StatusDot ───────────────────────────────────────────────────────────────

function StatusDot({ rating }: { rating: MetricResultRating }) {
  if (rating === "strong") {
    return (
      <span className="relative flex h-5 w-5 shrink-0" aria-hidden>
        <span
          className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#f87171,#facc15,#4ade80,#60a5fa,#a78bfa,#f472b6,#f87171)] motion-safe:animate-spin"
          style={{ animationDuration: "4s" }}
        />
        <span className="relative m-[2px] rounded-full bg-white flex-1" />
      </span>
    );
  }
  if (rating === "adequate") {
    return (
      <span
        className="h-5 w-5 shrink-0 rounded-full bg-amber-400 border-2 border-amber-300"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="h-5 w-5 shrink-0 rounded-full bg-red-500 border-2 border-red-400"
      aria-hidden
    />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      {/* Resource header skeleton */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-5 w-5 rounded-full bg-slate-200" />
          <div className="h-7 w-24 bg-slate-200 rounded-full" />
          <div className="h-7 w-20 bg-slate-100 rounded-full" />
        </div>
        <div className="h-4 w-64 bg-slate-100 rounded" />
      </div>

      {/* Reasoning skeleton */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80 animate-pulse">
        <div className="h-7 w-32 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-5/6 bg-slate-100 rounded" />
          <div className="h-4 w-4/5 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Evaluation skeleton */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80 animate-pulse">
        <div className="h-7 w-28 bg-slate-200 rounded mb-6" />
        <div className="space-y-5">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="flex items-start gap-4">
                <div className="h-5 w-5 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-36 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-4/5 bg-slate-100 rounded" />
                </div>
              </div>
              {i < 2 && <div className="border-t border-slate-100 mt-5" />}
            </div>
          ))}
        </div>
      </div>

      {/* Adaptation skeleton */}
      <div className="bg-slate-800/80 rounded-[2rem] p-8 animate-pulse">
        <div className="h-7 w-40 bg-slate-700 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-700/50 rounded" />
          <div className="h-4 w-3/4 bg-slate-700/50 rounded" />
        </div>
      </div>

      {/* Risk scan skeleton */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80 animate-pulse">
        <div className="h-7 w-28 bg-slate-200 rounded mb-6" />
        <div className="space-y-3">
          <div className="h-12 w-full bg-slate-100 rounded-xl" />
          <div className="h-12 w-full bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Flag Card ────────────────────────────────────────────────────────────────

function FlagCard({
  flag,
  tEval,
  tOverview,
}: {
  flag: ResourceFlag;
  tEval: ReturnType<typeof useTranslations>;
  tOverview: ReturnType<typeof useTranslations>;
}) {
  const categoryLabel = tEval.has(`flagCategories.${flag.category}`)
    ? tEval(`flagCategories.${flag.category}`)
    : flag.category.replace(/_/g, " ");

  const severityClass = SEVERITY_BADGE[flag.severity] ?? SEVERITY_BADGE.low;

  return (
    <article className="bg-white/80 rounded-xl border border-white/60 p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${severityClass}`}
        >
          {flag.severity}
        </span>
        <span className="text-sm font-semibold text-[#111827]">{categoryLabel}</span>
      </div>

      {/* Evidence quote */}
      {!!flag.evidence_quote && flag.evidence_quote !== "—" && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            {tOverview("evidenceQuote")}
          </p>
          <blockquote className="border-l-4 border-[#111827] pl-4 italic text-slate-700 text-sm leading-relaxed font-serif">
            "{flag.evidence_quote}"
          </blockquote>
        </div>
      )}

      {/* Explanation */}
      {!!flag.explanation && flag.explanation !== "—" && (
        <p className="text-sm text-slate-600 leading-relaxed">{flag.explanation}</p>
      )}

      {/* Suggested action */}
      {!!flag.suggested_action && flag.suggested_action !== "—" && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 mb-1">
            {tOverview("suggestedAction")}
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">{flag.suggested_action}</p>
        </div>
      )}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewDetailPage() {
  const t = useTranslations("overview");
  const tEval = useTranslations("search.evaluation");
  const params = useParams<{ id: string }>();
  const evaluationId = params.id;

  const {
    data: judgment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: () => fetchEvaluation(evaluationId),
    enabled: !!evaluationId,
    staleTime: 5 * 60 * 1000,
  });

  const resourceUrl = judgment?.resource_url ?? "";
  const sourceType = resourceUrl.includes("youtube.com")
    ? "youtube"
    : resourceUrl.includes("openalex.org") || resourceUrl.includes("doi.org")
      ? "openalex"
      : "ddgs";

  const flags = judgment?.flags ?? [];
  const adaptations = judgment?.adaptations ?? [];

  const metrics = judgment
    ? ([
        ["curriculumFit", judgment.curriculum_fit],
        ["accessibility", judgment.accessibility],
        ["trustworthiness", judgment.trustworthiness],
      ] as const)
    : [];

  return (
    <div className="relative min-h-dvh bg-brand-surface overflow-hidden text-brand-ink font-sans flex flex-col">
      <CanvasBackground />
      <Header />

      <div className="absolute top-8 left-4 md:left-8 z-50 flex items-center h-[56px]">
        <BackButton />
      </div>

      <main className="relative z-10 flex-1 mt-36 max-w-5xl mx-auto w-full px-4 md:px-8 pb-20">
        {isLoading ? (
          <OverviewSkeleton />
        ) : error || !judgment ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-10 shadow-sm border border-white/80 text-center">
            <p className="text-muted-foreground text-lg">{t("evaluationNotFound")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Section 1: Resource Header ── */}
            <section
              className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80"
              aria-label="Resource header"
            >
              <div className="flex items-center gap-3 flex-wrap mb-3">
                {SOURCE_ICON[sourceType]}
                <VerdictBadge verdict={judgment.verdict} />
                {!!judgment.confidence && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    {tEval(`confidence.${judgment.confidence}`)}
                  </span>
                )}
              </div>
              {!!resourceUrl && (
                <a
                  href={resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
                  aria-label={`Open resource: ${resourceUrl}`}
                >
                  <span className="truncate max-w-prose">{resourceUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </a>
              )}
            </section>

            {/* ── Section 2: Reasoning ── */}
            {!!judgment.reasoning_chain && (
              <section
                className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80"
                aria-labelledby="reasoning-heading"
              >
                <h2
                  id="reasoning-heading"
                  className="text-2xl font-bold mb-4 text-[#111827]"
                >
                  {t("reasoning")}
                </h2>
                <p className="text-[#111827]/70 text-base leading-relaxed italic">
                  {judgment.reasoning_chain}
                </p>
              </section>
            )}

            {/* ── Section 3: Evaluation Metrics ── */}
            <section
              className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80"
              aria-labelledby="evaluation-heading"
            >
              <h2
                id="evaluation-heading"
                className="text-2xl font-bold mb-6 text-[#111827]"
              >
                {t("evaluation")}
              </h2>

              <div className="space-y-5">
                {metrics.map(([key, metric], index) => (
                  <div key={key}>
                    <div className="flex items-start gap-4">
                      <StatusDot rating={metric.rating} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-base text-[#111827]">
                            {tEval(`metrics.${key}`)}
                          </h3>
                          <span className="text-sm font-medium text-slate-500">
                            {tEval(`ratings.${metric.rating}`)}
                          </span>
                        </div>
                        {!!metric.reason && (
                          <p className="text-sm text-slate-500 leading-relaxed">{metric.reason}</p>
                        )}
                      </div>
                    </div>
                    {index < metrics.length - 1 && (
                      <div className="border-t border-slate-100 mt-5" aria-hidden />
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div
                className="flex items-center gap-5 mt-6 pt-5 border-t border-slate-100 flex-wrap"
                aria-label="Rating legend"
              >
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <StatusDot rating="strong" />
                  <span>{tEval("ratings.strong")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <StatusDot rating="adequate" />
                  <span>{tEval("ratings.adequate")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <StatusDot rating="weak" />
                  <span>{tEval("ratings.weak")}</span>
                </div>
              </div>
            </section>

            {/* ── Section 4: Adaptation Advice ── */}
            {adaptations.length > 0 && (
              <section
                className="bg-[#111827] text-white rounded-[2rem] p-8 shadow-md"
                aria-labelledby="adaptation-heading"
              >
                <h2
                  id="adaptation-heading"
                  className="font-bold text-xl text-[#B7FF70] mb-5"
                >
                  {t("adaptationAdvice")}
                </h2>
                <ul className="space-y-4">
                  {adaptations.map((adaptation, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: adaptation list is ordered
                    <li key={i} className="flex gap-3">
                      <span className="mt-1 shrink-0 text-[#B7FF70] font-bold" aria-hidden>
                        •
                      </span>
                      <div>
                        <span className="font-bold text-white">{adaptation.action}</span>
                        {!!adaptation.rationale && adaptation.rationale !== "—" && (
                          <span className="text-white/70"> — {adaptation.rationale}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── Section 5: Flags / Risk Scan ── */}
            <section
              className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/80"
              aria-labelledby="risk-heading"
            >
              <h2
                id="risk-heading"
                className="text-2xl font-bold mb-6 text-[#111827] flex items-center gap-2"
              >
                <ShieldAlert className="h-6 w-6 text-slate-500" aria-hidden />
                {t("riskScan")}
              </h2>

              {flags.length === 0 ? (
                <p className="flex items-center gap-2 text-base font-medium text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                  {t("noIssuesFound")}
                </p>
              ) : (
                <div className="space-y-4">
                  {flags.map((flag, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: flag list is ordered
                    <FlagCard key={i} flag={flag} tEval={tEval} tOverview={t} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
