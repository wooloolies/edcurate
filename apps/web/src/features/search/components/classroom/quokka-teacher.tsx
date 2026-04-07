"use client";

import { useRef } from "react";

import { motion } from "motion/react";

import { Quokka } from "@/features/search/components/classroom/characters/quokka";
import { SpeechBubble } from "@/features/search/components/classroom/speech-bubble";
import type { Stage } from "@/features/search/types/search-stream";

/** Percentage-based positions within the scene container */
const TEACHER_POSITIONS: Record<Stage, { x: string; y: string }> = {
  query_generation: { x: "42%", y: "44%" },
  federated_search: { x: "45%", y: "44%" },
  rag_preparation: { x: "44%", y: "25%" },
  evaluation: { x: "42%", y: "70%" },
  adversarial: { x: "45%", y: "70%" },
  complete: { x: "44%", y: "32%" },
};

/** Convert a percentage string like "42%" to its numeric value */
function parsePercent(value: string): number {
  return Number.parseFloat(value.replace("%", ""));
}

interface QuokkaTeacherProps {
  activeStage: Stage | null;
  isCached?: boolean;
  message?: string | null;
}

export function QuokkaTeacher({ activeStage, isCached, message }: QuokkaTeacherProps) {
  const prevXRef = useRef<number>(42);

  const position = activeStage
    ? TEACHER_POSITIONS[activeStage]
    : { x: "44%", y: "32%" };

  const currentX = parsePercent(position.x);
  const isMovingLeft = currentX < prevXRef.current;
  prevXRef.current = currentX;

  const isWriting = activeStage === "rag_preparation";
  const isWorking = activeStage !== null && activeStage !== "complete";

  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        translateX: "-50%",
        translateY: "-50%",
        width: 90,
        height: 112,
      }}
      animate={{
        left: position.x,
        top: position.y,
      }}
      transition={
        isCached
          ? { duration: 0 }
          : { type: "spring", stiffness: 80, damping: 15 }
      }
      aria-label="Quokka teacher"
    >
      {/* Speech bubble outside flip container so text stays readable */}
      <SpeechBubble text={message ?? null} />
      {/* Only the character flips direction */}
      <div style={{ transform: isMovingLeft ? "scaleX(1)" : "scaleX(-1)" }}>
        <Quokka
          className="h-full w-full"
          isWorking={isWorking && !isWriting}
          isDone={activeStage === "complete" || isCached}
        />
      </div>
    </motion.div>
  );
}
