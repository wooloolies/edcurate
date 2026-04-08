"use client";

import { BookOpen, ChevronDown, Globe, Inbox, Layers, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ResourceCardRenderer } from "@/features/search/components/resource-card";
import type { ResourceAgentProgress } from "@/features/search/types/search-stream";
import type { JudgmentResult, ResourceCard } from "@/lib/api/model";

interface SearchResultsGridProps {
  results: ResourceCard[];
  judgments: Map<string, JudgmentResult>;
  counts: Record<string, number>;
  totalCount: number;
  presetId?: string;
  searchQuery?: string;
  savedUrls: Set<string>;
  selectedResources: Map<string, ResourceCard>;
  onToggleChecked: (resource: ResourceCard, checked: boolean) => void;
  /** True when evaluation is in progress (streaming phase) */
  isEvaluationPhase?: boolean;
  /** Per-resource agent progress (only during streaming) */
  resourceProgress?: Map<string, ResourceAgentProgress>;
  /** evaluation_id per resource_url (for Overview link) */
  evaluationIds?: Map<string, string>;
  /** True when results just arrived from streaming (enables stagger animation) */
  isNewResults?: boolean;
}

export function SearchResultsGrid({
  results,
  judgments,
  counts,
  totalCount,
  presetId,
  searchQuery,
  savedUrls,
  selectedResources,
  onToggleChecked,
  isEvaluationPhase,
  resourceProgress,
  evaluationIds,
  isNewResults,
}: SearchResultsGridProps) {
  const t = useTranslations("search");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState<number>(4);

  // Track which URLs have already been animated so re-renders don't re-stagger
  const animatedUrlsRef = useRef<Set<string>>(new Set());
  // Reset animated set when results array identity changes (new search)
  const prevResultsRef = useRef(results);
  useEffect(() => {
    if (results !== prevResultsRef.current) {
      animatedUrlsRef.current = new Set();
      prevResultsRef.current = results;
    }
  }, [results]);

  const isChecked = (url: string) => selectedResources.has(url) || savedUrls.has(url);

  const filterBySource = (source?: string) =>
    source ? results.filter((r) => r.source === source) : results;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Sidebar: Categories Overview */}
      <aside className="lg:col-span-2 space-y-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeCategory === "all" ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100/60"}`}
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>{t("tabs.all")}</span>
          </div>
          <span className="w-8 text-right text-xs tabular-nums text-slate-400">({totalCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("youtube")}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeCategory === "youtube" ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100/60"}`}
        >
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            <span>{t("tabs.video")}</span>
          </div>
          <span className="w-8 text-right text-xs tabular-nums text-slate-400">
            ({counts.youtube ?? 0})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("ddgs")}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeCategory === "ddgs" ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100/60"}`}
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>{t("tabs.web")}</span>
          </div>
          <span className="w-8 text-right text-xs tabular-nums text-slate-400">
            ({counts.ddgs ?? 0})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("openalex")}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeCategory === "openalex" ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100/60"}`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{t("tabs.papers")}</span>
          </div>
          <span className="w-8 text-right text-xs tabular-nums text-slate-400">
            ({counts.openalex ?? 0})
          </span>
        </button>
      </aside>

      {/* Right Content: Results List */}
      <section className="lg:col-span-10 min-h-[400px]">
        {(() => {
          const items = filterBySource(activeCategory === "all" ? undefined : activeCategory);
          const visibleItems = items.slice(0, visibleCount);
          const remainingCount = items.length - visibleCount;

          if (items.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <Inbox className="h-10 w-10 text-slate-300 mb-4" />
                <p>{t("noResults")}</p>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {visibleItems.map((resource, i) => {
                  const judgment = judgments.get(resource.url);
                  const displayResource = judgment
                    ? { ...resource, verdict: judgment.verdict }
                    : resource;

                  // Only stagger on first appearance
                  const isFirstAppearance = !animatedUrlsRef.current.has(resource.url);
                  if (isFirstAppearance) {
                    animatedUrlsRef.current.add(resource.url);
                  }
                  const shouldStagger = isNewResults && isFirstAppearance;

                  return (
                    <motion.div
                      key={resource.url}
                      initial={shouldStagger ? { opacity: 0, y: 16 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        shouldStagger
                          ? { duration: 0.35, delay: i * 0.08, ease: "easeOut" }
                          : { duration: 0.2 }
                      }
                      layout
                    >
                      <ResourceCardRenderer
                        index={i + 1}
                        resource={displayResource}
                        presetId={presetId}
                        searchQuery={searchQuery}
                        evaluationId={evaluationIds?.get(resource.url)}
                        checked={isChecked(resource.url)}
                        onToggleChecked={(_, c) => onToggleChecked(resource, c)}
                        isEvaluating={
                          isEvaluationPhase &&
                          !!resourceProgress?.has(resource.url) &&
                          !judgments.has(resource.url)
                        }
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {remainingCount > 0 && (
                <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col items-center justify-center gap-4 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    {t("remainingResources", { count: remainingCount })}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setVisibleCount((v) => v + 4)}
                    className="rounded-full px-8 shadow-sm"
                  >
                    {t("evaluateNext", { count: 4 })}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </section>

    </div>
  );
}
