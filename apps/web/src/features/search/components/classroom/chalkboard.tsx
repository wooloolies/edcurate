"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import type { Stage } from "@/features/search/types/search-stream";

const STAGE_KEY: Record<Stage, string> = {
  query_generation: "queryGeneration",
  federated_search: "federatedSearch",
  rag_preparation: "ragPreparation",
  evaluation: "evaluation",
  adversarial: "adversarial",
  complete: "complete",
};

interface ChalkboardProps {
  activeStage: Stage | null;
  isCached?: boolean;
}

export function Chalkboard({ activeStage, isCached }: ChalkboardProps) {
  const t = useTranslations("search.classroom.chalkboard");
  const displayStage = isCached ? "complete" : activeStage;
  const text = isCached
    ? t("cached")
    : displayStage
      ? t(STAGE_KEY[displayStage])
      : null;

  return (
    <div
      className="absolute left-1/2 top-[5%] flex h-[18%] w-[70%] -translate-x-1/2 items-center justify-center rounded-md"
      style={{ backgroundColor: "#2D5A27" }}
      role="status"
      aria-live="polite"
      aria-label="Classroom chalkboard"
    >
      {/* Chalk border effect */}
      <div
        className="absolute inset-1 rounded"
        style={{
          border: "2px solid rgba(255,255,255,0.15)",
        }}
      />

      {/* Stage text with fade transition */}
      <AnimatePresence mode="wait">
        {text && (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.9, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="relative z-10 px-4 text-center font-mono text-sm leading-snug tracking-wide text-white"
            style={{
              textShadow: "0 0 8px rgba(255,255,255,0.3)",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Chalk tray at the bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[6px] rounded-b-md"
        style={{ backgroundColor: "#1E3E1A" }}
      />
    </div>
  );
}
