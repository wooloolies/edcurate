"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Repeat } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PresetResponse } from "@/lib/api/model";
import {
  getListPresetsApiPresetsGetQueryKey,
  useUpdatePresetApiPresetsPresetIdPut,
} from "@/lib/api/presets/presets";
import { getListSavedResourcesEndpointApiSavedGetQueryKey } from "@/lib/api/saved-resources/saved-resources";

interface PresetHeaderProps {
  presetId: string | null;
  activePreset: PresetResponse | undefined;
  isPresetResolving: boolean;
  presets: PresetResponse[];
  onPresetChange: (id: string) => void;
}

export function PresetHeader({
  presetId,
  activePreset,
  isPresetResolving,
  presets,
  onPresetChange,
}: PresetHeaderProps) {
  const t = useTranslations("search");
  const queryClient = useQueryClient();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: updatePreset } = useUpdatePresetApiPresetsPresetIdPut();

  const handleStartRename = () => {
    setRenameDraft(activePreset?.name ?? "");
    setIsRenaming(true);
    requestAnimationFrame(() => renameInputRef.current?.select());
  };

  const handleConfirmRename = async () => {
    const trimmed = renameDraft.trim();
    if (!trimmed || !activePreset || !presetId) {
      setIsRenaming(false);
      return;
    }
    if (trimmed === activePreset.name) {
      setIsRenaming(false);
      return;
    }
    try {
      await updatePreset({
        presetId,
        data: {
          name: trimmed,
          subject: activePreset.subject,
          year_level: activePreset.year_level,
          country: activePreset.country,
          is_default: activePreset.is_default,
          curriculum_framework: activePreset.curriculum_framework,
          state_region: activePreset.state_region,
          city: activePreset.city,
          teaching_language: activePreset.teaching_language,
          class_size: activePreset.class_size,
          eal_d_students: activePreset.eal_d_students,
          reading_support_students: activePreset.reading_support_students,
          extension_students: activePreset.extension_students,
          student_interests: activePreset.student_interests as string[],
          language_backgrounds: activePreset.language_backgrounds as string[],
          average_reading_level: activePreset.average_reading_level,
          additional_notes: activePreset.additional_notes,
        },
      });
      queryClient.invalidateQueries({
        queryKey: getListPresetsApiPresetsGetQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getListSavedResourcesEndpointApiSavedGetQueryKey(),
      });
      toast.success(t("presetRenamed", { fallback: "Preset renamed" }));
    } catch (_e) {
      toast.error(t("presetRenameError", { fallback: "Failed to rename preset" }));
    }
    setIsRenaming(false);
  };

  return (
    <div className="flex flex-col mb-2 pl-2">
      <div className="flex items-center gap-3">
        {isRenaming ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleConfirmRename();
            }}
          >
            <input
              ref={renameInputRef}
              type="text"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={() => void handleConfirmRename()}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsRenaming(false);
              }}
              className="text-3xl font-bold text-brand-ink leading-none bg-transparent border-b-2 border-brand-green outline-none w-auto min-w-48"
            />
            <button
              type="submit"
              aria-label="Confirm rename"
              className="p-2 rounded-xl hover:bg-green-50 transition-colors cursor-pointer"
            >
              <Check className="w-5 h-5 text-green-600" />
            </button>
          </form>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-brand-ink leading-none mb-1">
              {activePreset?.name ??
                (isPresetResolving ? (
                  <span className="inline-block h-8 w-48 animate-pulse rounded-lg bg-brand-ink/10" />
                ) : (
                  t("selectCollection")
                ))}
            </h2>
            {activePreset || isPresetResolving ? (
              <button
                type="button"
                onClick={handleStartRename}
                aria-label={t("renamePreset", { fallback: "Rename preset" })}
                className="p-2 border-2 border-white/40 rounded-xl bg-white/30 backdrop-blur-md shadow-sm flex items-center justify-center shrink-0 hover:bg-white transition-all transform hover:scale-105 cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-brand-ink" aria-hidden="true" />
              </button>
            ) : null}
          </>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t("changePreset")}
              className="p-2 border-2 border-white/40 rounded-xl bg-white/30 backdrop-blur-md shadow-sm flex items-center justify-center shrink-0 hover:bg-white transition-all transform hover:scale-105 cursor-pointer"
            >
              <Repeat className="w-5 h-5 text-brand-ink stroke-[2.5]" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="flex flex-col gap-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPresetChange(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    p.id === presetId
                      ? "bg-brand-green text-brand-ink"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-lg font-medium text-brand-ink/60 mt-1 pl-1">{t("subtitle")}</p>
    </div>
  );
}
