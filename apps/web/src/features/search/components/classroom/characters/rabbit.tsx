"use client";

import type React from "react";

interface CharacterProps {
  className?: string;
  style?: React.CSSProperties;
  isWorking?: boolean;
  isDone?: boolean;
}

export function Rabbit({ className, style, isWorking, isDone }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 80 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Rabbit adversarial agent"
      role="img"
    >
      <style>{`
        @keyframes rabbit-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes rabbit-pen-mark {
          0% { stroke-dashoffset: 20; opacity: 0.5; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes rabbit-pen-move {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes rabbit-ear-twitch {
          0%, 80%, 100% { transform: rotate(0deg); }
          85% { transform: rotate(-5deg); }
          90% { transform: rotate(5deg); }
          95% { transform: rotate(-3deg); }
        }
        .rabbit-body { transform-origin: 40px 60px; }
        .rabbit-body--working { animation: rabbit-bob 0.6s ease-in-out infinite; }
        .rabbit-left-ear { transform-origin: 28px 30px; }
        .rabbit-left-ear--working { animation: rabbit-ear-twitch 1.2s ease-in-out infinite; }
        .rabbit-right-ear { transform-origin: 52px 30px; }
        .rabbit-right-ear--working { animation: rabbit-ear-twitch 1.2s ease-in-out 0.2s infinite; }
        .rabbit-pen-arm { transform-origin: 54px 68px; }
        .rabbit-pen-arm--working { animation: rabbit-pen-move 0.5s ease-in-out infinite; }
        .rabbit-pen-mark {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          opacity: 0;
        }
        .rabbit-pen-mark--working {
          animation: rabbit-pen-mark 0.4s ease-in-out 0.3s infinite alternate;
        }
        .rabbit-raised-ear { opacity: 0; transition: opacity 0.3s ease; }
        .rabbit-raised-ear--done { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <g className={`rabbit-body${isWorking ? " rabbit-body--working" : ""}`}>
        {/* Long ears */}
        <g className={`rabbit-left-ear${isWorking ? " rabbit-left-ear--working" : ""}`}>
          <ellipse cx="28" cy="22" rx="7" ry="18" fill="#E8E0D8" />
          <ellipse cx="28" cy="22" rx="4" ry="14" fill="#F4B8C8" />
        </g>
        <g className={`rabbit-right-ear${isWorking ? " rabbit-right-ear--working" : ""}`}>
          <ellipse cx="52" cy="22" rx="7" ry="18" fill="#E8E0D8" />
          <ellipse cx="52" cy="22" rx="4" ry="14" fill="#F4B8C8" />
        </g>

        {/* Body */}
        <ellipse cx="40" cy="72" rx="16" ry="18" fill="#E8E0D8" />

        {/* Belly */}
        <ellipse cx="40" cy="75" rx="9" ry="12" fill="#F5F0EE" />

        {/* Fluffy tail */}
        <circle cx="40" cy="89" r="6" fill="white" />

        {/* Head */}
        <ellipse cx="40" cy="45" rx="16" ry="15" fill="#E8E0D8" />

        {/* Eyes — alert/narrow */}
        <ellipse cx="33" cy="43" rx="4" ry="3.5" fill="#2C1A3A" />
        <ellipse cx="47" cy="43" rx="4" ry="3.5" fill="#2C1A3A" />
        {/* Alert glint */}
        <circle cx="34.5" cy="41.5" r="1.2" fill="white" />
        <circle cx="48.5" cy="41.5" r="1.2" fill="white" />
        {/* Slightly narrowed brows for alert look */}
        <path d="M30 40 Q33 38.5 36 40" stroke="#8B7A8A" strokeWidth="1.2" fill="none" />
        <path d="M44 40 Q47 38.5 50 40" stroke="#8B7A8A" strokeWidth="1.2" fill="none" />

        {/* Nose */}
        <ellipse cx="40" cy="49" rx="2.5" ry="2" fill="#F4A0B0" />

        {/* Twitchy mouth */}
        <path d="M37 52 Q40 55 43 52" stroke="#C89090" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <line x1="40" y1="51" x2="40" y2="53" stroke="#C89090" strokeWidth="1" />

        {/* Whiskers */}
        <line x1="26" y1="50" x2="36" y2="50" stroke="#C8C0B8" strokeWidth="0.8" />
        <line x1="26" y1="52" x2="36" y2="53" stroke="#C8C0B8" strokeWidth="0.8" />
        <line x1="44" y1="50" x2="54" y2="50" stroke="#C8C0B8" strokeWidth="0.8" />
        <line x1="44" y1="53" x2="54" y2="52" stroke="#C8C0B8" strokeWidth="0.8" />

        {/* Left arm */}
        <ellipse cx="25" cy="70" rx="5" ry="9" fill="#E8E0D8" transform="rotate(-10 25 70)" />

        {/* Right arm holding red pen */}
        <g className={`rabbit-pen-arm${isWorking ? " rabbit-pen-arm--working" : ""}`}>
          <ellipse cx="55" cy="68" rx="5" ry="9" fill="#E8E0D8" transform="rotate(15 55 68)" />
          {/* Red pen */}
          <rect x="58" y="64" width="4" height="18" rx="2" fill="#EF4444" />
          <rect x="58" y="64" width="4" height="4" rx="1" fill="#B91C1C" />
          <polygon points="58,82 62,82 60,87" fill="#1F2937" />
          {/* Red pen tip mark when working */}
          <path
            d="M55 86 Q58 89 62 88"
            stroke="#EF4444"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`rabbit-pen-mark${isWorking ? " rabbit-pen-mark--working" : ""}`}
          />
        </g>

        {/* Legs */}
        <ellipse cx="31" cy="90" rx="8" ry="5" fill="#E8E0D8" />
        <ellipse cx="49" cy="90" rx="8" ry="5" fill="#E8E0D8" />

        {/* Done: raised ear (rabbits raise ears when happy) */}
        <g className={`rabbit-raised-ear${isDone ? " rabbit-raised-ear--done" : ""}`}>
          {/* Raised left paw */}
          <ellipse cx="23" cy="55" rx="5" ry="9" fill="#E8E0D8" transform="rotate(30 23 55)" />
          {/* Green checkmark */}
          <circle cx="12" cy="42" r="8" fill="#4CAF50" />
          <path d="M7 42 L11 47 L18 37" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
