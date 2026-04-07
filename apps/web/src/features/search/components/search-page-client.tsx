"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Repeat, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CompactProgressBar } from "@/features/search/components/compact-progress-bar";
import { ErrorBanner } from "@/features/search/components/error-banner";
import { EvaluationProgress } from "@/features/search/components/evaluation-progress";
import { GeneratedQueriesPanel } from "@/features/search/components/generated-queries";
import { SearchResultsGrid } from "@/features/search/components/search-results-grid";
import { ResourceCardSkeleton } from "@/features/search/components/skeleton/resource-card-skeleton";
import { useSearchStream } from "@/features/search/hooks/use-search-stream";
import { useSearchApiDiscoverySearchGet } from "@/lib/api/discovery/discovery";
import type { JudgmentResult, ResourceCard } from "@/lib/api/model";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useCreateCollectionEndpointApiSavedCollectionsPost,
  useListSavedResourcesEndpointApiSavedGet,
} from "@/lib/api/saved-resources/saved-resources";
import { SaveCollectionDialog } from "./save-collection-dialog";

export function SearchPageClient() {
  const t = useTranslations("search");
  const queryClient = useQueryClient();
  const [presetId, setPresetId] = useQueryState("preset_id");
  const [searchQuery, setSearchQuery] = useQueryState("q");
  const [draft, setDraft] = useState(searchQuery ?? "");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: presetsData } = useListPresetsApiPresetsGet();
  const presets = presetsData?.data ?? [];
  const activePreset = presets.find((p) => p.id === presetId);

  const { data: savedData } = useListSavedResourcesEndpointApiSavedGet();
  const { mutateAsync: createCollection, isPending: isSaving } =
    useCreateCollectionEndpointApiSavedCollectionsPost();
  const [selectedResources, setSelectedResources] = useState<Map<string, ResourceCard>>(new Map());
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Build a set of already-saved URLs for the active preset
  const savedUrls = useMemo(() => {
    const urls = new Set<string>();
    if (presetId && savedData?.groups) {
      for (const group of savedData.groups) {
        if (group.preset_id === presetId) {
          for (const col of group.collections) {
            for (const item of col.items) {
              urls.add(item.resource_url);
            }
          }
        }
      }
    }
    return urls;
  }, [presetId, savedData]);

  const handleToggleChecked = (resource: ResourceCard, checked: boolean) => {
    setSelectedResources((prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(resource.url, resource);
      } else {
        next.delete(resource.url);
      }
      return next;
    });
  };

  const handleSaveSelected = async (name: string, isPublic: boolean) => {
    if (!presetId || selectedResources.size === 0) return;
    try {
      const resourcesList = Array.from(selectedResources.values());
      const evaluationDataList = resourcesList.map(
        (resource) => displayJudgments.get(resource.url) ?? null
      );
      await createCollection({
        data: {
          preset_id: presetId,
          search_query: searchQuery || "custom",
          name: name,
          is_public: isPublic,
          resources: resourcesList,
          evaluation_data_list: evaluationDataList,
        },
      });
      setSelectedResources(new Map());
      setIsSaveModalOpen(false);
      toast.success(t("savedSuccess"));
      queryClient.invalidateQueries({
        queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
      });
    } catch (_e) {
      toast.error(t("savedError"));
    }
  };

  const handleClearSelection = () => {
    setSelectedResources(new Map());
  };

  const stream = useSearchStream(presetId, searchQuery);

  const searchEnabled = !!presetId && !!searchQuery;

  // SSE failure → REST fallback
  const useFallback = stream.error !== null;
  const { data: fallbackResults, isFetching } = useSearchApiDiscoverySearchGet(
    { preset_id: presetId!, query: searchQuery! },
    { query: { enabled: searchEnabled && useFallback, staleTime: 3 * 60 * 1000 } }
  );

  // SSE result is primary; REST fallback is secondary
  const results = stream.result ?? fallbackResults;

  // Track pending stream start — ensures React re-renders with updated
  // searchQuery before startStream reads it via useLatest.
  const pendingStreamRef = useRef(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetId || !draft.trim()) return;
    const trimmed = draft.trim();
    if (trimmed === searchQuery) {
      // Same query — trigger stream directly since useEffect won't fire
      void stream.startStream();
    } else {
      setSearchQuery(trimmed);
      pendingStreamRef.current = true;
    }
  };

  useEffect(() => {
    if (pendingStreamRef.current && searchQuery) {
      pendingStreamRef.current = false;
      void stream.startStream();
    }
  }, [searchQuery, stream.startStream]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const judgmentByUrl = useMemo(() => {
    const m = new Map<string, JudgmentResult>();
    for (const j of results?.judgments ?? []) {
      m.set(j.resource_url, j);
    }
    return m;
  }, [results?.judgments]);

  // Unified data source: complete results take priority, then partial (streaming)
  const displayResults = results?.results ?? stream.partialResults;
  const displayJudgments = results ? judgmentByUrl : stream.partialJudgments;
  const isEvaluationPhase = stream.isStreaming && !!stream.partialResults;

  const displayCounts = useMemo(() => {
    if (results) return results.counts_by_source ?? { ddgs: 0, youtube: 0, openalex: 0 };
    const c: Record<string, number> = { ddgs: 0, youtube: 0, openalex: 0 };
    for (const card of stream.partialResults ?? []) {
      c[card.source] = (c[card.source] ?? 0) + 1;
    }
    return c;
  }, [results, stream.partialResults]);

  const displayTotalCount = results?.total_results ?? stream.partialResults?.length ?? 0;

  const hasContent = results || stream.isStreaming || isFetching || !!stream.partialResults;

  return (
    <div className={`w-full max-w-4xl space-y-6 ${!hasContent ? "my-auto" : ""}`}>
      {/* Preset Header */}
      <div className="flex flex-col mb-2 pl-2">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-brand-ink leading-none mb-1">
            {activePreset?.name ?? t("selectCollection")}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t("changePreset")}
                className="p-2 border-2 border-white/40 rounded-xl bg-white/30 backdrop-blur-md shadow-sm flex items-center justify-center shrink-0 hover:bg-white transition-all transform hover:scale-105 cursor-pointer"
              >
                <Repeat className="w-5 h-5 text-brand-ink stroke-[2.5]" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="flex flex-col gap-1">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetId(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      p.id === presetId
                        ? "bg-brand-green text-brand-ink"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-lg font-medium text-brand-ink/60 mt-1 pl-1">{t("subtitle")}</p>
      </div>

      {/* Glassy Search Box */}
      <div className="w-full bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.1)] border border-white/60 p-6 md:p-8 flex flex-col gap-6">
        {/* Search Input */}
        <form
          onSubmit={handleSearch}
          className="w-full flex items-center bg-white/60 border-2 border-white/60 hover:bg-white/80 focus-within:bg-white focus-within:border-brand-green rounded-[2.5rem] p-2 transition-all shadow-md"
        >
          <div className="pl-6 pr-4 text-brand-ink">
            <Search className="w-6 h-6" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 bg-transparent py-4 text-xl font-bold text-brand-ink placeholder:text-gray-500 outline-none w-full"
          />
          <div className="flex items-center gap-2 pr-2">
            {draft ? (
              <button
                type="button"
                onClick={() => setDraft("")}
                className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-black transition-colors rounded-full hover:bg-gray-200/50 hidden md:block cursor-pointer"
              >
                {t("clearInput")}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={!presetId || !draft.trim() || stream.isStreaming || isFetching}
              className="px-8 py-4 bg-brand-ink text-brand-green hover:scale-105 active:scale-95 transition-all rounded-[2rem] font-bold text-lg shadow-md whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stream.isStreaming || isFetching ? t("searchingButton") : t("searchButton")}
            </button>
          </div>
        </form>

        {/* Applied Tags */}
        {activePreset && (
          <div className="flex flex-wrap items-start justify-between gap-4 px-2 -mt-2">
            <div className="flex flex-wrap items-center gap-3">
              {!!activePreset.subject && (
                <div className="px-5 py-2.5 bg-white border border-brand-ink/10 rounded-xl text-sm font-bold text-brand-ink shadow-sm cursor-pointer">
                  {activePreset.subject}
                </div>
              )}
              {!!activePreset.year_level && (
                <div className="px-5 py-2.5 bg-white border border-brand-ink/10 rounded-xl text-sm font-bold text-brand-ink shadow-sm cursor-pointer">
                  {activePreset.year_level}
                </div>
              )}
              {!!activePreset.class_size && (
                <div className="px-5 py-2.5 bg-white border border-brand-ink/10 rounded-xl text-sm font-bold text-brand-ink shadow-sm cursor-pointer">
                  {t("classSizePeople", { classSize: activePreset.class_size })}
                </div>
              )}
              {!!activePreset.country && (
                <div className="px-5 py-2.5 bg-white border border-brand-ink/10 rounded-xl text-sm font-bold text-brand-ink shadow-sm cursor-pointer">
                  {activePreset.country}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {results && results.errors.length > 0 ? <ErrorBanner errors={results.errors} /> : null}

      {results?.generated_queries && !isFetching ? (
        <GeneratedQueriesPanel queries={results.generated_queries} />
      ) : null}

      {/* Progress bar — shown during all streaming phases */}
      {stream.isStreaming ? (
        <CompactProgressBar
          stages={stream.stages}
          activeStage={stream.activeStage}
          completedEvaluations={stream.partialJudgments.size}
          totalEvaluations={4}
        />
      ) : null}

      {/* Skeleton cards — before federated_search results arrive */}
      {stream.isStreaming && !stream.partialResults ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list is static
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : isFetching ? (
        <div className="space-y-4">
          <EvaluationProgress />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list is static
              <ResourceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Results grid: shown during evaluation phase AND after complete */}
      {displayResults && !isFetching && (!stream.isStreaming || isEvaluationPhase) ? (
        <SearchResultsGrid
          results={displayResults}
          judgments={displayJudgments}
          counts={displayCounts}
          totalCount={displayTotalCount}
          presetId={presetId ?? undefined}
          searchQuery={searchQuery ?? undefined}
          savedUrls={savedUrls}
          selectedResources={selectedResources}
          onToggleChecked={handleToggleChecked}
          isEvaluationPhase={isEvaluationPhase}
          resourceProgress={stream.resourceProgress}
          evaluationIds={stream.evaluationIds}
          isNewResults={!results}
        />
      ) : null}

      {selectedResources.size > 0 && (
        <>
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border bg-background px-6 py-3 shadow-lg">
            <span className="text-sm font-medium">
              {t("resourcesSelected", { count: selectedResources.size })}
            </span>
            <Button size="sm" onClick={() => setIsSaveModalOpen(true)} disabled={isSaving}>
              {t("saveToLibrary")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleClearSelection}
              aria-label={t("clearSelection")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <SaveCollectionDialog
            isOpen={isSaveModalOpen}
            onOpenChange={setIsSaveModalOpen}
            onSave={handleSaveSelected}
            isSaving={isSaving}
            defaultName={searchQuery ? `Search: ${searchQuery}` : "New Collection"}
          />
        </>
      )}
    </div>
  );
}
