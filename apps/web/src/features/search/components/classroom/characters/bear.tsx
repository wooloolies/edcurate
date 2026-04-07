"use client";

import type React from "react";

interface CharacterProps {
  className?: string;
  style?: React.CSSProperties;
  isWorking?: boolean;
  isDone?: boolean;
}

export function Bear({ className, style, isWorking, isDone }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 80 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Bear evaluation agent"
      role="img"
    >
      <style>{`
        @keyframes bear-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes bear-check-appear {
          0% { opacity: 0; transform: scale(0.5); }
          60% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bear-pen-tap {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .bear-body { transform-origin: 40px 60px; }
        .bear-body--working { animation: bear-bob 0.9s ease-in-out infinite; }
        .bear-check1 { opacity: 0; }
        .bear-check2 { opacity: 0; }
        .bear-check3 { opacity: 0; }
        .bear-check1--working { animation: bear-check-appear 0.5s ease-out 0.0s forwards; }
        .bear-check2--working { animation: bear-check-appear 0.5s ease-out 0.4s forwards; }
        .bear-check3--working { animation: bear-check-appear 0.5s ease-out 0.8s both; }
        .bear-pen { transform-origin: 57px 68px; }
        .bear-pen--working { animation: bear-pen-tap 0.5s ease-in-out infinite; }
        .bear-raised-paw { opacity: 0; transition: opacity 0.3s ease; }
        .bear-raised-paw--done { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <g className={`bear-body${isWorking ? " bear-body--working" : ""}`}>
        {/* Body (chubby) */}
        <ellipse cx="40" cy="72" rx="20" ry="22" fill="#5C3D2E" />

        {/* Belly (lighter) */}
        <ellipse cx="40" cy="76" rx="12" ry="15" fill="#8B6144" />

        {/* Head */}
        <ellipse cx="40" cy="40" rx="19" ry="18" fill="#5C3D2E" />

        {/* Round ears */}
        <circle cx="24" cy="26" r="8" fill="#5C3D2E" />
        <circle cx="56" cy="26" r="8" fill="#5C3D2E" />
        <circle cx="24" cy="26" r="5" fill="#7A5040" />
        <circle cx="56" cy="26" r="5" fill="#7A5040" />
        <circle cx="24" cy="26" r="3" fill="#8B6144" />
        <circle cx="56" cy="26" r="3" fill="#8B6144" />

        {/* Snout */}
        <ellipse cx="40" cy="48" rx="9" ry="7" fill="#8B6144" />

        {/* Eyes */}
        <circle cx="33" cy="38" r="4" fill="#2C1A0E" />
        <circle cx="47" cy="38" r="4" fill="#2C1A0E" />
        <circle cx="34.2" cy="36.5" r="1.3" fill="white" />
        <circle cx="48.2" cy="36.5" r="1.3" fill="white" />

        {/* Nose */}
        <ellipse cx="40" cy="46" rx="3.5" ry="2.5" fill="#2C1A0E" />

        {/* Smile */}
        <path d="M35 51 Q40 56 45 51" stroke="#2C1A0E" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Left arm */}
        <ellipse cx="22" cy="70" rx="7" ry="12" fill="#5C3D2E" transform="rotate(-10 22 70)" />
        <circle cx="18" cy="80" r="5" fill="#5C3D2E" />

        {/* Clipboard */}
        <g>
          {/* Clipboard board */}
          <rect x="44" y="57" width="24" height="30" rx="2" fill="#D4A96A" />
          <rect x="44" y="57" width="24" height="30" rx="2" fill="none" stroke="#B8904A" strokeWidth="1" />
          {/* Clipboard clip */}
          <rect x="50" y="54" width="12" height="6" rx="2" fill="#B8904A" />
          <rect x="53" y="52" width="6" height="4" rx="1" fill="#8B6A30" />
          {/* Paper lines */}
          <line x1="48" y1="66" x2="64" y2="66" stroke="#B8904A" strokeWidth="1" />
          <line x1="48" y1="71" x2="64" y2="71" stroke="#B8904A" strokeWidth="1" />
          <line x1="48" y1="76" x2="64" y2="76" stroke="#B8904A" strokeWidth="1" />
          <line x1="48" y1="81" x2="58" y2="81" stroke="#B8904A" strokeWidth="1" />

          {/* Checkmarks appearing when working */}
          <g
            className={`bear-check1${isWorking ? " bear-check1--working" : ""}${isDone ? "" : ""}`}
            style={isDone ? { opacity: 1 } : {}}
          >
            <path d="M47 64 L49.5 67 L54 62" stroke="#22C55E" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g
            className={`bear-check2${isWorking ? " bear-check2--working" : ""}`}
            style={isDone ? { opacity: 1 } : {}}
          >
            <path d="M47 69 L49.5 72 L54 67" stroke="#22C55E" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g
            className={`bear-check3${isWorking ? " bear-check3--working" : ""}`}
            style={isDone ? { opacity: 1 } : {}}
          >
            <path d="M47 74 L49.5 77 L54 72" stroke="#22C55E" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>

        {/* Right arm holding clipboard */}
        <g className={`bear-pen${isWorking ? " bear-pen--working" : ""}`}>
          <ellipse cx="57" cy="68" rx="7" ry="11" fill="#5C3D2E" transform="rotate(15 57 68)" />
        </g>

        {/* Legs */}
        <ellipse cx="31" cy="92" rx="9" ry="6" fill="#5C3D2E" />
        <ellipse cx="49" cy="92" rx="9" ry="6" fill="#5C3D2E" />

        {/* Done: raised paw */}
        <g className={`bear-raised-paw${isDone ? " bear-raised-paw--done" : ""}`}>
          <ellipse cx="22" cy="52" rx="7" ry="11" fill="#5C3D2E" transform="rotate(25 22 52)" />
          {/* Green checkmark */}
          <circle cx="12" cy="38" r="8" fill="#4CAF50" />
          <path d="M7 38 L11 43 L18 33" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
