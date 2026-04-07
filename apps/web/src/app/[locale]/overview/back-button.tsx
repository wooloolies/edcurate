"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:scale-105 transition-all cursor-pointer"
    >
      <ArrowLeft className="h-5 w-5 text-[#111827]" />
    </button>
  );
}
