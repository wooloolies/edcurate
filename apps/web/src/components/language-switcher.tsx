"use client";

import { Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

/** Desktop: dropdown, Mobile: bottom sheet */
export function LanguageSwitcher({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function onLocaleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
    setOpen(false);
  }

  if (variant === "mobile") {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-brand-ink/60 bg-white/60 border border-white/60 backdrop-blur-xl shadow-sm hover:bg-gray-100 transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>{localeLabels[locale]}</span>
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Language</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 px-4 pb-8">
            {routing.locales.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => onLocaleChange(loc)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
                  loc === locale
                    ? "bg-brand-green/20 text-brand-ink"
                    : "text-brand-ink/70 hover:bg-gray-100"
                }`}
              >
                {localeLabels[loc]}
                {loc === locale && <Check className="h-4 w-4 text-brand-ink" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    );
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
