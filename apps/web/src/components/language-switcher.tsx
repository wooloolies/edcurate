"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routing, usePathname, useRouter } from "@/lib/i18n/routing";

const localeLabels: Record<string, string> = {
  en: "English",
  ko: "한국어",
  zh: "中文",
  th: "ไทย",
  vi: "Tiếng Việt",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onLocaleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 rounded-full backdrop-blur-xl bg-white/40 border border-white/60 hover:!bg-[#111827] hover:!text-white hover:!border-[#111827] hover:scale-105 transition-all shadow-[0_4px_32px_rgba(0,0,0,0.04)] px-5 py-2.5 h-auto text-sm font-medium text-gray-700">
          <Globe className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => onLocaleChange(loc)}
            className={loc === locale ? "cursor-pointer bg-accent" : "cursor-pointer"}
          >
            {localeLabels[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
