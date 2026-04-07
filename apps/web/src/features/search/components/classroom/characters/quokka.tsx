"use client";

import type React from "react";

interface CharacterProps {
  className?: string;
  style?: React.CSSProperties;
  isWorking?: boolean;
  isDone?: boolean;
}

export function Quokka({ className, style, isWorking, isDone }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 80 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Quokka teacher"
      role="img"
    >
      <style>{`
        @keyframes quokka-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes quokka-chalk {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        .quokka-body { transform-origin: 40px 60px; }
        .quokka-body--working { animation: quokka-bob 0.7s ease-in-out infinite; }
        .quokka-chalk-arm { transform-origin: 55px 65px; }
        .quokka-chalk-arm--working { animation: quokka-chalk 0.5s ease-in-out infinite; }
        .quokka-raised-paw { opacity: 0; transition: opacity 0.3s ease; }
        .quokka-raised-paw--done { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Body group */}
      <g className={`quokka-body${isWorking ? " quokka-body--working" : ""}`}>
        {/* Tail */}
        <ellipse cx="32" cy="88" rx="7" ry="4" fill="#8B6344" />

        {/* Body */}
        <ellipse cx="40" cy="70" rx="18" ry="20" fill="#C49A6C" />

        {/* Belly */}
        <ellipse cx="40" cy="73" rx="10" ry="13" fill="#E8C9A0" />

        {/* Head */}
        <ellipse cx="40" cy="42" rx="17" ry="16" fill="#C49A6C" />

        {/* Ears */}
        <ellipse cx="26" cy="30" rx="6" ry="8" fill="#C49A6C" />
        <ellipse cx="54" cy="30" rx="6" ry="8" fill="#C49A6C" />
        <ellipse cx="26" cy="30" rx="3" ry="5" fill="#E8A090" />
        <ellipse cx="54" cy="30" rx="3" ry="5" fill="#E8A090" />

        {/* Eyes */}
        <circle cx="33" cy="40" r="4" fill="#4A2C0A" />
        <circle cx="47" cy="40" r="4" fill="#4A2C0A" />
        {/* Eye shine */}
        <circle cx="34.5" cy="38.5" r="1.2" fill="white" />
        <circle cx="48.5" cy="38.5" r="1.2" fill="white" />

        {/* Nose */}
        <ellipse cx="40" cy="47" rx="3" ry="2" fill="#D4836A" />

        {/* Smile */}
        <path d="M35 51 Q40 55 45 51" stroke="#8B4513" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Left arm (resting) */}
        <ellipse cx="24" cy="66" rx="5" ry="8" fill="#C49A6C" transform="rotate(-15 24 66)" />

        {/* Right arm holding chalk */}
        <g className={`quokka-chalk-arm${isWorking ? " quokka-chalk-arm--working" : ""}`}>
          <ellipse cx="56" cy="66" rx="5" ry="8" fill="#C49A6C" transform="rotate(15 56 66)" />
          {/* Chalk */}
          <rect x="59" y="68" width="4" height="14" rx="1" fill="white" />
          <rect x="59" y="80" width="4" height="3" rx="0.5" fill="#E8E0D0" />
        </g>

        {/* Legs */}
        <ellipse cx="33" cy="88" rx="7" ry="5" fill="#C49A6C" />
        <ellipse cx="47" cy="88" rx="7" ry="5" fill="#C49A6C" />

        {/* Done: raised paw */}
        <g className={`quokka-raised-paw${isDone ? " quokka-raised-paw--done" : ""}`}>
          <ellipse cx="54" cy="50" rx="5" ry="6" fill="#C49A6C" transform="rotate(-30 54 50)" />
          {/* Green checkmark */}
          <circle cx="62" cy="38" r="8" fill="#4CAF50" />
          <path d="M57 38 L61 43 L68 33" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
