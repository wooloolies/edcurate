"use client";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/routing";

export function SiteHeader() {
  const t = useTranslations();
  const { data: session, isPending } = useSession();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          {t("title")}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild size="sm" variant="ghost">
            <Link href="/team">{t("home.team")}</Link>
          </Button>
          {!isPending && (
            session?.user ? (
              <UserMenu />
            ) : (
              <Button asChild size="sm">
                <Link href="/login">{t("home.login")}</Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
