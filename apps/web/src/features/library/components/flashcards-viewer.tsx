"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useState } from "react";

import { MathMarkdown } from "@/components/ui/math-markdown";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsData {
  title?: string;
  cards?: Flashcard[];
  flashcards?: Flashcard[];
}

interface FlashcardsViewerProps {
  data: FlashcardsData;
}

export function FlashcardsViewer({ data }: FlashcardsViewerProps) {
  const cards = data.cards ?? data.flashcards ?? [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return <p className="text-sm text-[#111827]/45">No flashcards generated.</p>;
  }

  const current = cards[currentIdx];

  const goNext = () => {
    setFlipped(false);
    setCurrentIdx((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIdx((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-5">
      {data.title ? <h3 className="text-lg font-bold text-[#111827]">{data.title}</h3> : null}

      {/* Flip card */}
      <button
        type="button"
        className="group relative min-h-[220px] w-full cursor-pointer overflow-hidden rounded-2xl border border-white/80 bg-white/70 text-left shadow-[0_2px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all hover:shadow-[0_4px_28px_rgba(0,0,0,0.07)]"
        onClick={() => setFlipped((p) => !p)}
      >
        {/* Decorative accent stripe */}
        <div
          className={`absolute inset-x-0 top-0 h-1 transition-colors duration-300 ${
            flipped ? "bg-[#B7FF70]" : "bg-[#111827]"
          }`}
        />

        <div className="flex flex-col items-center justify-center p-10 text-center">
          <span
            className={`mb-3 inline-block rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              flipped ? "bg-[#B7FF70]/20 text-[#111827]/60" : "bg-[#111827]/5 text-[#111827]/40"
            }`}
          >
            {flipped ? "Answer" : "Question"}
          </span>
          <div className="prose prose-sm max-w-none text-lg leading-relaxed text-[#111827]">
            <MathMarkdown>{flipped ? current.back : current.front}</MathMarkdown>
          </div>
        </div>
      </button>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="inline-flex items-center rounded-full border border-[#111827]/10 bg-white px-4 py-2 text-xs font-medium text-[#111827]/70 shadow-sm transition-all hover:border-[#111827]/20 hover:text-[#111827] disabled:opacity-35"
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#111827]/40">
            {currentIdx + 1} <span className="text-[#111827]/20">/</span> {cards.length}
          </span>
          <button
            type="button"
            onClick={() => setFlipped(false)}
            title="Reset flip"
            className="rounded-full p-1.5 text-[#111827]/30 transition-colors hover:bg-[#111827]/5 hover:text-[#111827]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={currentIdx === cards.length - 1}
          className="inline-flex items-center rounded-full bg-[#B7FF70] px-4 py-2 text-xs font-medium text-[#111827] shadow-sm transition-all hover:bg-[#111827] hover:text-white disabled:opacity-35"
        >
          Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
