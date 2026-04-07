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
      <div className="border-b border-[#111827]/5 px-6 py-3">
        <h3 className="text-sm font-semibold text-[#111827]">Summary</h3>
      </div>
      <div className="px-6 py-5">
        <div className="prose prose-sm max-w-none text-[#111827]/80 leading-relaxed prose-headings:text-[#111827] prose-strong:text-[#111827]">
          <MathMarkdown>{data.summary}</MathMarkdown>
        </div>
      </div>
    </div>
  );
}
