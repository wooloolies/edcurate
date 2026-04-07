import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { AppNav } from "@/features/app-shell/components/app-nav";
import { Link } from "@/lib/i18n/routing";

const TABS = [
  { key: "presets", href: "/collections" },
  { key: "search", href: "/search" },
  { key: "library", href: "/library" },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tRoot = useTranslations();

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Link href="/dashboard" className="text-lg font-bold">
            {tRoot("title")}
          </Link>
          <AppNav
            tabs={TABS.map((tab) => ({
              ...tab,
              label: t(tab.key),
            }))}
          />
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
