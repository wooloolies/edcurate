import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { PresetCardSkeleton } from "@/features/presets/components/skeleton/preset-card-skeleton";

export default function PresetsLoading() {
  return (
    <div className="relative min-h-screen bg-[#F8F9FA] overflow-hidden text-[#111827] font-sans">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 flex min-h-screen flex-col px-4 pt-32 pb-16">
        <div className="mx-auto w-full max-w-7xl space-y-6">
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
      </main>
    </div>
  );
}
