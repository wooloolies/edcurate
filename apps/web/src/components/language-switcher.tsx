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
        <Button
          variant="ghost"
          className="gap-2 rounded-full backdrop-blur-xl bg-[#111827] border border-[#111827] text-white hover:!bg-white/40 hover:!text-[#111827] hover:!border-white/60 hover:scale-105 transition-all shadow-[0_4px_32px_rgba(0,0,0,0.04)] px-5 py-3 h-auto text-sm font-medium"
        >
          <Globe className="size-5" />
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
