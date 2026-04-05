import { PresetCardSkeleton } from "@/features/presets/components/skeleton/preset-card-skeleton";

export default function PresetsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items do not change order
          <PresetCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
