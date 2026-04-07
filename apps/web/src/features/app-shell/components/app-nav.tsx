"use client";

import { Link, usePathname } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

interface NavTab {
  key: string;
  href: string;
  label: string;
}

interface AppNavProps {
  tabs: NavTab[];
}

export function AppNav({ tabs }: AppNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 items-center gap-1">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-brand-ink text-white shadow-sm"
                : "text-gray-500 hover:text-brand-ink hover:bg-white/80"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
