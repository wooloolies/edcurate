import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { CanvasBackground } from "@/components/ui/canvas-background";
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
    <div className="relative min-h-dvh bg-brand-surface text-brand-ink">
      <CanvasBackground />

      <header className="sticky top-0 z-50 px-4 pt-4 pb-2 md:px-8 md:pt-6">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 rounded-[2.5rem] bg-white/60 px-6 py-2.5 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.04)] border border-white/60">
          <Link href="/dashboard" className="font-bold text-xl tracking-tight text-brand-ink mr-2">
            {tRoot("title")}
          </Link>
          <AppNav
            tabs={TABS.map((tab) => ({
              ...tab,
              label: t(tab.key),
            }))}
          />
          <div className="flex items-center gap-3 ml-auto">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </nav>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
