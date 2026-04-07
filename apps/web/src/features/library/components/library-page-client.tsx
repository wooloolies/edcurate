"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  ChevronDown,
  Globe,
  Link as LinkIcon,
  Lock,
  MessageCircleQuestion,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceCardRenderer } from "@/features/search/components/resource-card";
import type {
  CollectionGroup,
  ResourceCard,
  SavedResourceResponse,
} from "@/lib/api/model";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useAddCustomLinkEndpointApiSavedLinkPost,
  useDeleteCollectionEndpointApiSavedCollectionsCollectionIdDelete,
  useDeleteSavedResourceEndpointApiSavedIdDelete,
  useEvaluateSavedResourcesEndpointApiSavedEvaluatePost,
  useEvaluateSingleResourceEndpointApiSavedEvaluateSinglePost,
  useListSavedResourcesEndpointApiSavedGet,
  useUpdateCollectionEndpointApiSavedCollectionsCollectionIdPatch,
} from "@/lib/api/saved-resources/saved-resources";

export function LibraryPageClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useQueryState("preset");

  const { data: savedData, isFetching: isLoading } = useListSavedResourcesEndpointApiSavedGet();
  const { mutateAsync: addLink, isPending: isAdding } = useAddCustomLinkEndpointApiSavedLinkPost();
  const { mutateAsync: batchEvaluate, isPending: isBatchEvaluating } =
    useEvaluateSavedResourcesEndpointApiSavedEvaluatePost();
  const { mutateAsync: evaluateSingle } =
    useEvaluateSingleResourceEndpointApiSavedEvaluateSinglePost();
  const { mutateAsync: deleteResource } = useDeleteSavedResourceEndpointApiSavedIdDelete();
  const { mutateAsync: updateCollection } =
    useUpdateCollectionEndpointApiSavedCollectionsCollectionIdPatch();
  const { mutateAsync: deleteCollection } =
    useDeleteCollectionEndpointApiSavedCollectionsCollectionIdDelete();

  const [evaluatingIds, setEvaluatingIds] = useState<Set<string>>(new Set());
  const [evaluatingQueries, setEvaluatingQueries] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());
  const [addLinkOpenFor, setAddLinkOpenFor] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");

  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");

  const groups = savedData?.groups ?? [];
  const activeGroup = groups.find((g) => g.preset_id === activeTab) ?? groups[0];

  const invalidateLibrary = () =>
    queryClient.invalidateQueries({
      queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
    });

  const toggleGroup = (key: string) => {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isGroupOpen = (key: string) => !closedGroups.has(key);

  const handleAddLink = async (e: React.FormEvent, presetId: string, searchQuery: string) => {
    e.preventDefault();
    if (!linkUrl) return;
    try {
      await addLink({ data: { preset_id: presetId, search_query: searchQuery, url: linkUrl } });
      toast.success("Custom link added");
      setLinkUrl("");
      setAddLinkOpenFor(null);
      invalidateLibrary();
    } catch {
      toast.error("Failed to add link");
    }
  };

  const handleEvaluateGroup = async (presetId: string, searchQuery: string) => {
    const key = `${presetId}:${searchQuery}`;
    setEvaluatingQueries((prev) => new Set(prev).add(key));
    toast.info("Evaluation started in background...");
    try {
      const res = await batchEvaluate({
        data: { preset_id: presetId, search_query: searchQuery },
      });
      toast.success(`Batch evaluation completed: ${res.processed} evaluated.`);
      invalidateLibrary();
    } catch {
      toast.error("Failed to evaluate resources");
    } finally {
      setEvaluatingQueries((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleEvaluateSingle = async (resourceId: string) => {
    setEvaluatingIds((prev) => new Set(prev).add(resourceId));
    try {
      await evaluateSingle({ data: { saved_resource_id: resourceId } });
      invalidateLibrary();
    } catch {
      toast.error("Failed to evaluate resource");
    } finally {
      setEvaluatingIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  const handleDelete = async (resourceId: string) => {
    setDeletingIds((prev) => new Set(prev).add(resourceId));
    try {
      await deleteResource({ id: resourceId });
      invalidateLibrary();
    } catch {
      toast.error("Failed to remove resource");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  const handleUpdateCollection = async (
    collectionId: string,
    updates: { name?: string; is_public?: boolean }
  ) => {
    try {
      await updateCollection({ collectionId, data: updates });
      toast.success("Collection updated");
      invalidateLibrary();
    } catch {
      toast.error("Failed to update collection");
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!window.confirm("Are you sure you want to delete this collection and all its resources?"))
      return;
    try {
      await deleteCollection({ collectionId });
      toast.success("Collection deleted");
      invalidateLibrary();
    } catch {
      toast.error("Failed to delete collection");
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent, collectionId: string) => {
    e.preventDefault();
    if (!renamingValue.trim()) return;
    await handleUpdateCollection(collectionId, { name: renamingValue.trim() });
    setRenamingCollectionId(null);
  };

  const renderCardAction = (item: SavedResourceResponse) => {
    const isEvaluatingThis = evaluatingIds.has(item.id);
    const isDeletingThis = deletingIds.has(item.id);
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void handleEvaluateSingle(item.id);
          }}
          disabled={isEvaluatingThis}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          {isEvaluatingThis ? "Evaluating..." : item.evaluation_data ? "Re-evaluate" : "Evaluate"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void handleDelete(item.id);
          }}
          disabled={isDeletingThis}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 self-end"
          aria-label="Remove resource"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderCollectionGroup = (colGroup: CollectionGroup, presetId: string) => {
    const col = colGroup.collection;
    const groupKey = col.id;
    const searchQuery = col.search_query;
    const isEvaluatingGroup = evaluatingQueries.has(`${presetId}:${searchQuery}`);

    // Sort logic: Unevaluated first (recent on top), then Evaluated (use_it → adapt_it → skip_it)
    const _VERDICT_ORDER: Record<string, number> = { use_it: 0, adapt_it: 1, skip_it: 2 };
    const unevaluated = colGroup.items.filter((i) => !i.evaluation_data);
    const evaluated = colGroup.items.filter((i) => !!i.evaluation_data);
    unevaluated.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
    evaluated.sort(
      (a, b) =>
        (_VERDICT_ORDER[a.evaluation_data?.verdict ?? ""] ?? 3) -
        (_VERDICT_ORDER[b.evaluation_data?.verdict ?? ""] ?? 3)
    );
    const sortedItems = [...unevaluated, ...evaluated] as typeof colGroup.items;

    const unevaluatedCount = unevaluated.length;
    const isOpen = isGroupOpen(groupKey);
    const isAddLinkOpen = addLinkOpenFor === groupKey;

    return (
      <Collapsible key={groupKey} open={isOpen} onOpenChange={() => toggleGroup(groupKey)}>
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 py-3 border-b select-none">
            <div className="flex items-center justify-between gap-2">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${col.name} collection`}
                >
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  <MessageCircleQuestion className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-medium">{col.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    ({colGroup.items.length} resource{colGroup.items.length === 1 ? "" : "s"}
                    {unevaluatedCount > 0 ? `, ${unevaluatedCount} unevaluated` : ""})
                  </span>
                  {col.is_public ? (
                    <span title="Public">
                      <Globe className="h-3.5 w-3.5 text-green-500" />
                    </span>
                  ) : (
                    <span title="Private">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>

              <div role="toolbar" className="flex items-center gap-2">
                {renamingCollectionId === groupKey ? (
                  <form onSubmit={(e) => handleRenameSubmit(e, groupKey)} className="flex gap-2">
                    <Input
                      className="h-8 text-sm"
                      value={renamingValue}
                      onChange={(e) => setRenamingValue(e.target.value)}
                      autoFocus
                    />
                    <Button size="sm" type="submit" className="h-8">
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => setRenamingCollectionId(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAddLinkOpen) {
                          setAddLinkOpenFor(null);
                          setLinkUrl("");
                        } else {
                          setAddLinkOpenFor(groupKey);
                        }
                      }}
                    >
                      {isAddLinkOpen ? (
                        <X className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <LinkIcon className="mr-1 h-3.5 w-3.5" />
                      )}
                      {isAddLinkOpen ? "Cancel" : "Add Link"}
                    </Button>

                    {unevaluatedCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => void handleEvaluateGroup(presetId, searchQuery)}
                        disabled={isEvaluatingGroup || isBatchEvaluating}
                      >
                        <Wand2 className="mr-2 h-3.5 w-3.5" />
                        Evaluate All ({unevaluatedCount})
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenamingValue(col.name);
                            setRenamingCollectionId(groupKey);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateCollection(groupKey, { is_public: !col.is_public })
                          }
                        >
                          {col.is_public ? (
                            <Lock className="mr-2 h-4 w-4" />
                          ) : (
                            <Globe className="mr-2 h-4 w-4" />
                          )}
                          {col.is_public ? "Make Private" : "Make Public"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteCollection(groupKey)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Collection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>

            {/* Inline add-link form */}
            {isAddLinkOpen && (
              <form
                onSubmit={(e) => handleAddLink(e, presetId, searchQuery)}
                className="mt-3 flex gap-2"
              >
                <Input
                  className="h-8 text-sm"
                  placeholder="https://example.com/useful-link"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  disabled={isAdding}
                  autoFocus
                />
                <Button
                  size="sm"
                  type="submit"
                  disabled={!linkUrl || isAdding}
                  className="h-8 shrink-0"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </form>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="p-4 grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {sortedItems.map((item: SavedResourceResponse) => (
                <ResourceCardRenderer
                  key={item.id}
                  resource={item.resource_data}
                  judgment={item.evaluation_data ?? undefined}
                  presetId={presetId}
                  customAction={renderCardAction(item)}
                />
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
      </div>

      {groups.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <Bookmark className="mb-4 h-12 w-12 opacity-20" />
          <p className="text-lg">Your library is empty.</p>
          <p className="mt-2 text-sm">Save resources from your search results to see them here.</p>
        </div>
      ) : (
        <Tabs
          value={activeTab || (activeGroup?.preset_id ?? "")}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="border-b pb-4 mb-6">
            <TabsList className="overflow-x-auto max-w-full">
              {groups.map((group) => (
                <TabsTrigger key={group.preset_id} value={group.preset_id}>
                  {group.preset_name}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({group.collections.length})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {groups.map((group) => (
            <TabsContent key={group.preset_id} value={group.preset_id} className="space-y-4">
              {group.collections.map((colGroup) =>
                renderCollectionGroup(colGroup, group.preset_id)
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
