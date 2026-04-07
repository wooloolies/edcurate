import { Construction } from "lucide-react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";

interface OverviewPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OverviewPage({ params, searchParams }: OverviewPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("overview");

  const resolvedParams = await searchParams;
  const title = typeof resolvedParams.title === "string" ? resolvedParams.title : t("defaultTitle");
  const type = typeof resolvedParams.type === "string" ? resolvedParams.type : t("defaultType");

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans flex flex-col">
      <Header />

      <main className="flex-1 mt-36 max-w-4xl mx-auto w-full px-8 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-lg text-muted-foreground mt-2">{type}</p>
        </div>

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
