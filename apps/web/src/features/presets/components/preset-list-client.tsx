"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { PresetCard } from "@/features/presets/components/preset-card";
import { PresetCardSkeleton } from "@/features/presets/components/skeleton/preset-card-skeleton";
import { useListPresetsApiPresetsGet } from "@/lib/api/presets/presets";
import { Link } from "@/lib/i18n/routing";

export function PresetListClient() {
  const t = useTranslations("presets");
  const { data, isPending } = useListPresetsApiPresetsGet();
  const presets = data?.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-brand-ink">{t("title")}</h1>
          <p className="mt-2 text-[15px] text-brand-ink/50">{t("subtitle")}</p>
        </div>
        <Link
          href="/collections/new"
          className="inline-flex items-center rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-brand-ink shadow-sm transition-all hover:bg-brand-ink hover:text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t("newPreset")}
        </Link>
      </div>

      {isPending ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeletons do not change order
            <PresetCardSkeleton key={i} />
          ))}
        </div>
      ) : presets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/60 py-24 text-center backdrop-blur-sm">
          <p className="text-xl font-semibold text-brand-ink">{t("emptyState")}</p>
          <Link
            href="/collections/new"
            className="mt-8 inline-flex items-center rounded-full bg-brand-green px-8 py-3 text-sm font-semibold text-brand-ink shadow-sm transition-all hover:bg-brand-ink hover:text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("createPreset")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      )}
    </div>
  );
}
