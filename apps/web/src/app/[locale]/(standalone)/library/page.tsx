import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { LibraryPageClient } from "@/features/library/components/library-page-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: t("library"),
    description: "Your saved educational resources library",
  };
}

export default async function LibraryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="relative min-h-screen bg-brand-surface overflow-hidden text-brand-ink font-sans">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-16">
        <Suspense
          fallback={
            <div className="w-full h-[500px] bg-white/40 backdrop-blur-md shadow-xl rounded-[2.5rem] animate-pulse" />
          }
        >
          <LibraryPageClient />
        </Suspense>
      </main>
    </div>
  );
}
