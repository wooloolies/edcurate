import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { PresetListClient } from "@/features/presets/components/preset-list-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function PresetsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="relative min-h-screen bg-brand-surface overflow-hidden text-brand-ink font-sans">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-16">
        <div className="mx-auto w-full max-w-7xl">
          <PresetListClient />
        </div>
      </main>
    </div>
  );
}
