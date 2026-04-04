"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

import { normalizeWeights, type SourceWeights } from "@/features/presets/utils/normalize-weights";

const SOURCE_LABELS: Record<keyof SourceWeights, string> = {
  ddgs: "DuckDuckGo",
  youtube: "YouTube",
  openalex: "OpenAlex",
};

const SOURCE_KEYS: (keyof SourceWeights)[] = ["ddgs", "youtube", "openalex"];

interface WeightSlidersProps {
  value: SourceWeights;
  onChange: (weights: SourceWeights) => void;
}

export function WeightSliders({ value, onChange }: WeightSlidersProps) {
  return (
    <div className="space-y-4">
      {SOURCE_KEYS.map((key) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`weight-${key}`}>{SOURCE_LABELS[key]}</Label>
            <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
              {Math.round(value[key] * 100)}%
            </span>
          </div>
          <Slider
            id={`weight-${key}`}
            aria-label={`${SOURCE_LABELS[key]} weight`}
            min={0}
            max={100}
            step={1}
            value={[Math.round(value[key] * 100)]}
            onValueChange={([v]) => {
              onChange(normalizeWeights(value, key, v / 100));
            }}
          />
        </div>
      ))}
    </div>
  );
}
