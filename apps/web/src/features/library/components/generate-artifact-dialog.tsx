"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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

const ARTIFACT_LABEL_KEYS: Record<GenerateArtifactRequestArtifactType, string> = {
  quiz: "artifactQuiz",
  mindmap: "artifactMindmap",
  summary: "artifactSummary",
  flashcards: "artifactFlashcards",
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
  const t = useTranslations("library.generate");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(resources.slice(0, MAX_SELECTED_RESOURCES).map((r) => r.id))
  );

  const { mutateAsync: generate, isPending } =
    useGenerateArtifactEndpointApiLocalizerGeneratePost();

  const artifactLabel = t(ARTIFACT_LABEL_KEYS[artifactType]);

  const toggleResource = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECTED_RESOURCES) {
          toast.error(t("selectUpTo", { max: MAX_SELECTED_RESOURCES }));
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
      toast.error(t("selectAtLeast"));
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
      toast.success(t("success", { artifactType: artifactLabel }));
      onSuccess(result);
      onOpenChange(false);
    } catch {
      toast.error(t("error", { artifactType: artifactLabel }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("title", { artifactType: artifactLabel })}
          </DialogTitle>
          <DialogDescription>
            {t("description", { artifactType: artifactLabel })}
            {resources.length > MAX_SELECTED_RESOURCES
              ? ` ${t("descriptionMax", { max: MAX_SELECTED_RESOURCES })}`
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
            {t("cancel")}
          </Button>
          <Button onClick={handleGenerate} disabled={isPending || selectedIds.size === 0}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("generating", { count: selectedIds.size })}
              </>
            ) : (
              t("button", { count: selectedIds.size })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
