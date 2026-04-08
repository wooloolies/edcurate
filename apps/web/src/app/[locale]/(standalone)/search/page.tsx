import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { SearchPageClient } from "@/features/search/components/search-page-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="relative min-h-screen bg-brand-surface overflow-hidden text-brand-ink font-sans">
      <CanvasBackground />
      <Header />
      <main className="relative z-10 flex min-h-screen flex-col items-center px-4 pt-32 pb-16">
        <Suspense
          fallback={
            <div className="w-full max-w-4xl h-[500px] bg-white/40 backdrop-blur-md shadow-xl rounded-[2.5rem] animate-pulse" />
          }
        >
          <SearchPageClient />
        </Suspense>
      </main>
    </div>
  );
}
