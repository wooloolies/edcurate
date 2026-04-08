"use client";

import { Check, Download, Eye, EyeOff, HelpCircle, X } from "lucide-react";
import { useCallback, useState } from "react";

import { MathMarkdown } from "@/components/ui/math-markdown";

interface AnswerOption {
  text: string;
  isCorrect: boolean;
  rationale: string;
}

interface QuizQuestion {
  question: string;
  answerOptions: AnswerOption[];
  hint?: string;
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

interface QuizViewerProps {
  data: QuizData;
}

export function QuizViewer({ data }: QuizViewerProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [visibleHints, setVisibleHints] = useState<Set<number>>(new Set());

  const selectAnswer = (questionIdx: number, optionIdx: number) => {
    if (showAllAnswers) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const toggleHint = (idx: number) => {
    setVisibleHints((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const downloadPdf = useCallback(() => {
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const renderMath = (text: string) =>
      escapeHtml(text)
        .replace(/\$\$(.+?)\$\$/g, (_, m: string) => `<span class="math-block">\\[${m}\\]</span>`)
        .replace(/\$(.+?)\$/g, (_, m: string) => `<span class="math-inline">\\(${m}\\)</span>`);

    const questionsHtml = data.questions
      .map((q, qIdx) => {
        const optionsHtml = q.answerOptions
          .map((opt, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx);
            return `<div class="option"><span class="letter">${letter}.</span> ${renderMath(opt.text)}</div>`;
          })
          .join("");

        const hintHtml = q.hint
          ? `<div class="hint"><strong>Hint:</strong> ${renderMath(q.hint)}</div>`
          : "";

        return `
          <div class="question">
            <div class="q-title"><span class="q-num">Q${qIdx + 1}.</span> ${renderMath(q.question)}</div>
            ${hintHtml}
            <div class="options">${optionsHtml}</div>
          </div>`;
      })
      .join("");

    const answerKeyHtml = data.questions
      .map((q, qIdx) => {
        const correctIdx = q.answerOptions.findIndex((o) => o.isCorrect);
        const letter = String.fromCharCode(65 + correctIdx);
        return `<div class="answer"><strong>Q${qIdx + 1}.</strong> ${letter} &mdash; ${renderMath(q.answerOptions[correctIdx].rationale)}</div>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${escapeHtml(data.title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body,{delimiters:[{left:'\\\\[',right:'\\\\]',display:true},{left:'\\\\(',right:'\\\\)',display:false}]})"></script>
<style>
  body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; max-width: 750px; margin: 40px auto; padding: 0 24px; color: #111827; font-size: 14px; line-height: 1.6; }
  h1 { font-size: 22px; margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }
  .question { margin-bottom: 24px; page-break-inside: avoid; }
  .q-title { font-weight: 600; margin-bottom: 8px; }
  .q-num { color: #6b7280; margin-right: 4px; }
  .options { margin-left: 20px; }
  .option { padding: 4px 0; }
  .letter { font-weight: 600; color: #4b5563; margin-right: 4px; }
  .hint { margin: 6px 0 8px 20px; padding: 6px 12px; background: #f9fafb; border-left: 3px solid #d1d5db; font-size: 13px; color: #6b7280; }
  hr { margin: 32px 0; border: none; border-top: 2px solid #e5e7eb; }
  h2 { font-size: 18px; }
  .answer { padding: 3px 0; }
  @media print { body { margin: 0; } }
</style>
</head><body>
  <h1>${escapeHtml(data.title)}</h1>
  ${questionsHtml}
  <hr>
  <h2>Answer Key</h2>
  ${answerKeyHtml}
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onafterprint = () => win.close();
    setTimeout(() => win.print(), 500);
  }, [data]);

  const correctCount = data.questions.reduce((acc, q, idx) => {
    const sel = selectedAnswers[idx];
    if (sel !== undefined && q.answerOptions[sel]?.isCorrect) return acc + 1;
    return acc;
  }, 0);

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-ink">{data.title}</h3>
        <div className="flex items-center gap-2">
          {answeredCount > 0 && (
            <span className="rounded-full bg-brand-green/30 px-3 py-1 text-xs font-medium text-brand-ink/70">
              {correctCount}/{answeredCount} correct
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowAllAnswers((p) => !p)}
            className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium text-brand-ink/60 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
          >
            {showAllAnswers ? (
              <>
                <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Hide Answers
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Show All
              </>
            )}
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex items-center rounded-full bg-brand-green px-3.5 py-1.5 text-xs font-medium text-brand-ink transition-all hover:bg-brand-ink hover:text-white"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {data.questions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const revealed = showAllAnswers || selected !== undefined;

          return (
            <div
              key={q.question}
              className="overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-sm"
            >
              {/* Question text */}
              <div className="px-5 pt-4 pb-3">
                <p className="text-sm font-medium leading-relaxed text-brand-ink">
                  <span className="mr-2 text-brand-ink/35">Q{qIdx + 1}.</span>
                  <MathMarkdown inline>{q.question}</MathMarkdown>
                </p>
                {q.hint ? (
                  <button
                    type="button"
                    onClick={() => toggleHint(qIdx)}
                    className="mt-2 flex items-center gap-1.5 text-xs text-brand-ink/40 transition-colors hover:text-brand-ink/70"
                  >
                    <HelpCircle className="h-3 w-3" />
                    {visibleHints.has(qIdx) ? (
                      <MathMarkdown inline>{q.hint!}</MathMarkdown>
                    ) : (
                      "Show hint"
                    )}
                  </button>
                ) : null}
              </div>

              {/* Options */}
              <div className="space-y-1.5 px-5 pb-4">
                {q.answerOptions.map((opt, oIdx) => {
                  const isSelected = selected === oIdx;
                  const isCorrect = opt.isCorrect;
                  const showResult = revealed;

                  let bgClass = "bg-brand-surface border-transparent hover:bg-brand-ink/5";
                  let indicatorClass = "border-brand-ink/15 bg-white text-brand-ink/50";

                  if (showResult && isCorrect) {
                    bgClass = "bg-brand-green/15 border-brand-green/40";
                    indicatorClass = "border-brand-green bg-brand-green text-brand-ink";
                  } else if (showResult && isSelected && !isCorrect) {
                    bgClass = "bg-red-50 border-red-200/60";
                    indicatorClass = "border-red-400 bg-red-400 text-white";
                  }

                  return (
                    <button
                      key={opt.text}
                      type="button"
                      onClick={() => selectAnswer(qIdx, oIdx)}
                      disabled={showAllAnswers}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-all ${bgClass} ${
                        !revealed ? "cursor-pointer" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors ${indicatorClass}`}
                      >
                        {showResult && isCorrect ? (
                          <Check className="h-3 w-3" />
                        ) : showResult && isSelected ? (
                          <X className="h-3 w-3" />
                        ) : (
                          String.fromCharCode(65 + oIdx)
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-brand-ink">
                          <MathMarkdown inline>{opt.text}</MathMarkdown>
                        </span>
                        {showResult ? (
                          <p className="mt-1 text-xs text-brand-ink/45">
                            <MathMarkdown inline>{opt.rationale}</MathMarkdown>
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
