"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Stage, StageStatus } from "@/features/search/types/search-stream";
import {
  AGENT_FRAME_SETS,
  STAGE_LABELS,
  STAGE_ORDER,
  STAGE_TO_AGENT_INDEX,
} from "./agent-frames";

interface AgentMorphSceneProps {
  stages: Partial<Record<Stage, StageStatus>>;
  activeStage: Stage | null;
  isCached: boolean;
}

function useFrameLoop(frameCount: number, interval: number) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCurrentFrame(0);
    if (frameCount <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frameCount);
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [frameCount, interval]);

  return currentFrame;
}

export function AgentMorphScene({ stages, activeStage, isCached }: AgentMorphSceneProps) {
  const agentIndex = useMemo(() => {
    if (isCached) return 2;
    if (!activeStage) return 0;
    return STAGE_TO_AGENT_INDEX[activeStage] ?? 0;
  }, [activeStage, isCached]);

  const agent = AGENT_FRAME_SETS[agentIndex];
  const currentFrame = useFrameLoop(agent.frames.length, agent.frameInterval);

  const isComplete = activeStage === "complete" || isCached;

  const agentLabel = isCached
    ? "Cached result"
    : activeStage
      ? STAGE_LABELS[activeStage] ?? ""
      : "Starting...";

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      {/* Agent character animation */}
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <motion.div
          className="w-full h-full flex items-center justify-center"
          animate={
            isComplete
              ? { y: [0, -10, 2, -5, 0], scale: [1, 1.06, 0.97, 1.03, 1] }
              : { y: [0, -6, 0, -6, 0] }
          }
          transition={
            isComplete
              ? { duration: 0.6, ease: "easeOut" }
              : { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={agentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative w-full h-full"
            >
              {agent.frames.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${agent.name} frame ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150"
                  style={{ opacity: i === currentFrame ? 1 : 0 }}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Agent name badge */}
      <div className="flex flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={agent.name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#737c7f]"
          >
            {agent.name}
          </motion.span>
        </AnimatePresence>
        {!isComplete && (
          <div className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-[#585e6c] animate-ping" />
            <span className="w-1 h-1 rounded-full bg-[#585e6c]/40" />
            <span className="w-1 h-1 rounded-full bg-[#585e6c]/20" />
          </div>
        )}
      </div>

      {/* Title + description */}
      <div className="text-center space-y-3 max-w-md">
        <AnimatePresence mode="wait">
          <motion.h2
            key={agent.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold tracking-tight text-[#2b3437]"
          >
            {agent.title}
            {!isComplete && (
              <motion.span
                className="inline-block ml-0.5"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                ...
              </motion.span>
            )}
          </motion.h2>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p
            key={agent.description}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="text-sm text-[#586064] leading-relaxed"
          >
            {agent.description}
          </motion.p>
        </AnimatePresence>
        {!isComplete && (
          <p className="text-xs text-[#abb3b7] mt-1">This may take 1–2 minutes to load</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 w-full bg-[#e3e9ec] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#585e6c] rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width: isComplete
                ? "100%"
                : activeStage === "adversarial"
                  ? "80%"
                  : activeStage === "evaluation" || activeStage === "rag_preparation"
                    ? "55%"
                    : activeStage === "federated_search"
                      ? "30%"
                      : "10%",
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Stage progress dots */}
      <div className="flex items-center gap-3">
        {STAGE_ORDER.map((stage) => {
          const status = stages[stage as Stage];
          const isActive =
            activeStage === stage ||
            (stage === "evaluation" &&
              (activeStage === "rag_preparation" || activeStage === "evaluation"));
          const isDone = status === "done" || isCached;

          return (
            <div key={stage} className="flex flex-col items-center gap-1.5">
              <motion.div
                className="rounded-full"
                animate={{
                  width: isActive ? 12 : 8,
                  height: isActive ? 12 : 8,
                  backgroundColor: isDone
                    ? "#585e6c"
                    : isActive
                      ? "#585e6c"
                      : "#dbe4e7",
                  scale: isActive && !isDone ? [1, 1.3, 1] : 1,
                }}
                transition={
                  isActive && !isDone
                    ? { scale: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } }
                    : { duration: 0.3 }
                }
              />
              {isDone && !isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-0.5 w-4 rounded-full bg-[#585e6c]"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={agentLabel}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2"
        >
          <div className="px-2.5 py-1 bg-[#d8e3fa] text-[#475265] text-[10px] font-semibold rounded-full">
            {agentLabel}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
