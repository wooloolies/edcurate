"use client";

import type React from "react";

interface CharacterProps {
  className?: string;
  style?: React.CSSProperties;
  isWorking?: boolean;
  isDone?: boolean;
}

export function Owl({ className, style, isWorking, isDone }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 80 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Owl search query agent"
      role="img"
    >
      <style>{`
        @keyframes owl-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes owl-glass-glow {
          0%, 100% { opacity: 0.4; r: 10; }
          50% { opacity: 0.9; r: 12; }
        }
        @keyframes owl-glass-pulse {
          0%, 100% { filter: drop-shadow(0 0 2px #818CF8); }
          50% { filter: drop-shadow(0 0 8px #818CF8); }
        }
        .owl-body { transform-origin: 40px 60px; }
        .owl-body--working { animation: owl-bob 0.8s ease-in-out infinite; }
        .owl-magnifier { transform-origin: 52px 72px; }
        .owl-magnifier--working { animation: owl-glass-pulse 0.8s ease-in-out infinite; }
        .owl-magnifier-glow { opacity: 0; transition: opacity 0.3s ease; }
        .owl-magnifier-glow--working { animation: owl-glass-glow 0.8s ease-in-out infinite; }
        .owl-raised-wing { opacity: 0; transition: opacity 0.3s ease; }
        .owl-raised-wing--done { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <g className={`owl-body${isWorking ? " owl-body--working" : ""}`}>
        {/* Body */}
        <ellipse cx="40" cy="72" rx="17" ry="20" fill="#6D5B9C" />

        {/* Wing markings */}
        <ellipse cx="27" cy="68" rx="8" ry="12" fill="#5B4A85" />
        <ellipse cx="53" cy="68" rx="8" ry="12" fill="#5B4A85" />

        {/* Belly */}
        <ellipse cx="40" cy="75" rx="9" ry="12" fill="#E8D8B0" />

        {/* Feather stripes on belly */}
        <path d="M33 70 Q40 68 47 70" stroke="#C8B890" strokeWidth="1" fill="none" />
        <path d="M33 74 Q40 72 47 74" stroke="#C8B890" strokeWidth="1" fill="none" />
        <path d="M33 78 Q40 76 47 78" stroke="#C8B890" strokeWidth="1" fill="none" />

        {/* Head */}
        <ellipse cx="40" cy="40" rx="18" ry="18" fill="#7C6BAB" />

        {/* Ear tufts */}
        <polygon points="26,26 23,16 30,22" fill="#6D5B9C" />
        <polygon points="54,26 57,16 50,22" fill="#6D5B9C" />

        {/* Face disc */}
        <ellipse cx="40" cy="42" rx="13" ry="12" fill="#C8A86E" />

        {/* Big eyes */}
        <circle cx="33" cy="40" r="7" fill="white" />
        <circle cx="47" cy="40" r="7" fill="white" />
        <circle cx="33" cy="40" r="5" fill="#4338CA" />
        <circle cx="47" cy="40" r="5" fill="#4338CA" />
        <circle cx="33" cy="40" r="3" fill="#1E1B4B" />
        <circle cx="47" cy="40" r="3" fill="#1E1B4B" />
        {/* Eye shine */}
        <circle cx="34.5" cy="38" r="1.5" fill="white" />
        <circle cx="48.5" cy="38" r="1.5" fill="white" />

        {/* Beak */}
        <polygon points="40,45 36,50 44,50" fill="#D4974A" />

        {/* Feet */}
        <ellipse cx="33" cy="91" rx="6" ry="3" fill="#C49A2C" />
        <ellipse cx="47" cy="91" rx="6" ry="3" fill="#C49A2C" />
        {/* Talons */}
        <line x1="28" y1="93" x2="26" y2="96" stroke="#C49A2C" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="33" y1="93" x2="33" y2="96" stroke="#C49A2C" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="93" x2="40" y2="96" stroke="#C49A2C" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="42" y1="93" x2="40" y2="96" stroke="#C49A2C" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="47" y1="93" x2="47" y2="96" stroke="#C49A2C" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="52" y1="93" x2="54" y2="96" stroke="#C49A2C" strokeWidth="1.5" strokeLinecap="round" />

        {/* Left wing/arm */}
        <ellipse cx="24" cy="68" rx="6" ry="10" fill="#7C6BAB" transform="rotate(-10 24 68)" />

        {/* Right wing holding magnifying glass */}
        <g className={`owl-magnifier${isWorking ? " owl-magnifier--working" : ""}`}>
          <ellipse cx="56" cy="68" rx="6" ry="10" fill="#7C6BAB" transform="rotate(10 56 68)" />
          {/* Magnifying glass handle */}
          <line x1="59" y1="77" x2="65" y2="85" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round" />
          {/* Magnifying glass circle */}
          <circle cx="55" cy="72" r="8" fill="none" stroke="#8B7355" strokeWidth="2.5" />
          {/* Glass lens */}
          <circle cx="55" cy="72" r="6.5" fill="rgba(165,180,252,0.3)" />
          {/* Glow effect when working */}
          <circle
            cx="55"
            cy="72"
            r="6.5"
            fill="rgba(99,102,241,0.25)"
            className={`owl-magnifier-glow${isWorking ? " owl-magnifier-glow--working" : ""}`}
          />
          {/* Search cross hairs */}
          <line x1="55" y1="66" x2="55" y2="78" stroke="rgba(99,102,241,0.5)" strokeWidth="1" />
          <line x1="49" y1="72" x2="61" y2="72" stroke="rgba(99,102,241,0.5)" strokeWidth="1" />
        </g>

        {/* Done: raised wing */}
        <g className={`owl-raised-wing${isDone ? " owl-raised-wing--done" : ""}`}>
          <ellipse cx="56" cy="52" rx="6" ry="10" fill="#7C6BAB" transform="rotate(-40 56 52)" />
          {/* Green checkmark */}
          <circle cx="65" cy="36" r="8" fill="#4CAF50" />
          <path d="M60 36 L64 41 L71 31" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
