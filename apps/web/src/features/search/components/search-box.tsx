"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import type { PresetResponse } from "@/lib/api/model";

interface SearchBoxProps {
  presetId: string | null;
  activePreset: PresetResponse | undefined;
  isPresetResolving: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSearching: boolean;
}

export function SearchBox({
  presetId,
  activePreset,
  isPresetResolving,
  draft,
  onDraftChange,
  onSubmit,
  isSearching,
}: SearchBoxProps) {
  const t = useTranslations("search");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="w-full bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.1)] border border-white/60 p-6 md:p-8 flex flex-col gap-6">
      <form
        onSubmit={onSubmit}
        className={`w-full flex items-center border-2 rounded-[2.5rem] p-2 transition-all shadow-md ${
          presetId
            ? "bg-white/60 border-white/60 hover:bg-white/80 focus-within:bg-white focus-within:border-brand-green"
            : "bg-white/40 border-white/40 opacity-60 cursor-not-allowed"
        }`}
      >
        <div className={`pl-6 pr-4 ${presetId ? "text-brand-ink" : "text-brand-ink/30"}`}>
          <Search className="w-6 h-6" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={presetId ? t("placeholder") : t("placeholderNoPreset")}
          disabled={!presetId}
          className="flex-1 bg-transparent py-4 text-xl font-bold text-brand-ink placeholder:text-gray-500 outline-none w-full disabled:cursor-not-allowed"
        />
        <div className="flex items-center gap-2 pr-2">
          {draft ? (
            <button
              type="button"
              onClick={() => onDraftChange("")}
              className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-black transition-colors rounded-full hover:bg-gray-200/50 hidden md:block cursor-pointer"
            >
              {t("clearInput")}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!presetId || !draft.trim() || isSearching}
            className="px-8 py-4 bg-brand-ink text-brand-green hover:scale-105 active:scale-95 transition-all rounded-[2rem] font-bold text-lg shadow-md whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? t("searchingButton") : t("searchButton")}
          </button>
        </div>
      </form>

      {isPresetResolving ? (
        <div className="flex flex-wrap items-center gap-3 px-2 -mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list is static
            <div key={i} className="h-10 w-24 animate-pulse rounded-xl bg-brand-ink/10" />
          ))}
        </div>
      ) : null}
      {activePreset && (
        <div className="flex flex-wrap items-start justify-between gap-4 px-2 -mt-2">
          <div className="flex flex-wrap items-center gap-3">
            {!!activePreset.subject && (
              <div className="px-5 py-2.5 bg-white border border-brand-ink/10 rounded-xl text-sm font-bold text-brand-ink shadow-sm cursor-pointer">
                {activePreset.subject}
              </div>
            )}
            {!!activePreset.year_level && (
              <div className="px-5 py-2.5 bg-white border border-brand-ink/10 rounded-xl text-sm font-bold text-brand-ink shadow-sm cursor-pointer">
                {activePreset.year_level}
              </div>
            )}
            {!!activePreset.class_size && (
              <div className="px-5 py-2.5 bg-white border border-brand-ink/10 rounded-xl text-sm font-bold text-brand-ink shadow-sm cursor-pointer">
                {t("classSizePeople", { classSize: activePreset.class_size })}
              </div>
            )}
            {!!activePreset.country && (
              <div className="px-5 py-2.5 bg-white border border-brand-ink/10 rounded-xl text-sm font-bold text-brand-ink shadow-sm cursor-pointer">
                {activePreset.country}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
