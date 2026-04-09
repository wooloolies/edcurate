"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useRouter } from "@/lib/i18n/routing";
import { AgentMorphScene } from "@/features/search/components/agent-morph/agent-morph-scene";
import { ErrorBanner } from "@/features/search/components/error-banner";
import { GeneratedQueriesPanel } from "@/features/search/components/generated-queries";
import { PresetHeader } from "@/features/search/components/preset-header";
import { SearchBox } from "@/features/search/components/search-box";
import { SearchResultsGrid } from "@/features/search/components/search-results-grid";
import { SelectionBar } from "@/features/search/components/selection-bar";
import { ResourceCardSkeleton } from "@/features/search/components/skeleton/resource-card-skeleton";
import { SuggestedCollectionsRail } from "@/features/search/components/suggested-collections-rail";
import { useSearchStream } from "@/features/search/hooks/use-search-stream";
import { useSearchApiDiscoverySearchGet } from "@/lib/api/discovery/discovery";
import type { JudgmentResult } from "@/lib/api/model";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useCreateCollectionEndpointApiSavedCollectionsPost,
  useListSavedResourcesEndpointApiSavedGet,
} from "@/lib/api/saved-resources/saved-resources";
import {
  clearSelectionAtom,
  searchPresetIdAtom,
  selectedResourcesAtom,
} from "@/stores/search-context-atoms";

export function SearchPageClient() {
  const t = useTranslations("search");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [presetId, setPresetId] = useQueryState("collection_id");
  const [searchQuery, setSearchQuery] = useQueryState("q");
  const [draft, setDraft] = useState(searchQuery ?? "");

  // Sync presetId to atom so child components can read it directly
  const setPresetIdAtom = useSetAtom(searchPresetIdAtom);
  useEffect(() => {
    setPresetIdAtom(presetId);
  }, [presetId, setPresetIdAtom]);

  const [selectedResources] = useAtom(selectedResourcesAtom);
  const clearSelection = useSetAtom(clearSelectionAtom);

  const { data: presetsData, isLoading: isPresetsLoading } = useListPresetsApiPresetsGet();
  const presets = presetsData?.data ?? [];
  const activePreset = presets.find((p) => p.id === presetId);
  const isPresetResolving = !!presetId && !activePreset && isPresetsLoading;

  const { data: savedData } = useListSavedResourcesEndpointApiSavedGet();
  const { mutateAsync: createCollection, isPending: isSaving } =
    useCreateCollectionEndpointApiSavedCollectionsPost();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [suggestedOpen, setSuggestedOpen] = useState(true);

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

  const handleSaveSelected = async (name: string, isPublic: boolean, description?: string) => {
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
          description: description,
          is_public: isPublic,
          resources: resourcesList,
          evaluation_data_list: evaluationDataList,
        },
      });
      clearSelection();
      setIsSaveModalOpen(false);
      toast.success(t("savedSuccess"));
      await queryClient.invalidateQueries({
        queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
      });
      router.push(`/library?collection=${presetId}`);
    } catch (_e) {
      toast.error(t("savedError"));
    }
  };

  const stream = useSearchStream(presetId, searchQuery);

  const searchEnabled = !!presetId && !!searchQuery;

  // SSE failure → REST fallback
  const useFallback = stream.error !== null;
  const { data: fallbackResults, isFetching } = useSearchApiDiscoverySearchGet(
    { preset_id: presetId!, query: searchQuery! },
    { query: { enabled: searchEnabled && useFallback, staleTime: 3 * 60 * 1000 } }
  );

  const results = stream.result ?? fallbackResults;

  const pendingStreamRef = useRef(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetId || !draft.trim()) return;
    const trimmed = draft.trim();
    if (trimmed === searchQuery) {
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

  // Merge final results judgments with Phase 2 partial judgments.
  // Phase 2 partialJudgments take precedence (they arrive after the result).
  const displayJudgments = useMemo(() => {
    const m = new Map<string, JudgmentResult>();
    for (const j of results?.judgments ?? []) {
      m.set(j.resource_url, j);
    }
    for (const [url, j] of stream.partialJudgments) {
      m.set(url, j);
    }
    return m;
  }, [results?.judgments, stream.partialJudgments]);

  const displayResults = results?.results ?? stream.partialResults;

  const displayCounts = useMemo(() => {
    if (results) return results.counts_by_source ?? { ddgs: 0, youtube: 0, openalex: 0 };
    const c: Record<string, number> = { ddgs: 0, youtube: 0, openalex: 0 };
    for (const card of stream.partialResults ?? []) {
      c[card.source] = (c[card.source] ?? 0) + 1;
    }
    return c;
  }, [results, stream.partialResults]);

  const displayTotalCount = results?.total_results ?? stream.partialResults?.length ?? 0;

  const hasContent =
    results || stream.isStreaming || stream.isEvaluating || isFetching || !!stream.partialResults;

  return (
    <div className={`w-full max-w-6xl space-y-6 ${!hasContent ? "my-auto" : ""}`}>
      <PresetHeader
        presetId={presetId}
        activePreset={activePreset}
        isPresetResolving={isPresetResolving}
        presets={presets}
        onPresetChange={setPresetId}
      />

      <SearchBox
        presetId={presetId}
        activePreset={activePreset}
        isPresetResolving={isPresetResolving}
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={handleSearch}
        isSearching={stream.isStreaming || stream.isEvaluating || isFetching}
      />

      {results && results.errors.length > 0 ? <ErrorBanner errors={results.errors} /> : null}

      {presetId && searchQuery && hasContent ? (
        <SuggestedCollectionsRail
          presetId={presetId}
          searchQuery={searchQuery}
          open={suggestedOpen}
          onOpenChange={setSuggestedOpen}
        />
      ) : null}

      {results?.generated_queries && !isFetching ? (
        <GeneratedQueriesPanel queries={results.generated_queries} />
      ) : null}

      {/* Agent animation — shown during streaming */}
      {stream.isStreaming ? (
        <AgentMorphScene
          stages={stream.stages}
          activeStage={stream.activeStage}
          isCached={stream.isCached}
        />
      ) : null}

      {/* REST fallback loading (only when SSE failed) */}
      {!stream.isStreaming && isFetching ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list is static
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {/* Results grid: shown after Phase 1 SSE completes (also during Phase 2 evaluation) */}
      {displayResults && !isFetching && !stream.isStreaming ? (
        <SearchResultsGrid
          results={displayResults}
          judgments={displayJudgments}
          counts={displayCounts}
          totalCount={displayTotalCount}
          savedUrls={savedUrls}
          evaluationIds={stream.evaluationIds}
          isNewResults={!results}
          resourceProgress={stream.resourceProgress}
          isEvaluating={stream.isEvaluating}
        />
      ) : null}

      <SelectionBar
        selectedResources={selectedResources}
        isSaveModalOpen={isSaveModalOpen}
        onSaveModalOpenChange={setIsSaveModalOpen}
        onSave={handleSaveSelected}
        isSaving={isSaving}
        onClearSelection={clearSelection}
        defaultName={searchQuery || ""}
      />
    </div>
  );
}
