"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassroomScene } from "@/features/search/components/classroom/classroom-scene";
import { ErrorBanner } from "@/features/search/components/error-banner";
import { EvaluationProgress } from "@/features/search/components/evaluation-progress";
import { GeneratedQueriesPanel } from "@/features/search/components/generated-queries";
import { ResourceCardRenderer } from "@/features/search/components/resource-card";
import { ResourceCardSkeleton } from "@/features/search/components/skeleton/resource-card-skeleton";
import { useSearchStream } from "@/features/search/hooks/use-search-stream";
import { useSearchApiDiscoverySearchGet } from "@/lib/api/discovery/discovery";
import type { AdversarialReviewResult, ResourceCard } from "@/lib/api/model";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useBulkSaveResourcesEndpointApiSavedBulkPost,
  useListSavedResourcesEndpointApiSavedGet,
} from "@/lib/api/saved-resources/saved-resources";

export function SearchPageClient() {
  const t = useTranslations("search");
  const queryClient = useQueryClient();
  const [presetId, setPresetId] = useQueryState("preset_id");
  const [searchQuery, setSearchQuery] = useQueryState("q");
  const [draft, setDraft] = useState(searchQuery ?? "");

  const { data: presetsData } = useListPresetsApiPresetsGet();
  const presets = presetsData?.data ?? [];

  const { data: savedData } = useListSavedResourcesEndpointApiSavedGet();
  const { mutateAsync: bulkSave, isPending: isSaving } =
    useBulkSaveResourcesEndpointApiSavedBulkPost();
  const [selectedResources, setSelectedResources] = useState<Map<string, ResourceCard>>(new Map());

  // Build a set of already-saved URLs for the active preset
  const savedUrls = useMemo(() => {
    const urls = new Set<string>();
    if (presetId && savedData?.groups) {
      for (const group of savedData.groups) {
        if (group.preset_id === presetId) {
          for (const qGroup of group.query_groups) {
            for (const item of qGroup.items) {
              urls.add(item.resource_url);
            }
          }
        }
      }
    }
    return urls;
  }, [presetId, savedData]);

  const isChecked = (url: string) => selectedResources.has(url) || savedUrls.has(url);

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

  const handleSaveSelected = async () => {
    if (!presetId || selectedResources.size === 0) return;
    try {
      await bulkSave({
        data: {
          preset_id: presetId,
          search_query: searchQuery || "custom",
          resources: Array.from(selectedResources.values()),
        },
      });
      setSelectedResources(new Map());
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
    { query: { enabled: searchEnabled && useFallback, staleTime: 3 * 60 * 1000 } },
  );

  // SSE result is primary; REST fallback is secondary
  const results = stream.result ?? fallbackResults;

  // Track pending stream start — ensures React re-renders with updated
  // searchQuery before startStream reads it via useLatest.
  const pendingStreamRef = useRef(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetId || !draft.trim()) return;
    setSearchQuery(draft.trim());
    pendingStreamRef.current = true;
  };

  useEffect(() => {
    if (pendingStreamRef.current && searchQuery) {
      pendingStreamRef.current = false;
      stream.startStream();
    }
  }, [searchQuery, stream.startStream]);

  const counts = results?.counts_by_source ?? { ddgs: 0, youtube: 0, openalex: 0 };
  const totalCount = results?.total_results ?? 0;
  const allResults = results?.results ?? [];

  const adversarialByUrl = useMemo(() => {
    const m = new Map<string, AdversarialReviewResult | null | undefined>();
    for (const ev of results?.evaluations ?? []) {
      m.set(ev.resource_url, ev.adversarial);
    }
    return m;
  }, [results?.evaluations]);

  const [showUnscored, setShowUnscored] = useState(false);

  const filterBySource = (source?: string) =>
    source ? allResults.filter((r) => r.source === source) : allResults;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Select value={presetId ?? ""} onValueChange={(v) => setPresetId(v)}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectPreset")} />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("placeholder")}
            className="min-w-0 flex-1"
          />
          <Button type="submit" disabled={!presetId || !draft.trim() || stream.isStreaming || isFetching}>
            {stream.isStreaming || isFetching ? t("searchingButton") : t("searchButton")}
          </Button>
        </form>
      </div>

      {results && results.errors.length > 0 ? <ErrorBanner errors={results.errors} /> : null}

      {results?.generated_queries && !isFetching ? (
        <GeneratedQueriesPanel queries={results.generated_queries} />
      ) : null}

      {stream.isStreaming ? (
        <ClassroomScene
          stages={stream.stages}
          activeStage={stream.activeStage}
          isCached={stream.isCached}
        />
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

      {results && !isFetching && !stream.isStreaming ? (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              {t("tabs.all")} ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="ddgs">
              {t("tabs.web")} ({counts.ddgs ?? 0})
            </TabsTrigger>
            <TabsTrigger value="youtube">
              {t("tabs.video")} ({counts.youtube ?? 0})
            </TabsTrigger>
            <TabsTrigger value="openalex">
              {t("tabs.papers")} ({counts.openalex ?? 0})
            </TabsTrigger>
          </TabsList>

          {["all", "ddgs", "youtube", "openalex"].map((tab) => {
            const items = filterBySource(tab === "all" ? undefined : tab);
            const evaluated = items.filter((r) => r.relevance_score != null);
            const unevaluated = items.filter((r) => r.relevance_score == null);

            return (
              <TabsContent key={tab} value={tab} className="space-y-3">
                {items.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">{t("noResults")}</p>
                ) : (
                  <>
                    {evaluated.map((resource) => (
                      <ResourceCardRenderer
                        key={resource.url}
                        resource={resource}
                        adversarial={adversarialByUrl.get(resource.url)}
                        presetId={presetId ?? undefined}
                        checked={isChecked(resource.url)}
                        onToggleChecked={(_, c) => handleToggleChecked(resource, c)}
                      />
                    ))}
                    {unevaluated.length > 0 ? (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full text-muted-foreground"
                          onClick={() => setShowUnscored((prev) => !prev)}
                        >
                          {showUnscored ? (
                            <ChevronUp className="mr-2 h-4 w-4" />
                          ) : (
                            <ChevronDown className="mr-2 h-4 w-4" />
                          )}
                          {showUnscored
                            ? t("hideUnscored")
                            : t("showUnscored", { count: unevaluated.length })}
                        </Button>
                        {showUnscored ? (
                          <div className="space-y-3 pt-2">
                            {unevaluated.map((resource) => (
                              <ResourceCardRenderer
                                key={resource.url}
                                resource={resource}
                                adversarial={adversarialByUrl.get(resource.url)}
                                presetId={presetId ?? undefined}
                                checked={isChecked(resource.url)}
                                onToggleChecked={(_, c) => handleToggleChecked(resource, c)}
                              />
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      ) : null}

      {!results && !isFetching && !stream.isStreaming ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("idleState")}</p>
        </div>
      ) : null}

      {selectedResources.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border bg-background px-6 py-3 shadow-lg">
          <span className="text-sm font-medium">
            {t("resourcesSelected", { count: selectedResources.size })}
          </span>
          <Button size="sm" onClick={handleSaveSelected} disabled={isSaving}>
            {isSaving ? t("saving") : t("saveToLibrary")}
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
      )}
    </div>
  );
}
