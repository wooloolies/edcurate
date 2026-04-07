import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { CanvasBackground } from "@/components/ui/canvas-background";
import { ShimmerLink } from "@/components/ui/shimmer-button";
import {
  AudienceStatements,
  ScrollReveal,
  SourceSelector,
  SubjectBanner,
} from "./home-sections";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("home");

  return (
    <div className="relative min-h-dvh bg-[#F8F9FA] text-[#111827] font-sans">
      <CanvasBackground />
      <Header />

      {/* Hero section — full viewport height */}
      <section className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pt-28">
        <h1 className="text-5xl md:text-[4.5rem] font-bold tracking-tight text-center max-w-4xl leading-[1.05] text-[#111827]">
          <span className="text-gradient-animate">{t("heroHighlight")}</span>{" "}
          {t("heroTitleRest")}
          <br />
          {t("heroFor") && <>{t("heroFor")} </>}
          <span className="text-blue-600">{t("heroTeachers")}</span>
        </h1>

        <ShimmerLink href="/collections/new" authRequired className="mt-14">
          {t("startResearch")}
        </ShimmerLink>

        {/* Search engine source selector */}
        <div className="mt-10 w-full max-w-2xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Search sources
          </p>
          <SourceSelector />
        </div>
      </section>

      {/* Introduction section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-24 md:py-32">
        <ScrollReveal>
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight text-center max-w-3xl leading-[1.15] text-[#111827]">
            Context-aware resource discovery
            <br />
            <span className="text-blue-600">and adaptation for teachers</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={150}>
          <p className="mt-6 max-w-xl text-center text-base md:text-lg leading-relaxed text-slate-500">
            Edcurate searches across multiple engines, evaluates resources
            against your curriculum, and tells you exactly how each result fits
            your teaching context — so you spend less time filtering and more
            time teaching.
          </p>
        </ScrollReveal>
      </section>

      {/* Audience statements — replaces the old feature tags */}
      <section className="relative z-10 px-6 py-16 md:py-24">
        <AudienceStatements />
      </section>

      {/* Green subject banner */}
      <section className="relative z-10 px-6 pb-16 md:px-12 lg:px-20">
        <ScrollReveal>
          <SubjectBanner />
        </ScrollReveal>
      </section>
    </div>
  );
}
