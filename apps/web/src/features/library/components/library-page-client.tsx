"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  ChevronRight,
  Globe,
  Link as LinkIcon,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ArtifactList } from "@/features/library/components/artifact-list";
import { GenerateArtifactDialog } from "@/features/library/components/generate-artifact-dialog";
import { ResourceCardRenderer } from "@/features/search/components/resource-card";
import type {
  CollectionGroup,
  GenerateArtifactRequestArtifactType,
  GeneratedArtifactResponse,
  SavedResourceResponse,
} from "@/lib/api/model";
import { useListArtifactsEndpointApiLocalizerGet } from "@/lib/api/localizer/localizer";
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
import { Link } from "@/lib/i18n/routing";

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
  const [generateDialog, setGenerateDialog] = useState<{
    open: boolean;
    artifactType: GenerateArtifactRequestArtifactType;
    presetId: string;
    resources: SavedResourceResponse[];
  } | null>(null);

  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");

  const groups = savedData?.groups ?? [];
  const activeGroup = groups.find((g) => g.preset_id === activeTab) ?? groups[0];
  const activePresetId = activeTab || activeGroup?.preset_id;

  const { data: artifactsData } = useListArtifactsEndpointApiLocalizerGet(
    { preset_id: activePresetId ?? "" },
    { query: { enabled: !!activePresetId } }
  );
  const allArtifacts = artifactsData?.artifacts ?? [];

  const getArtifactsForCollection = (colGroup: CollectionGroup): GeneratedArtifactResponse[] => {
    const resourceIds = new Set(colGroup.items.map((i) => i.id));
    return allArtifacts.filter((a) => a.source_resource_ids.some((id) => resourceIds.has(id)));
  };

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

  const handleUpdatePrivacy = async (col: { id: string; is_public: boolean }) => {
    const nextPrivacy = !col.is_public;
    if (nextPrivacy) {
      if (
        !window.confirm(
          "Are you sure you want to make this public? Anyone will be able to discover these resources."
        )
      ) {
        return;
      }
    }
    await handleUpdateCollection(col.id, { is_public: nextPrivacy });
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
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void handleEvaluateSingle(item.id);
          }}
          disabled={isEvaluatingThis}
          className="inline-flex items-center justify-center rounded-full bg-brand-green px-3.5 py-1.5 text-xs font-medium text-brand-ink transition-all hover:bg-brand-ink hover:text-white disabled:opacity-50"
        >
          <Wand2 className="mr-1.5 h-3 w-3" />
          {isEvaluatingThis ? "Evaluating..." : item.evaluation_data ? "Re-evaluate" : "Evaluate"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void handleDelete(item.id);
          }}
          disabled={isDeletingThis}
          className="inline-flex items-center justify-center self-end rounded-full p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          aria-label="Remove resource"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const renderCollectionGroup = (colGroup: CollectionGroup, presetId: string) => {
    const col = colGroup.collection;
    const groupKey = col.id;
    const searchQuery = col.search_query;
    const isEvaluatingGroup = evaluatingQueries.has(`${presetId}:${searchQuery}`);

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
        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_2px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-shadow hover:shadow-[0_4px_28px_rgba(0,0,0,0.06)]">
          {/* Collection header */}
          <div className="select-none px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${col.name} collection`}
                >
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 text-brand-ink/40 transition-transform duration-200 ${
                      isOpen ? "rotate-90" : "rotate-0"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold text-brand-ink">
                        {col.name}
                      </h3>
                      {col.is_public ? (
                        <Globe className="h-3.5 w-3.5 shrink-0 text-brand-green" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-brand-ink/25" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-brand-ink/45">
                      {colGroup.items.length} resource{colGroup.items.length === 1 ? "" : "s"}
                      {unevaluatedCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-brand-green/30 px-2 py-0.5 text-[11px] font-medium text-brand-ink/70">
                          {unevaluatedCount} unevaluated
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              </CollapsibleTrigger>

              <div role="toolbar" className="flex items-center gap-1.5">
                {renamingCollectionId === groupKey ? (
                  <form
                    onSubmit={(e) => handleRenameSubmit(e, groupKey)}
                    className="flex items-center gap-2"
                  >
                    <Input
                      className="h-8 rounded-xl border-brand-ink/10 bg-white text-sm focus-visible:ring-brand-green"
                      value={renamingValue}
                      onChange={(e) => setRenamingValue(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-brand-green px-3.5 py-1.5 text-xs font-medium text-brand-ink transition-colors hover:bg-brand-ink hover:text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-3 py-1.5 text-xs text-brand-ink/50 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
                      onClick={() => setRenamingCollectionId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-brand-ink/60 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
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
                    </button>

                    {unevaluatedCount > 0 && (
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full bg-brand-green px-3.5 py-1.5 text-xs font-medium text-brand-ink transition-all hover:bg-brand-ink hover:text-white disabled:opacity-50"
                        onClick={() => void handleEvaluateGroup(presetId, searchQuery)}
                        disabled={isEvaluatingGroup || isBatchEvaluating}
                      >
                        <Wand2 className="mr-1.5 h-3 w-3" />
                        Evaluate All ({unevaluatedCount})
                      </button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded-full p-2 text-brand-ink/40 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenamingValue(col.name);
                            setRenamingCollectionId(groupKey);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdatePrivacy(col)}>
                          {col.is_public ? (
                            <Lock className="mr-2 h-4 w-4" />
                          ) : (
                            <Globe className="mr-2 h-4 w-4" />
                          )}
                          {col.is_public ? "Make Private" : "Make Public"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-600"
                          onClick={() => handleDeleteCollection(groupKey)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Collection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-brand-ink/70 shadow-sm transition-all hover:border-brand-green hover:shadow-[0_0_0_1px_rgba(183,255,112,0.3)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5 text-brand-green" /> Generate
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    {(["quiz", "mindmap", "summary", "flashcards"] as const).map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() =>
                          setGenerateDialog({
                            open: true,
                            artifactType: type,
                            presetId,
                            resources: colGroup.items,
                          })
                        }
                      >
                        {type === "quiz"
                          ? "Quiz"
                          : type === "mindmap"
                            ? "Mind Map"
                            : type === "summary"
                              ? "Summary"
                              : "Flashcards"}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {isAddLinkOpen && (
              <form
                onSubmit={(e) => handleAddLink(e, presetId, searchQuery)}
                className="mt-4 flex gap-2"
              >
                <Input
                  className="h-9 rounded-xl border-brand-ink/10 bg-white text-sm focus-visible:ring-brand-green"
                  placeholder="https://example.com/useful-link"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  disabled={isAdding}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!linkUrl || isAdding}
                  className="inline-flex shrink-0 items-center rounded-full bg-brand-green px-4 py-2 text-xs font-medium text-brand-ink transition-all hover:bg-brand-ink hover:text-white disabled:opacity-50"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </button>
              </form>
            )}
          </div>

          <CollapsibleContent>
            <div className="border-t border-brand-ink/5 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {sortedItems.map((item: SavedResourceResponse, idx: number) => (
                  <ResourceCardRenderer
                    key={item.id}
                    index={idx}
                    resource={item.resource_data}
                    presetId={presetId}
                    customAction={renderCardAction(item)}
                  />
                ))}
              </div>
              <ArtifactList
                artifacts={getArtifactsForCollection(colGroup)}
                collectionName={col.name}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Hero header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-brand-ink md:text-5xl">
            Your Library
          </h1>
          <p className="mt-2 text-[15px] text-brand-ink/50">
            Curated resources across your teaching collections
          </p>
        </div>

        {groups.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/60 py-24 text-center backdrop-blur-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/20">
              <Bookmark className="h-8 w-8 text-brand-ink/30" />
            </div>
            <p className="text-xl font-semibold text-brand-ink">Your library is empty</p>
            <p className="mt-2 max-w-sm text-sm text-brand-ink/50">
              Save resources from your search results to build your curated collection.
            </p>
            <Link
              href="/search"
              className="mt-8 inline-flex items-center rounded-full bg-brand-green px-8 py-3 text-sm font-semibold text-brand-ink shadow-sm transition-all hover:bg-brand-ink hover:text-white hover:shadow-[0_8px_32px_rgba(183,255,112,0.3)]"
            >
              <Search className="mr-2 h-4 w-4" />
              Start Searching
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Glass pill tab bar */}
            <div className="inline-flex items-center gap-1 rounded-[2rem] border border-white/60 bg-white/60 p-1.5 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl">
              {groups.map((group) => {
                const isActive = (activeTab || activeGroup?.preset_id) === group.preset_id;
                return (
                  <button
                    key={group.preset_id}
                    type="button"
                    onClick={() => setActiveTab(group.preset_id)}
                    className={`rounded-[1.75rem] px-5 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-brand-ink text-white shadow-sm"
                        : "text-brand-ink/60 hover:bg-white/80 hover:text-brand-ink"
                    }`}
                  >
                    {group.preset_name}
                    <span
                      className={`ml-1.5 text-xs ${isActive ? "text-white/60" : "text-brand-ink/30"}`}
                    >
                      {group.collections.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active tab content */}
            {groups.map((group) => {
              const isActive = (activeTab || activeGroup?.preset_id) === group.preset_id;
              if (!isActive) return null;
              return (
                <div key={group.preset_id} className="space-y-5">
                  {group.collections.map((colGroup) =>
                    renderCollectionGroup(colGroup, group.preset_id)
                  )}
                </div>
              );
            })}
          </div>
        )}

        {generateDialog ? (
          <GenerateArtifactDialog
            open={generateDialog.open}
            onOpenChange={(open) => {
              if (!open) setGenerateDialog(null);
            }}
            artifactType={generateDialog.artifactType}
            presetId={generateDialog.presetId}
            resources={generateDialog.resources}
            onSuccess={() => setGenerateDialog(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
