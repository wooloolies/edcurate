"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ResourceCard } from "@/lib/api/model";
import {
  getListSavedResourcesEndpointApiSavedGetQueryKey,
  useDeleteSavedResourceEndpointApiSavedIdDelete,
  useListSavedResourcesEndpointApiSavedGet,
  useToggleSaveResourceEndpointApiSavedPost,
} from "@/lib/api/saved-resources/saved-resources";

interface BookmarkButtonProps {
  presetId: string;
  resource: ResourceCard;
}

export function BookmarkButton({ presetId, resource }: BookmarkButtonProps) {
  const queryClient = useQueryClient();
  const { data: savedData, isFetching: isLoadingList } = useListSavedResourcesEndpointApiSavedGet();
  const { mutateAsync: saveResource, isPending: isSaving } =
    useToggleSaveResourceEndpointApiSavedPost();
  const { mutateAsync: deleteResource, isPending: isDeleting } =
    useDeleteSavedResourceEndpointApiSavedIdDelete();

  // Find if it's saved
  let savedId: string | undefined;
  if (savedData?.groups) {
    for (const group of savedData.groups) {
      if (group.preset_id === presetId) {
        const found = group.items.find((item) => item.resource_url === resource.url);
        if (found) {
          savedId = found.id;
          break;
        }
      }
    }
  }

  const isSaved = !!savedId;
  const isPending = isSaving || isDeleting || isLoadingList;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isSaved) {
        await deleteResource({ id: savedId! });
        toast.success("Resource removed from library");
      } else {
        await saveResource({ data: { preset_id: presetId, resource } });
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
