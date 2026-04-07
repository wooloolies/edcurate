"use client";

import { useEffect, useRef } from "react";

import { motion, useAnimation } from "motion/react";

import { Bear } from "@/features/search/components/classroom/characters/bear";
import { Fox } from "@/features/search/components/classroom/characters/fox";
import { Owl } from "@/features/search/components/classroom/characters/owl";
import { Rabbit } from "@/features/search/components/classroom/characters/rabbit";
import type { StageStatus } from "@/features/search/types/search-stream";

type CharacterType = "owl" | "fox" | "bear" | "rabbit";

const CHARACTER_MAP: Record<
  CharacterType,
  React.ComponentType<{
    className?: string;
    isWorking?: boolean;
    isDone?: boolean;
  }>
> = {
  owl: Owl,
  fox: Fox,
  bear: Bear,
  rabbit: Rabbit,
};

interface StudentAgentProps {
  character: CharacterType;
  position: { x: string; y: string };
  status: StageStatus | undefined;
  label: string;
}

export function StudentAgent({
  character,
  position,
  status,
  label,
}: StudentAgentProps) {
  const controls = useAnimation();
  const prevStatusRef = useRef<StageStatus | undefined>(undefined);

  const CharacterComponent = CHARACTER_MAP[character];

  const isWorking = status === "working";
  const isDone = status === "done";

  // Bounce effect when transitioning to "done"
  useEffect(() => {
    if (prevStatusRef.current !== "done" && status === "done") {
      controls
        .start({
          y: [0, -10, 2, -5, 0],
          transition: { duration: 0.5, ease: "easeOut" },
        })
        .catch(() => {
          // ignore animation errors
        });
    }
    prevStatusRef.current = status;
  }, [status, controls]);

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      aria-label={label}
      role="status"
      style={{
        left: position.x,
        top: position.y,
        translateX: "-50%",
        translateY: "-50%",
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={controls}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
    >
      <motion.div animate={controls} style={{ width: 64, height: 80 }}>
        <CharacterComponent
          className="h-full w-full"
          isWorking={isWorking}
          isDone={isDone}
        />
      </motion.div>

      {/* Label below character */}
      <motion.span
        className="mt-1 rounded px-1.5 py-0.5 text-center text-[10px] font-medium leading-tight"
        style={{
          color: isDone
            ? "#166534"
            : isWorking
              ? "#92400e"
              : "rgba(0,0,0,0.45)",
          backgroundColor: isDone
            ? "rgba(220,252,231,0.85)"
            : isWorking
              ? "rgba(254,243,199,0.85)"
              : "rgba(255,255,255,0.6)",
          backdropFilter: "blur(4px)",
          maxWidth: 72,
        }}
        animate={{
          scale: isWorking ? [1, 1.05, 1] : 1,
        }}
        transition={
          isWorking
            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
      >
        {label}
      </motion.span>
    </motion.div>
  );
}
