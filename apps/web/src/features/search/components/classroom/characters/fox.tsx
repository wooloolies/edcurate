"use client";

import type React from "react";

interface CharacterProps {
  className?: string;
  style?: React.CSSProperties;
  isWorking?: boolean;
  isDone?: boolean;
}

export function Fox({ className, style, isWorking, isDone }: CharacterProps) {
  return (
    <svg
      viewBox="0 0 80 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Fox federated search agent"
      role="img"
    >
      <style>{`
        @keyframes fox-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes fox-screen-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes fox-type {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-2px) rotate(-5deg); }
        }
        .fox-body { transform-origin: 40px 60px; }
        .fox-body--working { animation: fox-bob 0.7s ease-in-out infinite; }
        .fox-laptop-screen { }
        .fox-laptop-screen--working { animation: fox-screen-glow 0.8s ease-in-out infinite; }
        .fox-paw-typing { transform-origin: 40px 80px; }
        .fox-paw-typing--working { animation: fox-type 0.4s ease-in-out infinite; }
        .fox-raised-paw { opacity: 0; transition: opacity 0.3s ease; }
        .fox-raised-paw--done { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <g className={`fox-body${isWorking ? " fox-body--working" : ""}`}>
        {/* Tail */}
        <path d="M52 85 Q68 78 66 92 Q60 98 50 92 Z" fill="#E8722A" />
        <path d="M60 90 Q66 88 65 93 Q61 96 56 93 Z" fill="white" />

        {/* Body */}
        <ellipse cx="38" cy="70" rx="16" ry="18" fill="#E8722A" />

        {/* Belly */}
        <ellipse cx="38" cy="73" rx="9" ry="12" fill="#F5D5B0" />

        {/* Head */}
        <ellipse cx="38" cy="40" rx="17" ry="15" fill="#E8722A" />

        {/* Pointy ears */}
        <polygon points="24,32 20,18 32,28" fill="#E8722A" />
        <polygon points="52,32 56,18 44,28" fill="#E8722A" />
        <polygon points="25,31 22,21 31,27" fill="#D4603A" />
        <polygon points="51,31 54,21 45,27" fill="#D4603A" />
        {/* Inner ear */}
        <polygon points="25,31 22.5,22 30,27" fill="#E89090" />
        <polygon points="51,31 53.5,22 46,27" fill="#E89090" />

        {/* White face mask */}
        <ellipse cx="38" cy="45" rx="10" ry="9" fill="#F5D5B0" />

        {/* Eyes */}
        <circle cx="32" cy="40" r="3.5" fill="#3D2B0A" />
        <circle cx="44" cy="40" r="3.5" fill="#3D2B0A" />
        <circle cx="33" cy="38.5" r="1" fill="white" />
        <circle cx="45" cy="38.5" r="1" fill="white" />

        {/* Nose */}
        <ellipse cx="38" cy="46" rx="2.5" ry="2" fill="#3D2B0A" />

        {/* Mouth */}
        <path d="M34 49 Q38 53 42 49" stroke="#A0522D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <line x1="38" y1="48" x2="38" y2="50" stroke="#A0522D" strokeWidth="1" />

        {/* White chin marking */}
        <path d="M30 50 Q38 56 46 50" fill="#F5D5B0" />

        {/* Arms */}
        <ellipse cx="24" cy="68" rx="5" ry="9" fill="#E8722A" transform="rotate(-10 24 68)" />

        {/* Laptop */}
        <g>
          {/* Laptop base */}
          <rect x="20" y="80" width="32" height="3" rx="1.5" fill="#374151" />
          {/* Laptop screen (open) */}
          <rect x="22" y="60" width="28" height="20" rx="2" fill="#1F2937" transform="rotate(-10 22 60)" />
          {/* Screen content */}
          <rect
            x="24"
            y="62"
            width="24"
            height="16"
            rx="1"
            fill="#3B82F6"
            className={`fox-laptop-screen${isWorking ? " fox-laptop-screen--working" : ""}`}
            transform="rotate(-10 24 62)"
          />
          {/* Screen glow lines */}
          <line x1="25" y1="65" x2="43" y2="63" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          <line x1="25" y1="68" x2="43" y2="66" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="25" y1="71" x2="38" y2="70" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          {/* Laptop hinge */}
          <rect x="20" y="79" width="32" height="2" rx="1" fill="#4B5563" />
        </g>

        {/* Typing paw */}
        <g className={`fox-paw-typing${isWorking ? " fox-paw-typing--working" : ""}`}>
          <ellipse cx="52" cy="73" rx="5" ry="7" fill="#E8722A" transform="rotate(15 52 73)" />
        </g>

        {/* Legs/feet */}
        <ellipse cx="32" cy="89" rx="7" ry="5" fill="#E8722A" />
        <ellipse cx="46" cy="89" rx="7" ry="5" fill="#D4603A" />

        {/* Done: raised paw */}
        <g className={`fox-raised-paw${isDone ? " fox-raised-paw--done" : ""}`}>
          <ellipse cx="54" cy="54" rx="5" ry="8" fill="#E8722A" transform="rotate(-35 54 54)" />
          {/* Green checkmark */}
          <circle cx="64" cy="40" r="8" fill="#4CAF50" />
          <path d="M59 40 L63 45 L70 35" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
