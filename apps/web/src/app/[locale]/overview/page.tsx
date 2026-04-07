import { Construction } from "lucide-react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";

interface OverviewPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("overview");

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans flex flex-col">
      <Header />

      <main className="flex-1 mt-36 max-w-4xl mx-auto w-full px-8 pb-20">
        <section className="bg-white/60 backdrop-blur-xl rounded-3xl p-10 shadow-sm border border-white/80 flex flex-col items-center text-center gap-4">
          <Construction className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-bold">{t("comingSoonTitle")}</h2>
          <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
            {t("comingSoonDescription")}
          </p>
        </section>
      </main>
    </div>
  );
}
