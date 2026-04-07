"use client";

import { MathMarkdown } from "@/components/ui/math-markdown";

interface SummaryData {
  summary: string;
}

interface SummaryViewerProps {
  data: SummaryData;
}

export function SummaryViewer({ data }: SummaryViewerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-sm">
      <div className="border-b border-brand-ink/5 px-6 py-3">
        <h3 className="text-sm font-semibold text-brand-ink">Summary</h3>
      </div>
      <div className="px-6 py-5">
        <div className="prose prose-sm max-w-none text-brand-ink/80 leading-relaxed prose-headings:text-brand-ink prose-strong:text-brand-ink">
          <MathMarkdown>{data.summary}</MathMarkdown>
        </div>
      </div>
    </div>
  );
}
