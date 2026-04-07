"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenerateArtifactEndpointApiLocalizerGeneratePost } from "@/lib/api/localizer/localizer";
import type { GenerateArtifactRequestArtifactType, SavedResourceResponse } from "@/lib/api/model";

const ARTIFACT_LABELS: Record<GenerateArtifactRequestArtifactType, string> = {
  quiz: "Quiz",
  mindmap: "Mind Map",
  summary: "Summary",
  flashcards: "Flashcards",
};

const MAX_SELECTED_RESOURCES = 10;

interface GenerateArtifactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifactType: GenerateArtifactRequestArtifactType;
  presetId: string;
  resources: SavedResourceResponse[];
  onSuccess: (artifact: {
    id: string;
    artifact_type: string;
    content: Record<string, unknown>;
  }) => void;
}

export function GenerateArtifactDialog({
  open,
  onOpenChange,
  artifactType,
  presetId,
  resources,
  onSuccess,
}: GenerateArtifactDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(resources.slice(0, MAX_SELECTED_RESOURCES).map((r) => r.id))
  );

  const { mutateAsync: generate, isPending } =
    useGenerateArtifactEndpointApiLocalizerGeneratePost();

  const toggleResource = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECTED_RESOURCES) {
          toast.error(`Select up to ${MAX_SELECTED_RESOURCES} resources`);
          return next;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error("Select at least one resource");
      return;
    }
    try {
      const result = await generate({
        data: {
          preset_id: presetId,
          saved_resource_ids: ids,
          artifact_type: artifactType,
        },
      });
      toast.success(`${ARTIFACT_LABELS[artifactType]} generated successfully`);
      onSuccess(result);
      onOpenChange(false);
    } catch {
      toast.error(`Failed to generate ${ARTIFACT_LABELS[artifactType].toLowerCase()}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate {ARTIFACT_LABELS[artifactType]}
          </DialogTitle>
          <DialogDescription>
            Select resources to generate a {ARTIFACT_LABELS[artifactType].toLowerCase()} from.
            {resources.length > MAX_SELECTED_RESOURCES
              ? ` Up to ${MAX_SELECTED_RESOURCES} resources can be selected.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto py-2">
          {resources.map((r) => {
            const title = r.resource_data.title;
            return (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(r.id)}
                  onChange={() => toggleResource(r.id)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="min-w-0 flex-1 truncate text-sm">{title || r.resource_url}</span>
              </label>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isPending || selectedIds.size === 0}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating from {selectedIds.size} resource{selectedIds.size !== 1 ? "s" : ""}...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate ({selectedIds.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
