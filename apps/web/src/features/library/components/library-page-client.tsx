"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Check,
  ChevronRight,
  Globe,
  Link as LinkIcon,
  Lock,
  Pencil,
  Plus,
  ScanSearch,
  Search,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArtifactList } from "@/features/library/components/artifact-list";
import { EvaluationProgressBar } from "@/features/library/components/evaluation-progress-bar";
import { GenerateArtifactDialog } from "@/features/library/components/generate-artifact-dialog";
import { useEvaluationStream } from "@/features/library/hooks/use-evaluation-stream";
import {
  buildOverviewHref,
  ResourceCardRenderer,
} from "@/features/search/components/resource-card";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useListArtifactsEndpointApiLocalizerGet } from "@/lib/api/localizer/localizer";
import type {
  CollectionGroup,
  GenerateArtifactRequestArtifactType,
  GeneratedArtifactResponse,
  SavedResourceResponse,
} from "@/lib/api/model";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useAddCustomLinkEndpointApiSavedLinkPost,
  useDeleteCollectionEndpointApiSavedCollectionsCollectionIdDelete,
  useDeleteSavedResourceEndpointApiSavedIdDelete,
  useListSavedResourcesEndpointApiSavedGet,
  useUpdateCollectionEndpointApiSavedCollectionsCollectionIdPatch,
} from "@/lib/api/saved-resources/saved-resources";
import { Link } from "@/lib/i18n/routing";

const ARTIFACT_I18N_KEY: Record<GenerateArtifactRequestArtifactType, string> = {
  quiz: "generate.artifactQuiz",
  mindmap: "generate.artifactMindmap",
  summary: "generate.artifactSummary",
  flashcards: "generate.artifactFlashcards",
  study_guide: "generate.artifactStudyGuide",
  briefing_doc: "generate.artifactBriefingDoc",
};

