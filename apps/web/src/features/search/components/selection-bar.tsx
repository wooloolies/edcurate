"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { ResourceCard } from "@/lib/api/model";
import { SaveCollectionDialog } from "./save-collection-dialog";

interface SelectionBarProps {
  selectedResources: Map<string, ResourceCard>;
  isSaveModalOpen: boolean;
  onSaveModalOpenChange: (open: boolean) => void;
  onSave: (name: string, isPublic: boolean, description?: string) => Promise<void>;
  isSaving: boolean;
  onClearSelection: () => void;
  defaultName: string;
}

export function SelectionBar({
  selectedResources,
  isSaveModalOpen,
  onSaveModalOpenChange,
  onSave,
  isSaving,
  onClearSelection,
  defaultName,
}: SelectionBarProps) {
  const t = useTranslations("search");

  if (selectedResources.size === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border bg-background px-6 py-3 shadow-lg">
        <span className="text-sm font-medium">
          {t("resourcesSelected", { count: selectedResources.size })}
        </span>
        <Button size="sm" onClick={() => onSaveModalOpenChange(true)} disabled={isSaving}>
          {t("saveToLibrary")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClearSelection}
          aria-label={t("clearSelection")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <SaveCollectionDialog
        isOpen={isSaveModalOpen}
        onOpenChange={onSaveModalOpenChange}
        onSave={onSave}
        isSaving={isSaving}
        defaultName={defaultName}
      />
    </>
  );
}
