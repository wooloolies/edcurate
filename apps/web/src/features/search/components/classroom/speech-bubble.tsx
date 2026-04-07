"use client";

import { AnimatePresence, motion } from "motion/react";

interface SpeechBubbleProps {
  text: string | null;
  position?: "left" | "right";
}

export function SpeechBubble({ text, position = "left" }: SpeechBubbleProps) {
  const tailOffset = position === "left" ? "25%" : "75%";

  return (
    <AnimatePresence mode="wait">
      {text && (
        <motion.div
          key={text}
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
            {text}
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
