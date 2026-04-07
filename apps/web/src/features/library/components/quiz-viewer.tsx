"use client";

import { Check, Download, Eye, EyeOff, HelpCircle, X } from "lucide-react";
import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 750px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; font-size: 14px; line-height: 1.6; }
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <div className="flex items-center gap-3">
          {answeredCount > 0 && (
            <Badge variant="outline">
              {correctCount}/{answeredCount} correct
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowAllAnswers((p) => !p)}>
            {showAllAnswers ? (
              <>
                <EyeOff className="mr-1 h-4 w-4" /> Hide Answers
              </>
            ) : (
              <>
                <Eye className="mr-1 h-4 w-4" /> Show All Answers
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadPdf}>
            <Download className="mr-1 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {data.questions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const revealed = showAllAnswers || selected !== undefined;

          return (
            <Card key={q.question}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium leading-relaxed">
                  <span className="text-muted-foreground mr-2">Q{qIdx + 1}.</span>
                  <MathMarkdown inline>{q.question}</MathMarkdown>
                </CardTitle>
                {q.hint ? (
                  <button
                    type="button"
                    onClick={() => toggleHint(qIdx)}
                    className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HelpCircle className="h-3 w-3" />
                    {visibleHints.has(qIdx) ? (
                      <MathMarkdown inline>{q.hint!}</MathMarkdown>
                    ) : (
                      "Show hint"
                    )}
                  </button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {q.answerOptions.map((opt, oIdx) => {
                  const isSelected = selected === oIdx;
                  const isCorrect = opt.isCorrect;
                  const showResult = revealed;

                  let borderClass = "border-border";
                  if (showResult && isCorrect)
                    borderClass = "border-green-500 bg-green-50 dark:bg-green-950/20";
                  else if (showResult && isSelected && !isCorrect)
                    borderClass = "border-red-500 bg-red-50 dark:bg-red-950/20";

                  return (
                    <button
                      key={opt.text}
                      type="button"
                      onClick={() => selectAnswer(qIdx, oIdx)}
                      disabled={showAllAnswers}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${borderClass} ${
                        !revealed ? "hover:bg-muted/50 cursor-pointer" : ""
                      }`}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs">
                        {showResult && isCorrect ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : showResult && isSelected ? (
                          <X className="h-3 w-3 text-red-600" />
                        ) : (
                          String.fromCharCode(65 + oIdx)
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <MathMarkdown inline>{opt.text}</MathMarkdown>
                        {showResult ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <MathMarkdown inline>{opt.rationale}</MathMarkdown>
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
