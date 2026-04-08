import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { PresetFormClient } from "@/features/presets/components/preset-form-client";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPresetPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  return (
    <div className="relative min-h-screen bg-brand-surface overflow-hidden text-brand-ink font-sans">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-16">
        <PresetFormClient presetId={id} />
      </main>
    </div>
  );
}
