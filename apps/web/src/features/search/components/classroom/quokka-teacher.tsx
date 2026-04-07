"use client";

import { useRef } from "react";

import { motion } from "motion/react";

import { Quokka } from "@/features/search/components/classroom/characters/quokka";
import type { Stage } from "@/features/search/types/search-stream";

/** Percentage-based positions within the scene container */
const TEACHER_POSITIONS: Record<Stage, { x: string; y: string }> = {
  query_generation: { x: "20%", y: "45%" },
  federated_search: { x: "65%", y: "45%" },
  rag_preparation: { x: "42%", y: "30%" },
  evaluation: { x: "20%", y: "70%" },
  adversarial: { x: "65%", y: "70%" },
  complete: { x: "42%", y: "35%" },
};

/** Convert a percentage string like "42%" to its numeric value */
function parsePercent(value: string): number {
  return Number.parseFloat(value.replace("%", ""));
}

interface QuokkaTeacherProps {
  activeStage: Stage | null;
  isCached?: boolean;
}

export function QuokkaTeacher({ activeStage, isCached }: QuokkaTeacherProps) {
  const prevXRef = useRef<number>(42);

  const position = activeStage
    ? TEACHER_POSITIONS[activeStage]
    : { x: "42%", y: "35%" };

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
        width: 70,
        height: 88,
      }}
      animate={{
        left: position.x,
        top: position.y,
        scaleX: isMovingLeft ? 1 : -1,
      }}
      transition={
        isCached
          ? { duration: 0 }
          : { type: "spring", stiffness: 80, damping: 15 }
      }
      aria-label="Quokka teacher"
    >
      <Quokka
        className="h-full w-full"
        isWorking={isWorking && !isWriting}
        isDone={activeStage === "complete" || isCached}
      />
    </motion.div>
  );
}
