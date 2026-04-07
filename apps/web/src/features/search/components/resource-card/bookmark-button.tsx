"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ResourceCard } from "@/lib/api/model";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useDeleteSavedResourceEndpointApiSavedIdDelete,
  useListSavedResourcesEndpointApiSavedGet,
  useSaveResourceEndpointApiSavedPost,
} from "@/lib/api/saved-resources/saved-resources";

interface BookmarkButtonProps {
  presetId?: string;
  resource: ResourceCard;
  checked?: boolean;
  onToggleChecked?: (e: React.MouseEvent, checked: boolean) => void;
}

export function BookmarkButton({
  presetId,
  resource,
  checked,
  onToggleChecked,
}: BookmarkButtonProps) {
  const queryClient = useQueryClient();
  const { data: savedData, isFetching: isLoadingList } = useListSavedResourcesEndpointApiSavedGet();
  const { mutateAsync: saveResource, isPending: isSaving } = useSaveResourceEndpointApiSavedPost();
  const { mutateAsync: deleteResource, isPending: isDeleting } =
    useDeleteSavedResourceEndpointApiSavedIdDelete();

  const isControlled = checked !== undefined && onToggleChecked !== undefined;

  // Find if it's saved — iterate collections inside preset groups
  let savedId: string | undefined;
  if (!isControlled && presetId && savedData?.groups) {
    for (const group of savedData.groups) {
      if (group.preset_id === presetId) {
        for (const col of group.collections) {
          const found = col.items.find((item) => item.resource_url === resource.url);
          if (found) {
            savedId = found.id;
            break;
          }
        }
      }
      if (savedId) break;
    }
  }

  const [searchQuery] = useQueryState("q");
  const isSaved = isControlled ? checked : !!savedId;
  const isPending = isControlled ? false : isSaving || isDeleting || isLoadingList;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isControlled && onToggleChecked) {
      onToggleChecked(e, !isSaved);
      return;
    }

    if (!presetId) return;

    try {
      if (isSaved) {
        await deleteResource({ id: savedId! });
        toast.success("Resource removed from library");
      } else {
        await saveResource({
          data: {
            preset_id: presetId,
            search_query: searchQuery || "custom",
            resource,
          },
        });
        toast.success("Resource saved to library");
      }
      queryClient.invalidateQueries({
        queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
      });
    } catch {
      toast.error("Failed to update library");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      className={`h-8 w-8 ml-2 shrink-0 ${isSaved ? "text-primary" : "text-muted-foreground"}`}
      title={isSaved ? "Remove from Library" : "Save to Library"}
    >
      <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
    </Button>
  );
}
