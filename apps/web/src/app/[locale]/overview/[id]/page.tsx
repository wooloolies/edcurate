"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Globe, Play } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import {
  RelevanceDetails,
  VerdictBadge,
} from "@/features/search/components/resource-card/relevance-indicator";
import type { JudgmentResult } from "@/lib/api/model";
import { apiClient } from "@/lib/api-client";

const SOURCE_ICON: Record<string, React.ReactNode> = {
  ddgs: <Globe className="h-5 w-5 text-slate-500" />,
  youtube: <Play className="h-5 w-5 text-red-500" />,
  openalex: <BookOpen className="h-5 w-5 text-blue-500" />,
};

async function fetchEvaluation(id: string): Promise<JudgmentResult> {
  const { data } = await apiClient.get<JudgmentResult>(`/api/discovery/evaluation/${id}`);
  return data;
}

export default function OverviewDetailPage() {
  const t = useTranslations("overview");
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

  return (
    <div className="relative min-h-dvh bg-brand-surface overflow-hidden text-brand-ink font-sans flex flex-col">
      <CanvasBackground />
      <Header />

      <main className="relative z-10 flex-1 mt-36 max-w-4xl mx-auto w-full px-8 pb-20">
        {isLoading ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-10 shadow-sm border border-white/80">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="h-32 w-full bg-slate-50 rounded-lg" />
            </div>
          </div>
        ) : error || !judgment ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-10 shadow-sm border border-white/80 text-center">
            <p className="text-muted-foreground text-lg">{t("evaluationNotFound")}</p>
          </div>
        ) : (
          <>
            {/* Resource Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                {SOURCE_ICON[sourceType]}
                <VerdictBadge verdict={judgment.verdict} />
              </div>
              {!!resourceUrl && (
                <a
                  href={resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {resourceUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Evaluation Details */}
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/80 overflow-hidden">
              <RelevanceDetails judgment={judgment} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
