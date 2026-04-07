"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    return <p className="text-sm text-muted-foreground">No flashcards generated.</p>;
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
    <div className="space-y-4">
      {data.title ? <h3 className="text-lg font-semibold">{data.title}</h3> : null}

      <Card
        className="cursor-pointer min-h-[200px] flex items-center justify-center transition-all hover:shadow-md"
        onClick={() => setFlipped((p) => !p)}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <span className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {flipped ? "Answer" : "Question"}
          </span>
          <div className="text-lg leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <MathMarkdown>{flipped ? current.back : current.front}</MathMarkdown>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIdx === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {currentIdx + 1} / {cards.length}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setFlipped(false)} title="Reset flip">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goNext}
          disabled={currentIdx === cards.length - 1}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
