"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, Plus, Wand2 } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceCardRenderer } from "@/features/search/components/resource-card";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useAddCustomLinkEndpointApiSavedLinkPost,
  useEvaluateSavedResourcesEndpointApiSavedEvaluatePost,
  useListSavedResourcesEndpointApiSavedGet,
} from "@/lib/api/saved-resources/saved-resources";

export function LibraryPageClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useQueryState("preset");
  const [linkUrl, setLinkUrl] = useState("");

  const { data: savedData, isFetching: isLoading } = useListSavedResourcesEndpointApiSavedGet();
  const { mutateAsync: addLink, isPending: isAdding } = useAddCustomLinkEndpointApiSavedLinkPost();
  const { mutateAsync: batchEvaluate, isPending: isEvaluating } =
    useEvaluateSavedResourcesEndpointApiSavedEvaluatePost();

  const groups = savedData?.groups ?? [];
  const activeGroup = groups.find((g) => g.preset_id === activeTab) ?? groups[0];

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl || !activeGroup) return;
    try {
      await addLink({ data: { preset_id: activeGroup.preset_id, url: linkUrl } });
      toast.success("Custom link added");
      setLinkUrl("");
      queryClient.invalidateQueries({
        queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
      });
    } catch {
      toast.error("Failed to add link");
    }
  };

  const handleEvaluate = async () => {
    if (!activeGroup) return;
    toast.info("Evaluation started in background...");
    try {
      const res = await batchEvaluate({ data: { preset_id: activeGroup.preset_id } });
      toast.success(`Batch evaluation completed: ${res.processed} evaluated.`);
      queryClient.invalidateQueries({
        queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
      });
    } catch {
      toast.error("Failed to evaluate resources");
    }
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
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <TabsList className="mb-2 md:mb-4 overflow-x-auto max-w-full">
              {groups.map((group) => (
                <TabsTrigger key={group.preset_id} value={group.preset_id}>
                  {group.preset_name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEvaluate}
                disabled={isEvaluating || !activeGroup}
                className="w-full md:w-auto shrink-0"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Evaluate All
              </Button>
            </div>
          </div>

          {groups.map((group) => (
            <TabsContent key={group.preset_id} value={group.preset_id} className="space-y-6">
              <form onSubmit={handleAddLink} className="flex gap-2 w-full max-w-md">
                <Input
                  placeholder="https://example.com/useful-link"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  disabled={isAdding}
                />
                <Button type="submit" disabled={!linkUrl || isAdding}>
                  <Plus className="mr-2 h-4 w-4" /> Add Link
                </Button>
              </form>

              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {group.items.map((item) => (
                  <ResourceCardRenderer
                    key={item.id}
                    resource={item.resource_data}
                    adversarial={item.evaluation_data?.adversarial}
                    presetId={group.preset_id}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
