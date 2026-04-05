"use client";

import { useCounter, useInterval } from "ahooks";
import { BrainCircuit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const STEPS = [
  "Searching across multiple providers",
  "Fetching content from discovered resources",
  "Extracting and chunking text for analysis",
  "Generating semantic embeddings",
  "Storing vectors for similarity search",
  "Retrieving the most relevant chunks",
  "Scoring curriculum alignment and pedagogical quality",
  "Evaluating reading level and bias representation",
  "Finalising scores and ranking results",
] as const;

function AnimatedDots() {
  const [dotCount, { inc }] = useCounter(1, { min: 1, max: 3 });
  useInterval(() => inc(dotCount >= 3 ? -2 : 1), 500);

  return <span className="inline-block w-4 text-left">{".".repeat(dotCount)}</span>;
}

export function EvaluationProgress() {
  const [index, { inc }] = useCounter(0, { min: 0, max: STEPS.length - 1 });
  useInterval(() => inc(index >= STEPS.length - 1 ? -(STEPS.length - 1) : 1), 4_000);

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-900">
      <BrainCircuit className="h-5 w-5 animate-pulse text-blue-600" />
      <AlertTitle className="text-blue-800">
        Deep Evaluation in Progress
        <span className="ml-2 text-xs font-normal text-blue-600">
          This usually takes 60–90 seconds
        </span>
      </AlertTitle>
      <AlertDescription className="relative h-6 overflow-hidden text-blue-700">
        {STEPS.map((step, i) => (
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
