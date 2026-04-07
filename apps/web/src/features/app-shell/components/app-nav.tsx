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
    <div className="flex flex-1 gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(tab.href)
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
