"use client";

import { useTranslations } from "next-intl";

import type { SourceWeights } from "@/features/presets/utils/normalize-weights";

const SOURCE_KEYS: (keyof SourceWeights)[] = ["ddgs", "youtube", "openalex"];

// Active sources get this weight, inactive get minimum
const MIN_WEIGHT = 0.05;

interface SourceTogglesProps {
  value: SourceWeights;
  onChange: (weights: SourceWeights) => void;
}

export function SourceToggles({ value, onChange }: SourceTogglesProps) {
  const t = useTranslations("presets.sources");
  const handleToggle = (key: keyof SourceWeights) => {
    const wasActive = value[key] > MIN_WEIGHT;
    const next = { ...value };

    if (wasActive) {
      next[key] = MIN_WEIGHT;
    } else {
      next[key] = 1;
    }

    const activeKeys = SOURCE_KEYS.filter((k) => next[k] > MIN_WEIGHT);
    const inactiveKeys = SOURCE_KEYS.filter((k) => next[k] <= MIN_WEIGHT);

    if (activeKeys.length === 0) {
      activeKeys.push(key);
      inactiveKeys.splice(inactiveKeys.indexOf(key), 1);
    }

    const inactiveTotal = inactiveKeys.length * MIN_WEIGHT;
    const activeShare = Math.round(((1 - inactiveTotal) / activeKeys.length) * 100) / 100;

    const result: SourceWeights = { ddgs: 0, youtube: 0, openalex: 0 };
    for (const k of inactiveKeys) result[k] = MIN_WEIGHT;
    for (const k of activeKeys) result[k] = activeShare;

    const total = SOURCE_KEYS.reduce((s, k) => s + result[k], 0);
    if (Math.abs(total - 1) > 0.001) {
      result[activeKeys[0]] += Math.round((1 - total) * 100) / 100;
    }

    onChange(result);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {SOURCE_KEYS.map((key) => {
        const isActive = value[key] > MIN_WEIGHT;
        return (
          <button
            key={key}
            type="button"
            onClick={() => handleToggle(key)}
            className={`px-6 py-3 rounded-[2rem] font-semibold text-sm transition-all border-2 cursor-pointer ${
              isActive
                ? "border-brand-green bg-brand-green text-brand-ink shadow-md"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 bg-white"
            }`}
          >
            {t(key)} ({Math.round(value[key] * 100)}%)
          </button>
        );
      })}
    </div>
  );
}
