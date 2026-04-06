"use client";

import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";

import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { LibraryPageClient } from "@/features/library/components/library-page-client";
import { PresetListClient } from "@/features/presets/components/preset-list-client";
import { SearchPageClient } from "@/features/search/components/search-page-client";
import { Link, usePathname } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const TABS = ["presets", "search", "library"] as const;
type Tab = (typeof TABS)[number];

/** Sub-route patterns that should render children instead of tabs */
const SUB_ROUTE_PATTERNS = ["/new", "/edit"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tRoot = useTranslations();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "presets" as string,
    shallow: true,
  });

  const currentTab = (TABS.includes(activeTab as Tab) ? activeTab : "presets") as Tab;

  // Detect if we're on a deep sub-route (e.g. /dashboard/presets/new, /dashboard/presets/[id]/edit)
  const dashboardBase = "/dashboard";
  const relativePath = pathname.startsWith(dashboardBase)
    ? pathname.slice(dashboardBase.length)
    : "";
  const isSubRoute = SUB_ROUTE_PATTERNS.some((p) => relativePath.includes(p));

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Link href="/dashboard" className="text-lg font-bold">
            {tRoot("title")}
          </Link>
          <div className="flex flex-1 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  currentTab === tab && !isSubRoute
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                {t(tab)}
              </button>
            ))}
          </div>
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {isSubRoute ? (
          children
        ) : (
          <>
            <div className={currentTab === "presets" ? "" : "hidden"}>
              <PresetListClient />
            </div>
            <div className={currentTab === "search" ? "" : "hidden"}>
              <SearchPageClient />
            </div>
            <div className={currentTab === "library" ? "" : "hidden"}>
              <LibraryPageClient />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
