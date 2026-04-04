"use client";

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
import { ResourceCardRenderer } from "@/features/search/components/resource-card";
import { ResourceCardSkeleton } from "@/features/search/components/skeleton/resource-card-skeleton";
import { useSearchApiDiscoverySearchPost } from "@/lib/api/discovery/discovery";
import type { SearchResponse } from "@/lib/api/model";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";

export function SearchPageClient() {
  const [presetId, setPresetId] = useQueryState("preset_id");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);

  const { data: presetsData } = useListPresetsApiPresetsGet();
  const presets = presetsData?.data ?? [];

  const searchMutation = useSearchApiDiscoverySearchPost();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetId || !query.trim()) return;
    searchMutation.mutate(
      { data: { preset_id: presetId, query: query.trim() } },
      { onSuccess: (data) => setResults(data) }
    );
  };

  const counts = results?.counts_by_source ?? { ddgs: 0, youtube: 0, openalex: 0 };
  const totalCount = results?.total_results ?? 0;
  const allResults = results?.results ?? [];

  const filterBySource = (source?: string) =>
    source ? allResults.filter((r) => r.source === source) : allResults;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resource Discovery</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Select value={presetId ?? ""} onValueChange={(v) => setPresetId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a preset" />
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for educational resources..."
            className="min-w-0 flex-1"
          />
          <Button type="submit" disabled={!presetId || !query.trim() || searchMutation.isPending}>
            {searchMutation.isPending ? "Searching..." : "Search"}
          </Button>
        </form>
      </div>

      {results && results.errors.length > 0 && <ErrorBanner errors={results.errors} />}

      {searchMutation.isPending && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {results && !searchMutation.isPending && (
        <Tabs defaultValue="all">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
            <TabsTrigger value="ddgs">Web ({counts.ddgs ?? 0})</TabsTrigger>
            <TabsTrigger value="youtube">Video ({counts.youtube ?? 0})</TabsTrigger>
            <TabsTrigger value="openalex">Papers ({counts.openalex ?? 0})</TabsTrigger>
          </TabsList>

          {["all", "ddgs", "youtube", "openalex"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {filterBySource(tab === "all" ? undefined : tab).length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No results found.</p>
              ) : (
                filterBySource(tab === "all" ? undefined : tab).map((resource) => (
                  <ResourceCardRenderer key={resource.url} resource={resource} />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {!results && !searchMutation.isPending && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Select a preset and enter a search query to discover educational resources.
          </p>
        </div>
      )}
    </div>
  );
}
