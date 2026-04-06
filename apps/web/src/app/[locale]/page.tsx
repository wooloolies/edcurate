import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const homeT = await getTranslations("home");
  const t = await getTranslations();

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-muted-foreground">{homeT("tagline")}</p>
      </main>
    </>
  );
}
