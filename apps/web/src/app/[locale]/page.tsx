import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Link } from "@/lib/i18n/routing";
import { CanvasBackground } from "@/components/ui/canvas-background";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  // We can still fetch translations although we selectively hardcode structural text per prototype rules
  const t = await getTranslations();

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] overflow-hidden text-[#111827] font-sans">
      {/* Interactive clustering canvas background */}
      <CanvasBackground />

      <Header />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Main hero typography matches the ultra-clean flat aesthetic */}
        <h1 className="text-5xl md:text-[4.5rem] font-bold tracking-tight text-center max-w-4xl leading-[1.05] text-[#111827]">
          {t("home__heroTitlePart1")} <br /> {t("home__heroTitlePart2")}
        </h1>
        
        {/* Glassmorphic link in the middle */}
        <Link 
          href="/research"
          className="mt-16 px-10 py-5 rounded-[2.5rem] text-lg font-semibold text-[#111827] backdrop-blur-2xl bg-white/40 border border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:bg-[#111827] hover:text-white hover:border-[#111827] hover:shadow-[0_8px_32px_rgba(17,24,39,0.3)] hover:scale-105 duration-300 transition-all inline-block"
        >
          {t("home__startResearch")}
        </Link>
      </main>
    </div>
  );
}
