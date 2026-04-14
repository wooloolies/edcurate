"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
  RefreshCw,
  Users,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  buildOverviewHref,
  ResourceCardRenderer,
} from "@/features/search/components/resource-card";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useCloneCollectionEndpointApiSavedCollectionsCollectionIdClonePost,
  useGetSuggestedCollectionsEndpointApiSavedSuggestedGet,
  useSyncClonedCollectionEndpointApiSavedCollectionsCollectionIdSyncPost,
} from "@/lib/api/saved-resources/saved-resources";
import { Link } from "@/lib/i18n/routing";

export function SuggestedCollectionsRail({
  presetId,
  searchQuery,
  open,
  onOpenChange,
}: {
  presetId: string;
  searchQuery: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("search");
  const queryClient = useQueryClient();
  const [clonedIds, setClonedIds] = useState<Set<string>>(new Set());
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());

  const { data: suggestions, isFetching } = useGetSuggestedCollectionsEndpointApiSavedSuggestedGet(
    { preset_id: presetId, search_query: searchQuery, limit: 5 },
    { query: { enabled: !!presetId && !!searchQuery, gcTime: 0 } }
  );

  const { mutateAsync: cloneCollection } =
    useCloneCollectionEndpointApiSavedCollectionsCollectionIdClonePost();

  const { mutateAsync: syncCollection, isPending: isSyncing } =
    useSyncClonedCollectionEndpointApiSavedCollectionsCollectionIdSyncPost();

  const [selectedColId, setSelectedColId] = useState<string | null>(null);

  if (isFetching || !suggestions || suggestions.length === 0) return null;

  const handleClone = async (collectionId: string) => {
    try {
      await cloneCollection({ collectionId });
      setClonedIds((prev) => new Set(prev).add(collectionId));
      toast.success(t("savedSuccess"));

      // Invalidate saved resources to update library
      queryClient.invalidateQueries({
        queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
      });
      setSelectedColId(null);
    } catch (_e: unknown) {
      toast.error(t("savedError"));
    }
  };

  const handleSync = async (collectionId: string) => {
    try {
      await syncCollection({ collectionId });
      setSyncedIds((prev) => new Set(prev).add(collectionId));
      toast.success(t("suggestedCollections.syncSuccess", { fallback: "Collection synced!" }));

      // Invalidate saved resources to update library
      queryClient.invalidateQueries({
        queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
      });
    } catch (_e: unknown) {
      toast.error(t("savedError"));
    }
  };

  const selectedSuggestion = suggestions.find((s) => s.collection.id === selectedColId);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50">
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
        {t("suggestedCollections.title", { fallback: "Suggested Collections" })}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {suggestions.map((suggestion) => {
            const item = suggestion.collection;
            const isCloned = clonedIds.has(item.id) || suggestion.is_cloned_by_user;

            return (
              <button
                type="button"
                key={item.id}
                className="flex flex-col gap-2.5 rounded-lg border bg-card p-3 shadow-sm hover:border-primary/50 cursor-pointer transition-colors text-left shrink-0 w-64"
                onClick={() => setSelectedColId(item.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm line-clamp-2">{item.name}</span>
                  {isCloned ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium shrink-0">
                      <Check className="h-3 w-3" />
                      {t("suggestedCollections.cloned")}
                    </span>
                  ) : null}
                </div>
                {item.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                ) : null}
                {suggestion.publisher_name ? (
                  <span className="text-xs text-muted-foreground">
                    Published by <span className="font-medium">{suggestion.publisher_name}</span>
                  </span>
                ) : null}
                <div className="flex items-center gap-3 mt-auto text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span className="font-medium">{suggestion.resources_count || 0}</span> sources
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">{item.clone_count}</span> copies
                  </div>
                </div>
                {item.created_at ? (
                  <span className="text-xs text-muted-foreground">
                    {DateTime.fromISO(item.created_at).toRelative()}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Dialog open={!!selectedColId} onOpenChange={(open) => !open && setSelectedColId(null)}>
          {selectedSuggestion &&
            (() => {
              const item = selectedSuggestion.collection;
              const isCloned = clonedIds.has(item.id) || selectedSuggestion.is_cloned_by_user;
              const needsSync =
                isCloned && !syncedIds.has(item.id) && selectedSuggestion.needs_sync;

              return (
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <DialogTitle>{item.name}</DialogTitle>
                      {isCloned ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                          <Check className="h-3 w-3" />
                          {t("suggestedCollections.alreadyInLibrary")}
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    ) : (
                      <DialogDescription>
                        {t("suggestedCollections.previewDescription", {
                          fallback: "Collection Details",
                        })}
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm flex items-center gap-1.5">
                          Target Query
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-56">
                                <p>
                                  The original search query used when this collection was created.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <p className="text-sm text-muted-foreground">{item.search_query}</p>
                      </div>
                      {selectedSuggestion.publisher_name ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            Published by
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-56">
                                  <p>
                                    The educator who created and shared this collection publicly.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {selectedSuggestion.publisher_name}
                          </p>
                        </div>
                      ) : null}
                      {item.created_at ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            Created
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-56">
                                  <p>When this collection was first created and saved.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {DateTime.fromISO(item.created_at).toRelative()}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {selectedSuggestion.resources_count || 0}
                        </span>{" "}
                        sources
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium">{item.clone_count}</span> copies
                      </div>
                    </div>
                    {selectedSuggestion.resources && selectedSuggestion.resources.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-sm">Resources</span>
                        <ScrollArea className="max-h-96">
                          <div className="space-y-3 pr-2">
                            {selectedSuggestion.resources.map((savedResource, i) => {
                              const resWithVerdict = savedResource.evaluation_data
                                ? {
                                    ...savedResource.resource_data,
                                    verdict: savedResource.evaluation_data.verdict,
                                  }
                                : savedResource.resource_data;
                              return (
                                <ResourceCardRenderer
                                  key={savedResource.id}
                                  index={i + 1}
                                  resource={resWithVerdict}
                                  customAction={
                                    savedResource.evaluation_id ? (
                                      <Link
                                        href={buildOverviewHref(savedResource.evaluation_id)}
                                        className="rounded-full px-5 py-2 text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 whitespace-nowrap"
                                      >
                                        {t("overview")}
                                      </Link>
                                    ) : undefined
                                  }
                                />
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedColId(null)}>
                      <ArrowLeft className="mr-1.5 h-4 w-4" />
                      {t("back", { fallback: "Back" })}
                    </Button>
                    {isCloned ? (
                      needsSync ? (
                        <Button onClick={() => handleSync(item.id)} disabled={isSyncing}>
                          <RefreshCw className="mr-1.5 h-4 w-4" />
                          {t("suggestedCollections.syncCollection", {
                            fallback: "Update my collection",
                          })}
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          <Check className="mr-1.5 h-4 w-4" />
                          {t("suggestedCollections.upToDate", {
                            fallback: "Up to date",
                          })}
                        </Button>
                      )
                    ) : (
                      <Button onClick={() => handleClone(item.id)}>
                        <Copy className="mr-1.5 h-4 w-4" />
                        {t("suggestedCollections.cloneCollection", {
                          fallback: "Copy to my Library",
                        })}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              );
            })()}
        </Dialog>
      </CollapsibleContent>
    </Collapsible>
  );
}
