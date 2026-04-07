import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { ShimmerLink } from "@/components/ui/shimmer-button";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  // We can still fetch translations although we selectively hardcode structural text per prototype rules
  const t = await getTranslations("home");

  return (
    <div className="relative h-dvh bg-[#F8F9FA] overflow-hidden text-[#111827] font-sans flex flex-col">
      {/* Interactive clustering canvas background */}
      <CanvasBackground />

      <Header />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        {/* Main hero typography matches the ultra-clean flat aesthetic */}
        <h1 className="text-5xl md:text-[4.5rem] font-bold tracking-tight text-center max-w-4xl leading-[1.05] text-[#111827]">
          {t("heroTitlePart1")} <br /> {t("heroTitlePart2")}
        </h1>

        <ShimmerLink href="/collections/new" authRequired className="mt-16">
          {t("startResearch")}
        </ShimmerLink>

        {/* Feature Tags */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          <div className="px-5 py-2.5 rounded-full bg-white/60 border border-white/80 shadow-sm backdrop-blur-md transition-transform hover:scale-105 cursor-default">
            <span className="text-sm font-bold text-[#111827]">{t("featureTagYear")}</span>
          </div>
          <div className="px-5 py-2.5 rounded-full bg-white/60 border border-white/80 shadow-sm backdrop-blur-md transition-transform hover:scale-105 cursor-default">
            <span className="text-sm font-bold text-[#111827]">{t("featureTagDesigner")}</span>
          </div>
          <div className="px-5 py-2.5 rounded-full bg-white/60 border border-white/80 shadow-sm backdrop-blur-md transition-transform hover:scale-105 cursor-default">
            <span className="text-sm font-bold text-[#111827]">{t("featureTagGlobal")}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