export function LibraryPageClient() {
  const t = useTranslations("library");
  const tSearch = useTranslations("search");
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useQueryState("preset");

  const { data: savedData, isFetching: isLoading } = useListSavedResourcesEndpointApiSavedGet();
  const { mutateAsync: addLink, isPending: isAdding } = useAddCustomLinkEndpointApiSavedLinkPost();
  const { startStream, startSingleStream, getBatchState, getSingleState } = useEvaluationStream();
  const { mutateAsync: deleteResource } = useDeleteSavedResourceEndpointApiSavedIdDelete();
  const { mutateAsync: updateCollection } =
    useUpdateCollectionEndpointApiSavedCollectionsCollectionIdPatch();
  const { mutateAsync: deleteCollection } =
    useDeleteCollectionEndpointApiSavedCollectionsCollectionIdDelete();

  const [_deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [privacyConfirm, setPrivacyConfirm] = useState<{
    collectionId: string;
    currentlyPublic: boolean;
  } | null>(null);

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
      toast.success(t("toast.linkAdded"));
      setLinkUrl("");
      setAddLinkOpenFor(null);
      invalidateLibrary();
    } catch {
      toast.error(t("toast.linkFailed"));
    }
  };

  const handleEvaluateGroup = (presetId: string, searchQuery: string) => {
    void startStream(presetId, searchQuery);
  };

  const handleEvaluateSingle = (resourceId: string) => {
    startSingleStream(resourceId);
  };

  const _handleDelete = async (resourceId: string) => {
    setDeletingIds((prev) => new Set(prev).add(resourceId));
    try {
      await deleteResource({ id: resourceId });
      invalidateLibrary();
    } catch {
      toast.error(t("toast.removeFailed"));
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
      toast.error(t("toast.updateFailed"));
    }
  };

  const handleConfirmPrivacy = async () => {
    if (!privacyConfirm) return;
    try {
      await handleUpdateCollection(privacyConfirm.collectionId, {
        is_public: !privacyConfirm.currentlyPublic,
      });
    } finally {
      setPrivacyConfirm(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteCollection({ collectionId: deleteConfirmId });
      toast.success(t("toast.deleted"));
      invalidateLibrary();
    } catch {
      toast.error(t("toast.deleteFailed"));
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent, collectionId: string) => {
    e.preventDefault();
    if (!renamingValue.trim()) return;
    await handleUpdateCollection(collectionId, { name: renamingValue.trim() });
    setRenamingCollectionId(null);
  };

  const renderCardAction = (item: SavedResourceResponse) => {
    const singleState = getSingleState(item.id);
    const isEvaluatingThis = singleState?.isStreaming ?? false;
    const singleLabel = isEvaluatingThis
      ? singleState?.stage === "rag_preparation"
        ? t("action.preparing")
        : t("action.evaluating")
      : item.evaluation_data
        ? t("action.reEvaluate")
        : t("action.evaluate");

    const resourceWithVerdict = item.evaluation_data
      ? { ...item.resource_data, verdict: item.evaluation_data.verdict }
      : item.resource_data;

    return (
      <div className="flex items-center gap-2">
        <Link
          href={buildOverviewHref(resourceWithVerdict)}
          className="rounded-full px-5 py-2 text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 whitespace-nowrap"
        >
          {tSearch("overview")}
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEvaluateSingle(item.id);
          }}
          disabled={isEvaluatingThis}
          className="inline-flex items-center justify-center rounded-full bg-brand-green px-5 py-2 text-sm font-bold text-brand-ink shadow-sm transition-all hover:bg-brand-ink hover:text-white disabled:opacity-50"
        >
          <ScanSearch className="mr-1.5 h-3 w-3" />
          {singleLabel}
        </button>
      </div>
    );
  };

  const renderCollectionGroup = (colGroup: CollectionGroup, presetId: string) => {
    const col = colGroup.collection;
    const groupKey = col.id;
    const searchQuery = col.search_query;
    const streamState = getBatchState(presetId, searchQuery);
    const isEvaluatingGroup = streamState?.isStreaming ?? false;

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
          <div className="select-none px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0"
                    aria-label={`${isOpen ? "Collapse" : "Expand"} ${col.name} collection`}
                  >
                    <ChevronRight
                      className={`h-4 w-4 text-brand-ink/40 transition-transform duration-200 ${
                        isOpen ? "rotate-90" : "rotate-0"
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {renamingCollectionId === groupKey ? (
                      <form
                        onSubmit={(e) => handleRenameSubmit(e, groupKey)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={renamingValue}
                          onChange={(e) => setRenamingValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Escape") {
                              setRenamingCollectionId(null);
                            }
                          }}
                          className="bg-transparent text-[15px] font-semibold text-brand-ink outline-none border-b-2 border-brand-green w-auto min-w-32"
                        />
                        <button
                          type="submit"
                          aria-label={t("action.save")}
                          className="shrink-0 rounded-xl p-1.5 transition-colors hover:bg-green-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <CollapsibleTrigger asChild>
                          <button type="button" className="min-w-0 text-left">
                            <h3 className="truncate text-[15px] font-semibold text-brand-ink">
                              {col.name}
                            </h3>
                          </button>
                        </CollapsibleTrigger>
                        <button
                          type="button"
                          aria-label={t("action.rename")}
                          className="shrink-0 rounded-xl p-1.5 border-2 border-white/40 bg-white/30 backdrop-blur-md shadow-sm transition-all hover:bg-white hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingValue(col.name);
                            setRenamingCollectionId(groupKey);
                          }}
                        >
                          <Pencil className="h-3 w-3 text-brand-ink" />
                        </button>
                      </>
                    )}

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label={
                            col.is_public ? t("action.makePrivate") : t("action.makePublic")
                          }
                          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-brand-ink/10 bg-white/60 px-2.5 py-1 text-[11px] font-medium text-brand-ink/50 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {col.is_public ? (
                            <Globe className="h-3 w-3 text-brand-green" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                          {col.is_public ? t("action.statusPublic") : t("action.statusPrivate")}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-48 p-2">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-brand-ink/5"
                          onClick={() => {
                            setPrivacyConfirm({
                              collectionId: groupKey,
                              currentlyPublic: col.is_public,
                            });
                          }}
                        >
                          {col.is_public ? (
                            <>
                              <Lock className="h-4 w-4" />
                              {t("action.makePrivate")}
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4" />
                              {t("action.makePublic")}
                            </>
                          )}
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <CollapsibleTrigger asChild>
                    <button type="button" className="w-full text-left">
                      <p className="mt-0.5 text-xs text-brand-ink/45">
                        {t("collection.resources", { count: colGroup.items.length })}
                        {unevaluatedCount > 0 && (
                          <span className="ml-1.5 rounded-full bg-brand-green/30 px-2 py-0.5 text-[11px] font-medium text-brand-ink/70">
                            {t("collection.unevaluated", { count: unevaluatedCount })}
                          </span>
                        )}
                      </p>
                    </button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <div role="toolbar" className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  aria-label={t("action.deleteCollection")}
                  className="rounded-full p-2 text-brand-ink/40 transition-colors hover:bg-red-50 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(groupKey);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="mx-0.5 h-5 w-px bg-brand-ink/10" />

                <button
                  type="button"
                  className="hidden sm:inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-brand-ink/60 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
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
                  {isAddLinkOpen ? t("action.cancel") : t("action.addLink")}
                </button>

                {unevaluatedCount > 0 && (
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full bg-brand-green px-3.5 py-1.5 text-xs font-medium text-brand-ink transition-all hover:bg-brand-ink hover:text-white disabled:opacity-50"
                    onClick={() => void handleEvaluateGroup(presetId, searchQuery)}
                    disabled={isEvaluatingGroup}
                  >
                    <ScanSearch className="mr-1.5 h-3 w-3" />
                    {t("action.evaluateAll", { count: unevaluatedCount })}
                  </button>
                )}

                {isMobile ? (
                  <Drawer>
                    <DrawerTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-brand-ink/70 shadow-sm transition-all hover:border-brand-green hover:shadow-[0_0_0_1px_rgba(183,255,112,0.3)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Wand2 className="mr-1 h-3.5 w-3.5 text-brand-green" />{" "}
                        {t("action.generate")}
                      </button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerTitle className="sr-only">{t("action.generate")}</DrawerTitle>
                      <div className="flex flex-col gap-1 p-4 pb-8">
                        {(
                          [
                            "quiz",
                            "mindmap",
                            "summary",
                            "flashcards",
                            "study_guide",
                            "briefing_doc",
                          ] as const
                        ).map((type) => (
                          <DrawerClose key={type} asChild>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-ink/5"
                              onClick={() =>
                                setGenerateDialog({
                                  open: true,
                                  artifactType: type,
                                  presetId,
                                  resources: colGroup.items,
                                })
                              }
                            >
                              {t(ARTIFACT_I18N_KEY[type] as "generate.artifactQuiz")}
                            </button>
                          </DrawerClose>
                        ))}
                      </div>
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-brand-ink/70 shadow-sm transition-all hover:border-brand-green hover:shadow-[0_0_0_1px_rgba(183,255,112,0.3)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Wand2 className="mr-1 h-3.5 w-3.5 text-brand-green" />{" "}
                        {t("action.generate")}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      {(
                        [
                          "quiz",
                          "mindmap",
                          "summary",
                          "flashcards",
                          "study_guide",
                          "briefing_doc",
                        ] as const
                      ).map((type) => (
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
                          {t(ARTIFACT_I18N_KEY[type] as "generate.artifactQuiz")}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
                  <Plus className="mr-1 h-3.5 w-3.5" /> {t("action.add")}
                </button>
              </form>
            )}

            {streamState?.isStreaming ? (
              <EvaluationProgressBar
                stage={streamState.stage}
                completedCount={streamState.completedCount}
                totalCount={streamState.totalCount}
              />
            ) : null}
          </div>

          <CollapsibleContent>
            <div className="border-t border-brand-ink/5 px-5 py-5">
              <div className="grid gap-4 grid-cols-1">
                {sortedItems.map((item: SavedResourceResponse, _idx: number) => (
                  <ResourceCardRenderer
                    key={item.id}
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
          <h1 className="text-4xl font-bold tracking-tight text-brand-ink">{t("title")}</h1>
          <p className="mt-2 text-[15px] text-brand-ink/50">{t("subtitle")}</p>
        </div>

        {groups.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/60 py-24 text-center backdrop-blur-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/20">
              <Bookmark className="h-8 w-8 text-brand-ink/30" />
            </div>
            <p className="text-xl font-semibold text-brand-ink">{t("empty.title")}</p>
            <p className="mt-2 max-w-sm text-sm text-brand-ink/50">{t("empty.description")}</p>
            <Link
              href="/search"
              className="mt-8 inline-flex items-center rounded-full bg-brand-green px-8 py-3 text-sm font-semibold text-brand-ink shadow-sm transition-all hover:bg-brand-ink hover:text-white hover:shadow-[0_8px_32px_rgba(183,255,112,0.3)]"
            >
              <Search className="mr-2 h-4 w-4" />
              {t("empty.startSearching")}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Glass pill tab bar */}
            <div className="flex items-center gap-3">
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

              {activePresetId ? (
                <Link
                  href={`/search?preset_id=${activePresetId}`}
                  aria-label={t("action.searchWithPreset")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/60 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all hover:bg-brand-green hover:shadow-[0_4px_16px_rgba(183,255,112,0.3)]"
                >
                  <Search className="h-4 w-4 text-brand-ink" />
                </Link>
              ) : null}
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

        <Dialog
          open={!!privacyConfirm}
          onOpenChange={(open) => {
            if (!open) setPrivacyConfirm(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {privacyConfirm?.currentlyPublic
                  ? t("confirm.makePrivateTitle")
                  : t("confirm.makePublicTitle")}
              </DialogTitle>
              <DialogDescription>
                {privacyConfirm?.currentlyPublic
                  ? t("confirm.makePrivateDescription")
                  : t("confirm.makePublicDescription")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-full px-5 py-2 text-sm font-medium text-brand-ink/60 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
                >
                  {t("action.cancel")}
                </button>
              </DialogClose>
              <button
                type="button"
                className="rounded-full bg-brand-ink px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-ink/80"
                onClick={() => void handleConfirmPrivacy()}
              >
                {privacyConfirm?.currentlyPublic
                  ? t("confirm.makePrivateButton")
                  : t("confirm.makePublicButton")}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirmId(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("confirm.deleteTitle")}</DialogTitle>
              <DialogDescription>{t("confirm.deleteDescription")}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-full px-5 py-2 text-sm font-medium text-brand-ink/60 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
                >
                  {t("action.cancel")}
                </button>
              </DialogClose>
              <button
                type="button"
                className="rounded-full bg-red-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                onClick={() => void handleConfirmDelete()}
              >
                {t("confirm.deleteButton")}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
