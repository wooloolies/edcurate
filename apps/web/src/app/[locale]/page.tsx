import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations();
  const homeT = await getTranslations("home");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-bold">{t("title")}</span>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild size="sm" variant="ghost">
              <Link href="/team">{homeT("team")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">{homeT("login")}</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-muted-foreground">{homeT("tagline")}</p>
      </main>
    </>
  );
}
