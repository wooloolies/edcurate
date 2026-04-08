"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { CanvasBackground } from "@/components/ui/canvas-background";
import { LineCanvasBackground } from "@/components/ui/line-canvas-background";
import { Link } from "@/lib/i18n/routing";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("login");

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 md:p-6 lg:p-8 bg-[#0B0F19] font-sans overflow-hidden">
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white/80 bg-white/5 hover:bg-white/10 hover:text-white rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("returnToHome")}</span>
        </Link>
      </div>

      <CanvasBackground />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.1)] min-h-[700px] border border-white p-3 gap-4">
        {/* Left Pane */}
        <div className="hidden md:flex flex-col justify-between w-full md:w-1/2 p-10 lg:p-14 relative overflow-hidden bg-[#F0FDF4] rounded-[2rem] shadow-xl shadow-black/10 border border-black/5">
          <LineCanvasBackground />
          <div className="relative z-10 flex items-center gap-2 mt-4 ml-2">
            <span className="font-bold text-2xl text-[#111827] tracking-tight">
              <span className="text-blue-600">Ed</span>curate
            </span>
          </div>
          <div className="relative z-10 w-full max-w-lg mb-10 ml-2 pointer-events-none">
            <h2 className="text-4xl lg:text-[2.7rem] font-bold tracking-tight text-[#111827] leading-[1.1]">
              {t("heroQuoteLine1")} <br className="hidden lg:block" /> {t("heroQuoteLine2")}
            </h2>
          </div>
        </div>

        {/* Right Pane */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16 relative bg-transparent rounded-[2rem]">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </main>
  );
}
