"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex h-[46px] w-[46px] items-center justify-center rounded-full backdrop-blur-xl bg-[#111827] border border-[#111827] text-white hover:bg-white/40 hover:text-[#111827] hover:border-white/60 hover:scale-105 transition-all shadow-[0_4px_32px_rgba(0,0,0,0.04)] cursor-pointer"
      aria-label="Go back"
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
