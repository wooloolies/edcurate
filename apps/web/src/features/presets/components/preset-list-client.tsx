"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PresetCard } from "@/features/presets/components/preset-card";
import { PresetCardSkeleton } from "@/features/presets/components/skeleton/preset-card-skeleton";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";
import { Link } from "@/lib/i18n/routing";

export function PresetListClient() {
  const t = useTranslations("presets");
  const { data, isPending } = useListPresetsApiPresetsGet();
  const presets = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/collections/new">
            <Plus className="mr-1 h-4 w-4" />
            {t("newPreset")}
          </Link>
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeletons do not change order
            <PresetCardSkeleton key={i} />
          ))}
        </div>
      ) : presets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("emptyState")}</p>
          <Button className="mt-4" asChild>
            <Link href="/collections/new">
              <Plus className="mr-1 h-4 w-4" />
              {t("createPreset")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      )}
    </div>
  );
}
