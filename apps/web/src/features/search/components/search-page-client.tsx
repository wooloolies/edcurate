"use client";

import { BrainCircuit } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useSearchApiDiscoverySearchGet } from "@/lib/api/discovery/discovery";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";

export function SearchPageClient() {
  const [presetId, setPresetId] = useQueryState("preset_id");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data: presetsData } = useListPresetsApiPresetsGet();
  const presets = presetsData?.data ?? [];

  const searchEnabled = !!presetId && !!submittedQuery;
  const { data: results, isFetching } = useSearchApiDiscoverySearchGet(
    { preset_id: presetId!, query: submittedQuery },
    { query: { enabled: searchEnabled, staleTime: 3 * 60 * 1000 } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetId || !query.trim()) return;
    setSubmittedQuery(query.trim());
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
          <Button type="submit" disabled={!presetId || !query.trim() || isFetching}>
            {isFetching ? "Searching..." : "Search"}
          </Button>
        </form>
      </div>

      {results && results.errors.length > 0 ? <ErrorBanner errors={results.errors} /> : null}

      {isFetching ? (
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <BrainCircuit className="h-5 w-5 animate-pulse text-blue-600" />
            <AlertTitle className="text-blue-800">Deep Evaluation in Progress...</AlertTitle>
            <AlertDescription className="text-blue-700">
              Our AI agent is currently reading the resources, extracting content, and calculating
              pedagogical scores across multiple dimensions. This usually takes between 60 to 90
              seconds.
            </AlertDescription>
          </Alert>
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
      ) : null}

      {!results && !isFetching ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Select a preset and enter a search query to discover educational resources.
          </p>
        </div>
      ) : null}
    </div>
  );
}
