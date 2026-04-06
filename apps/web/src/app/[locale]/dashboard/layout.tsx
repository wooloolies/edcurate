"use client";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { Link, usePathname } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tRoot = useTranslations();
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard/presets", label: t("presets") },
    { href: "/dashboard/search", label: t("search") },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Link href="/dashboard/presets" className="text-lg font-bold">
            {tRoot("title")}
          </Link>
          <div className="flex flex-1 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
