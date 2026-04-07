"use client";

import { useInterval } from "ahooks";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface SpeechBubbleProps {
  /** Single message or array of messages to cycle through */
  text: string | string[] | null;
  position?: "left" | "right";
  /** Base cycle interval in ms when text is an array (default: 4000) */
  cycleInterval?: number;
}

export function SpeechBubble({
  text,
  position = "left",
  cycleInterval = 4000,
}: SpeechBubbleProps) {
  const tailOffset = position === "left" ? "25%" : "75%";
  // Randomize start index and interval offset so multiple bubbles don't sync
  const [index, setIndex] = useState(() => Math.floor(Math.random() * 100));
  const [jitter] = useState(() => Math.floor(Math.random() * 2000) - 1000);

  const messages = text === null ? null : Array.isArray(text) ? text : [text];
  const shouldCycle = messages !== null && messages.length > 1;

  useInterval(
    () => {
      if (messages) {
        setIndex((prev) => prev + 1);
      }
    },
    shouldCycle ? cycleInterval + jitter : undefined,
  );

  const displayText = messages?.[index % messages.length] ?? null;

  return (
    <AnimatePresence mode="wait">
      {displayText && (
        <motion.div
          key={displayText}
          className="absolute -top-12 left-1/2 z-20 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0.3, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <div
            className="relative whitespace-nowrap rounded-xl px-2.5 py-1 text-[9px] font-medium leading-tight shadow-md"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              color: "#374151",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(0,0,0,0.08)",
              maxWidth: 120,
              whiteSpace: "normal",
              textAlign: "center",
            }}
          >
            {displayText}
            {/* Tail */}
            <svg
              className="absolute -bottom-1.5 h-2 w-3"
              style={{ left: tailOffset, transform: "translateX(-50%)" }}
              viewBox="0 0 12 8"
            >
              <path d="M0 0 L6 8 L12 0 Z" fill="rgba(255,255,255,0.95)" />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
