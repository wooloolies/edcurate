"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResourceCardRenderer } from "@/features/search/components/resource-card";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useCloneCollectionEndpointApiSavedCollectionsCollectionIdClonePost,
  useGetSuggestedCollectionsEndpointApiSavedSuggestedGet,
  useSyncClonedCollectionEndpointApiSavedCollectionsCollectionIdSyncPost,
} from "@/lib/api/saved-resources/saved-resources";

export function SuggestedCollectionsRail({
  presetId,
  searchQuery,
}: {
  presetId: string;
  searchQuery: string;
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

  if (isFetching || !suggestions || suggestions.length === 0) {
    return null;
  }

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
    <>
      <Card className="border-dashed bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t("suggestedCollections.title", { fallback: "Suggested Collections" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="pr-4 max-h-150">
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const item = suggestion.collection;
                const isCloned = clonedIds.has(item.id) || suggestion.is_cloned_by_user;

                return (
                  <button
                    type="button"
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm hover:border-primary/50 cursor-pointer transition-colors text-left w-full"
                    onClick={() => setSelectedColId(item.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm line-clamp-2">{item.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {item.search_query}
                        </span>
                        {suggestion.publisher_name ? (
                          <span className="text-xs text-muted-foreground">
                            Published by{" "}
                            <span className="font-medium">{suggestion.publisher_name}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {t("suggestedCollections.sourcesCount", {
                            count: suggestion.resources_count || 0,
                            fallback: `${suggestion.resources_count || 0} sources`,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("suggestedCollections.clonesCount", {
                            count: item.clone_count,
                            fallback: `${item.clone_count} clones`,
                          })}
                        </span>
                      </div>
                      {isCloned ? (
                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                          <Check className="h-3 w-3" />
                          {t("suggestedCollections.cloned", { fallback: "Cloned" })}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedColId} onOpenChange={(open) => !open && setSelectedColId(null)}>
        {selectedSuggestion &&
          (() => {
            const item = selectedSuggestion.collection;
            const isCloned = clonedIds.has(item.id) || selectedSuggestion.is_cloned_by_user;

            return (
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{item.name}</DialogTitle>
                  <DialogDescription>
                    {t("suggestedCollections.previewDescription", {
                      fallback: "Collection Details",
                    })}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm">Target Query</span>
                    <p className="text-sm text-muted-foreground">{item.search_query}</p>
                  </div>
                  {selectedSuggestion.publisher_name ? (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm">Published by</span>
                      <p className="text-sm text-muted-foreground">
                        {selectedSuggestion.publisher_name}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{selectedSuggestion.resources_count || 0}</span>{" "}
                      sources
                    </div>
                    <div>
                      <span className="font-medium">{item.clone_count}</span> clones
                    </div>
                  </div>
                  {selectedSuggestion.resources && selectedSuggestion.resources.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-sm">Resources</span>
                      <ScrollArea className="max-h-96">
                        <div className="space-y-3 pr-2">
                          {selectedSuggestion.resources.map((savedResource) => (
                            <ResourceCardRenderer
                              key={savedResource.id}
                              resource={savedResource.resource_data}
                              judgment={savedResource.evaluation_data ?? undefined}
                              hideAction
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedColId(null)}>
                    {t("cancel", { fallback: "Cancel" })}
                  </Button>
                  {isCloned ? (
                    <Button
                      onClick={() => handleSync(item.id)}
                      disabled={syncedIds.has(item.id) || isSyncing}
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      {syncedIds.has(item.id)
                        ? t("suggestedCollections.syncSuccess", { fallback: "Synced" })
                        : t("suggestedCollections.syncCollection", { fallback: "Sync Collection" })}
                    </Button>
                  ) : (
                    <Button onClick={() => handleClone(item.id)}>
                      <Copy className="mr-1.5 h-4 w-4" />
                      {t("suggestedCollections.cloneCollection", { fallback: "Clone Collection" })}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            );
          })()}
      </Dialog>
    </>
  );
}
