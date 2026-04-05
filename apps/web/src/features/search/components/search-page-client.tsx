"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useState } from "react";

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
import { ErrorBanner } from "@/features/search/components/error-banner";
import { EvaluationProgress } from "@/features/search/components/evaluation-progress";
import { ResourceCardRenderer } from "@/features/search/components/resource-card";
import { ResourceCardSkeleton } from "@/features/search/components/skeleton/resource-card-skeleton";
import { useSearchApiDiscoverySearchGet } from "@/lib/api/discovery/discovery";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";

export function SearchPageClient() {
  const t = useTranslations("search");
  const [presetId, setPresetId] = useQueryState("preset_id");
  const [searchQuery, setSearchQuery] = useQueryState("q");
  const [draft, setDraft] = useState(searchQuery ?? "");

  const { data: presetsData } = useListPresetsApiPresetsGet();
  const presets = presetsData?.data ?? [];

  const searchEnabled = !!presetId && !!searchQuery;
  const { data: results, isFetching } = useSearchApiDiscoverySearchGet(
    { preset_id: presetId!, query: searchQuery! },
    { query: { enabled: searchEnabled, staleTime: 3 * 60 * 1000 } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetId || !draft.trim()) return;
    setSearchQuery(draft.trim());
  };

  const counts = results?.counts_by_source ?? { ddgs: 0, youtube: 0, openalex: 0 };
  const totalCount = results?.total_results ?? 0;
  const allResults = results?.results ?? [];

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
          <Button type="submit" disabled={!presetId || !draft.trim() || isFetching}>
            {isFetching ? t("searchingButton") : t("searchButton")}
          </Button>
        </form>
      </div>

      {results && results.errors.length > 0 ? <ErrorBanner errors={results.errors} /> : null}

      {isFetching ? (
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

      {results && !isFetching ? (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">{t("tabs.all")} ({totalCount})</TabsTrigger>
            <TabsTrigger value="ddgs">{t("tabs.web")} ({counts.ddgs ?? 0})</TabsTrigger>
            <TabsTrigger value="youtube">{t("tabs.video")} ({counts.youtube ?? 0})</TabsTrigger>
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
                      <ResourceCardRenderer key={resource.url} resource={resource} />
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
                        {showUnscored
                          ? unevaluated.map((resource) => (
                              <ResourceCardRenderer key={resource.url} resource={resource} />
                            ))
                          : null}
                      </>
                    ) : null}
                  </>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      ) : null}

      {!results && !isFetching ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("idleState")}</p>
        </div>
      ) : null}
    </div>
  );
}
