"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Search, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PresetResponse } from "@/lib/api/model";
import {
  useDeletePresetApiPresetsPresetIdDelete,
  useSetDefaultPresetApiPresetsPresetIdDefaultPatch,
} from "@/lib/api/presets/presets";
import { Link } from "@/lib/i18n/routing";

interface PresetCardProps {
  preset: PresetResponse;
}

export function PresetCard({ preset }: PresetCardProps) {
  const t = useTranslations("presets");
  const queryClient = useQueryClient();
  const deleteMutation = useDeletePresetApiPresetsPresetIdDelete();
  const setDefaultMutation = useSetDefaultPresetApiPresetsPresetIdDefaultPatch();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["listPresetsApiPresetsGet"] });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_2px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-shadow hover:shadow-[0_4px_28px_rgba(0,0,0,0.06)]">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-[15px] font-semibold text-brand-ink">{preset.name}</h3>
            <p className="text-xs text-brand-ink/45">
              {preset.subject} &middot; {preset.year_level} &middot; {preset.country}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!!preset.is_default && (
              <Badge variant="secondary">
                <Star className="mr-1 h-3 w-3" />
                {t("default")}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full p-1.5 text-brand-ink/40 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
                  aria-label={t("moreActions")}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {!preset.is_default && (
                  <DropdownMenuItem
                    onClick={() =>
                      setDefaultMutation.mutate({ presetId: preset.id }, { onSuccess: invalidate })
                    }
                  >
                    {t("setDefault")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    deleteMutation.mutate({ presetId: preset.id }, { onSuccess: invalidate })
                  }
                >
                  {t("deletePreset")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-center gap-2">
          <Link
            href={`/collections/${preset.id}/edit`}
            className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium text-brand-ink/60 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
          >
            <Pencil className="mr-1.5 h-3 w-3" />
            {t("editPreset")}
          </Link>
          <Link
            href={`/search?collection_id=${preset.id}`}
            className="inline-flex items-center rounded-full bg-brand-green px-3.5 py-1.5 text-xs font-medium text-brand-ink transition-all hover:bg-brand-ink hover:text-white"
          >
            <Search className="mr-1.5 h-3 w-3" />
            {t("searchWithPreset")}
          </Link>
        </div>
      </div>
    </div>
  );
}
