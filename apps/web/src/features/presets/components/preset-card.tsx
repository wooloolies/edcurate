"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Search, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const weights = preset.source_weights as Record<string, number>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{preset.name}</CardTitle>
            <CardDescription>
              {preset.subject} &middot; {preset.year_level} &middot; {preset.country}
            </CardDescription>
          </div>
          {!!preset.is_default && (
            <Badge variant="secondary">
              <Star className="mr-1 h-3 w-3" />
              {t("default")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 text-xs text-muted-foreground">
          {weights.ddgs != null && `${t("sources.ddgs")} ${Math.round(weights.ddgs * 100)}%`}{" "}
          &middot;{" "}
          {weights.youtube != null &&
            `${t("sources.youtube")} ${Math.round(weights.youtube * 100)}%`}{" "}
          &middot;{" "}
          {weights.openalex != null &&
            `${t("sources.openalex")} ${Math.round(weights.openalex * 100)}%`}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/collections/${preset.id}/edit`}>
              <Pencil className="mr-1 h-3 w-3" />
              {t("editPreset")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/search?preset_id=${preset.id}`}>
              <Search className="mr-1 h-3 w-3" />
              {t("searchWithPreset")}
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-8 w-8 p-0"
                aria-label={t("moreActions")}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
      </CardContent>
    </Card>
  );
}
