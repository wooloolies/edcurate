"use client";

import { useCounter, useInterval } from "ahooks";
import { BrainCircuit } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function AnimatedDots() {
  const [dotCount, { inc }] = useCounter(1, { min: 1, max: 3 });
  useInterval(() => inc(dotCount >= 3 ? -2 : 1), 500);

  return <span className="inline-block w-4 text-left">{".".repeat(dotCount)}</span>;
}

export function EvaluationProgress() {
  const t = useTranslations("search.progress");
  const steps = [
    t("step1"),
    t("step2"),
    t("step3"),
    t("step4"),
    t("step5"),
    t("step6"),
    t("step7"),
    t("step8"),
    t("step9"),
  ] as const;
  const [index, { inc }] = useCounter(0, { min: 0, max: steps.length - 1 });
  useInterval(() => inc(index >= steps.length - 1 ? -(steps.length - 1) : 1), 4_000);

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-900">
      <BrainCircuit className="h-5 w-5 animate-pulse text-blue-600" />
      <AlertTitle className="text-blue-800">
        {t("title")}
        <span className="ml-2 text-xs font-normal text-blue-600">{t("duration")}</span>
      </AlertTitle>
      <AlertDescription className="relative h-6 overflow-hidden text-blue-700">
        {steps.map((step, i) => (
          <span
            key={step}
            className="absolute inset-x-0 transition-all duration-500 ease-in-out"
            style={{
              transform: i === index ? "translateY(0)" : "translateY(100%)",
              opacity: i === index ? 1 : 0,
            }}
          >
            {step}
            <AnimatedDots />
          </span>
        ))}
      </AlertDescription>
    </Alert>
  );
}
