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
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Rabbit adversarial agent"
      role="img"
    >
      <defs>
        <radialGradient id="rb-body-grad" cx="42%" cy="35%" r="58%">
          <stop offset="0%" stopColor="#F5F0EE" />
          <stop offset="55%" stopColor="#E0D8D4" />
          <stop offset="100%" stopColor="#C4BAB4" />
        </radialGradient>
        <radialGradient id="rb-head-grad" cx="38%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#F8F4F2" />
          <stop offset="55%" stopColor="#E8E0DC" />
          <stop offset="100%" stopColor="#CAC0BA" />
        </radialGradient>
        <radialGradient id="rb-belly-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5F0EE" />
        </radialGradient>
        <radialGradient id="rb-inner-ear" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFAABF" />
          <stop offset="100%" stopColor="#F07090" />
        </radialGradient>
        <radialGradient id="rb-cheek-l" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F9A8C0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F9A8C0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rb-cheek-r" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F9A8C0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F9A8C0" stopOpacity="0" />
        </radialGradient>
        <filter id="rb-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#8080A0" floodOpacity="0.2" />
        </filter>
        <linearGradient id="rb-pen-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="70%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes rb-breathe {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.022) scaleX(0.99); }
        }
        @keyframes rb-alert-sway {
          0%, 100% { transform: rotate(-1.2deg) translateX(0); }
          50% { transform: rotate(1.2deg) translateX(1px); }
        }
        @keyframes rb-ear-l-twitch {
          0%, 70%, 100% { transform: rotate(0deg) translateX(0); }
          76% { transform: rotate(-7deg) translateX(-1px); }
          84% { transform: rotate(4deg) translateX(1px); }
          90% { transform: rotate(-3deg); }
        }
        @keyframes rb-ear-r-tilt {
          0%, 100% { transform: rotate(-12deg); }
        }
        @keyframes rb-ear-r-twitch {
          0%, 60%, 100% { transform: rotate(-12deg); }
          66% { transform: rotate(-6deg); }
          74% { transform: rotate(-16deg); }
          82% { transform: rotate(-10deg); }
        }
        @keyframes rb-nose-wiggle {
          0%, 80%, 100% { transform: scaleX(1); }
          85% { transform: scaleX(1.25); }
          92% { transform: scaleX(0.85); }
        }
        @keyframes rb-blink {
          0%, 85%, 100% { transform: scaleY(1); }
          90% { transform: scaleY(0.06); }
          96% { transform: scaleY(1); }
        }
        @keyframes rb-pen-slash {
          0%, 100% { transform: rotate(-20deg) translateX(0) translateY(0); }
          20% { transform: rotate(5deg) translateX(8px) translateY(4px); }
          40% { transform: rotate(-25deg) translateX(-2px) translateY(-3px); }
          60% { transform: rotate(10deg) translateX(10px) translateY(5px); }
          80% { transform: rotate(-18deg) translateX(-1px) translateY(-2px); }
        }
        @keyframes rb-mark-appear {
          0%   { stroke-dashoffset: 24; opacity: 0; }
          30%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes rb-mark-fade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes rb-bob-working {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-6px) rotate(0.5deg); }
        }
        @keyframes rb-confetti-burst {
          0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--cx, 10px), var(--cy, -20px)) rotate(var(--cr, 90deg)) scale(0.3); }
        }

        .rb-whole { transform-origin: 60px 90px; }
        .rb-whole--idle { animation: rb-alert-sway 4.5s ease-in-out infinite; }
        .rb-whole--working { animation: rb-bob-working 0.6s ease-in-out infinite; }

        .rb-body-grp { transform-origin: 60px 100px; }
        .rb-body-grp--idle { animation: rb-breathe 3.6s ease-in-out infinite; }

        .rb-ear-l { transform-origin: 42px 32px; }
        .rb-ear-r { transform-origin: 78px 32px; }
        .rb-ear-l--idle { animation: rb-ear-l-twitch 3s ease-in-out 0s infinite; }
        .rb-ear-r--idle { animation: rb-ear-r-twitch 3.5s ease-in-out 0.6s infinite; }
        .rb-ear-l--working { animation: rb-ear-l-twitch 0.9s ease-in-out 0s infinite; }
        .rb-ear-r--working { animation: rb-ear-r-twitch 0.9s ease-in-out 0.2s infinite; }

        .rb-nose { transform-origin: 60px 72px; }
        .rb-nose--idle { animation: rb-nose-wiggle 2.5s ease-in-out 0.5s infinite; }
        .rb-nose--working { animation: rb-nose-wiggle 0.8s ease-in-out infinite; }

        .rb-blink-l { transform-origin: 46px 60px; }
        .rb-blink-r { transform-origin: 74px 60px; }
        .rb-blink-l--idle { animation: rb-blink 3.8s ease-in-out 0.3s infinite; }
        .rb-blink-r--idle { animation: rb-blink 3.8s ease-in-out 0.5s infinite; }

        .rb-pen-arm { transform-origin: 84px 100px; }
        .rb-pen-arm--idle { }
        .rb-pen-arm--working { animation: rb-pen-slash 0.5s ease-in-out infinite; }

        .rb-mark1 {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          opacity: 0;
        }
        .rb-mark2 {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          opacity: 0;
        }
        .rb-mark1--working { animation: rb-mark-appear 0.4s ease-out 0.1s infinite alternate; }
        .rb-mark2--working { animation: rb-mark-appear 0.4s ease-out 0.3s infinite alternate; }

        .rb-raised-paw { opacity: 0; }
        .rb-raised-paw--done { opacity: 1; }

        .rb-eye-done-l { opacity: 0; }
        .rb-eye-done-r { opacity: 0; }
        .rb-eye-done-l--done { opacity: 1; }
        .rb-eye-done-r--done { opacity: 1; }
        .rb-eye-normal-l--done { opacity: 0; }
        .rb-eye-normal-r--done { opacity: 0; }

        .rb-confetti rect {
          animation: rb-confetti-burst 0.9s ease-out forwards;
        }
        .rb-confetti--done rect { opacity: 1; }
        .rb-confetti rect:nth-child(1) { --cx: -14px; --cy: -22px; --cr: 115deg; animation-delay: 0s; }
        .rb-confetti rect:nth-child(2) { --cx: 14px; --cy: -26px; --cr: -82deg; animation-delay: 0.07s; }
        .rb-confetti rect:nth-child(3) { --cx: -20px; --cy: -18px; --cr: 200deg; animation-delay: 0.1s; }
        .rb-confetti rect:nth-child(4) { --cx: 20px; --cy: -20px; --cr: -140deg; animation-delay: 0.04s; }
        .rb-confetti rect:nth-child(5) { --cx: 1px; --cy: -30px; --cr: 58deg; animation-delay: 0.13s; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <g className={`rb-whole${isWorking ? " rb-whole--working" : " rb-whole--idle"}`}>
        {/* Long ears — render before head so head overlaps */}
        {/* Left ear — upright and alert */}
        <g className={`rb-ear-l${isWorking ? " rb-ear-l--working" : " rb-ear-l--idle"}`}>
          <ellipse cx="42" cy="26" rx="10" ry="24" fill="url(#rb-body-grad)" />
          <ellipse cx="42" cy="26" rx="6.5" ry="19" fill="url(#rb-inner-ear)" />
          {/* Ear highlight */}
          <ellipse cx="39" cy="18" rx="2.5" ry="5" fill="white" opacity="0.25" />
        </g>

        {/* Right ear — slightly tilted */}
        <g
          className={`rb-ear-r${isWorking ? " rb-ear-r--working" : " rb-ear-r--idle"}`}
          transform="rotate(-12, 78, 32)"
        >
          <ellipse cx="78" cy="26" rx="10" ry="24" fill="url(#rb-body-grad)" />
          <ellipse cx="78" cy="26" rx="6.5" ry="19" fill="url(#rb-inner-ear)" />
          <ellipse cx="75" cy="18" rx="2.5" ry="5" fill="white" opacity="0.25" />
        </g>

        {/* Body group */}
        <g className={`rb-body-grp${!isWorking && !isDone ? " rb-body-grp--idle" : ""}`}>
          {/* Main body */}
          <ellipse
            cx="60"
            cy="100"
            rx="26"
            ry="30"
            fill="url(#rb-body-grad)"
            filter="url(#rb-shadow)"
          />

          {/* Belly */}
          <ellipse cx="60" cy="104" rx="16" ry="20" fill="url(#rb-belly-grad)" />

          {/* Body highlight */}
          <ellipse cx="52" cy="93" rx="9" ry="6" fill="white" opacity="0.2" />

          {/* Fluffy round tail */}
          <circle cx="60" cy="127" r="9" fill="white" />
          <circle cx="60" cy="127" r="7" fill="#F5F0EE" />
          <circle cx="58" cy="124" r="3" fill="white" opacity="0.6" />

          {/* Left arm */}
          <ellipse cx="36" cy="100" rx="8" ry="13" fill="#E0D8D4" transform="rotate(-12 36 100)" />
          <ellipse cx="32" cy="111" rx="7" ry="5.5" fill="#CCC4C0" />
          {/* Paw toes */}
          <circle cx="29" cy="112" r="2.5" fill="#B8B0AC" opacity="0.6" />
          <circle cx="33" cy="114" r="2.5" fill="#B8B0AC" opacity="0.6" />

          {/* Right arm — red pen arm */}
          <g className={`rb-pen-arm${isWorking ? " rb-pen-arm--working" : ""}`}>
            <ellipse cx="84" cy="100" rx="8" ry="13" fill="#E0D8D4" transform="rotate(14 84 100)" />
            <ellipse cx="88" cy="111" rx="7" ry="5.5" fill="#CCC4C0" />
            {/* Red pen — held like a sword */}
            <rect x="87" y="88" width="7" height="28" rx="3" fill="url(#rb-pen-grad)" />
            {/* Pen cap */}
            <rect x="87" y="88" width="7" height="6" rx="2.5" fill="#B91C1C" />
            {/* Pen clip */}
            <rect x="91" y="90" width="1.5" height="10" rx="0.5" fill="#DC2626" opacity="0.7" />
            {/* Pen tip */}
            <polygon points="87,116 94,116 90.5,124" fill="#0F172A" />
            <polygon points="88.5,116 92.5,116 90.5,121" fill="#334155" />
            {/* Pen body highlight */}
            <rect x="88" y="89" width="2.5" height="22" rx="1" fill="white" opacity="0.25" />
          </g>

          {/* Red slash marks appearing when working */}
          <path
            d="M76 108 Q82 104 88 110"
            stroke="#EF4444"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className={`rb-mark1${isWorking ? " rb-mark1--working" : ""}`}
          />
          <path
            d="M74 115 Q80 111 86 117"
            stroke="#EF4444"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className={`rb-mark2${isWorking ? " rb-mark2--working" : ""}`}
          />

          {/* Legs */}
          <ellipse cx="46" cy="126" rx="12" ry="8" fill="#D4CCC8" />
          <ellipse cx="74" cy="126" rx="12" ry="8" fill="#D4CCC8" />
          <ellipse cx="44" cy="131" rx="10" ry="5" fill="#C4BAB6" />
          <ellipse cx="72" cy="131" rx="10" ry="5" fill="#C4BAB6" />
        </g>

        {/* Head */}
        <ellipse
          cx="60"
          cy="64"
          rx="24"
          ry="22"
          fill="url(#rb-head-grad)"
          filter="url(#rb-shadow)"
        />

        {/* Head highlight */}
        <ellipse cx="48" cy="52" rx="11" ry="8" fill="white" opacity="0.18" />

        {/* Rosy cheeks */}
        <ellipse cx="40" cy="68" rx="10" ry="8" fill="url(#rb-cheek-l)" />
        <ellipse cx="80" cy="68" rx="10" ry="8" fill="url(#rb-cheek-r)" />

        {/* Alert eyes with furrowed brows */}
        {/* Brows */}
        <path
          d="M38 55 Q46 52 54 56"
          stroke="#9090A8"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M66 56 Q74 52 82 55"
          stroke="#9090A8"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Normal eyes */}
        <g className={`rb-eye-normal-l${isDone ? " rb-eye-normal-l--done" : ""}`}>
          <ellipse cx="46" cy="62" rx="7" ry="6" fill="white" />
          <ellipse cx="46" cy="62" rx="5" ry="4.5" fill="#2C1A3A" />
          <ellipse cx="46" cy="62" rx="3" ry="2.8" fill="#160C20" />
          <circle cx="47.8" cy="60" r="2" fill="white" />
          <circle cx="44.8" cy="63.5" r="1" fill="white" opacity="0.5" />
          {/* Blink overlay */}
          <ellipse
            cx="46"
            cy="62"
            rx="7"
            ry="6"
            fill="#E8E0DC"
            className={`rb-blink-l${!isWorking && !isDone ? " rb-blink-l--idle" : ""}`}
          />
        </g>
        <g className={`rb-eye-normal-r${isDone ? " rb-eye-normal-r--done" : ""}`}>
          <ellipse cx="74" cy="62" rx="7" ry="6" fill="white" />
          <ellipse cx="74" cy="62" rx="5" ry="4.5" fill="#2C1A3A" />
          <ellipse cx="74" cy="62" rx="3" ry="2.8" fill="#160C20" />
          <circle cx="75.8" cy="60" r="2" fill="white" />
          <circle cx="72.8" cy="63.5" r="1" fill="white" opacity="0.5" />
          {/* Blink overlay */}
          <ellipse
            cx="74"
            cy="62"
            rx="7"
            ry="6"
            fill="#E8E0DC"
            className={`rb-blink-r${!isWorking && !isDone ? " rb-blink-r--idle" : ""}`}
          />
        </g>

        {/* Happy squinty eyes (done) */}
        <g className={`rb-eye-done-l${isDone ? " rb-eye-done-l--done" : ""}`}>
          <path
            d="M40 64 Q46 56 52 64"
            stroke="#2C1A3A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g className={`rb-eye-done-r${isDone ? " rb-eye-done-r--done" : ""}`}>
          <path
            d="M68 64 Q74 56 80 64"
            stroke="#2C1A3A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Nose — wiggles */}
        <g className={`rb-nose${isWorking ? " rb-nose--working" : " rb-nose--idle"}`}>
          <ellipse cx="60" cy="72" rx="4" ry="3.2" fill="#F4A0B8" />
          <ellipse cx="58.5" cy="71" rx="1.4" ry="1" fill="white" opacity="0.5" />
        </g>

        {/* Twitchy mouth */}
        <path
          d="M55 76 Q60 81 65 76"
          stroke="#C89090"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="60" y1="75" x2="60" y2="77" stroke="#C89090" strokeWidth="1.2" />

        {/* Whiskers */}
        <line x1="30" y1="71" x2="46" y2="72" stroke="#C8C0B8" strokeWidth="0.9" opacity="0.7" />
        <line x1="30" y1="74" x2="46" y2="74" stroke="#C8C0B8" strokeWidth="0.9" opacity="0.7" />
        <line x1="30" y1="77" x2="46" y2="76" stroke="#C8C0B8" strokeWidth="0.9" opacity="0.5" />
        <line x1="74" y1="72" x2="90" y2="71" stroke="#C8C0B8" strokeWidth="0.9" opacity="0.7" />
        <line x1="74" y1="74" x2="90" y2="74" stroke="#C8C0B8" strokeWidth="0.9" opacity="0.7" />
        <line x1="74" y1="76" x2="90" y2="77" stroke="#C8C0B8" strokeWidth="0.9" opacity="0.5" />

        {/* Done: raised paw with checkmark */}
        <g className={`rb-raised-paw${isDone ? " rb-raised-paw--done" : ""}`}>
          <ellipse cx="36" cy="74" rx="8" ry="13" fill="#E0D8D4" transform="rotate(36 36 74)" />
          <ellipse cx="28" cy="62" rx="7" ry="5.5" fill="#CCC4C0" />
          <circle cx="18" cy="48" r="13" fill="#22C55E" />
          <circle cx="18" cy="48" r="11" fill="#16A34A" />
          <path
            d="M11 48 L16 54 L26 40"
            stroke="white"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 38 L8 34 M6 40 L2 38 M4 44 L0 46"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M28 38 L28 34 M30 40 L34 38 M32 44 L36 46"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Confetti */}
        <g
          className={`rb-confetti${isDone ? " rb-confetti--done" : ""}`}
          style={{ opacity: isDone ? 1 : 0 }}
        >
          <rect
            x="59"
            y="45"
            width="5"
            height="5"
            rx="1"
            fill="#F59E0B"
            transform="rotate(15 59 45)"
          />
          <rect
            x="70"
            y="40"
            width="4"
            height="4"
            rx="0.5"
            fill="#EC4899"
            transform="rotate(-20 70 40)"
          />
          <rect
            x="48"
            y="43"
            width="4"
            height="6"
            rx="1"
            fill="#6366F1"
            transform="rotate(35 48 43)"
          />
          <rect
            x="80"
            y="45"
            width="3"
            height="5"
            rx="0.5"
            fill="#14B8A6"
            transform="rotate(-10 80 45)"
          />
          <rect
            x="62"
            y="36"
            width="4"
            height="4"
            rx="0.5"
            fill="#F97316"
            transform="rotate(50 62 36)"
          />
        </g>
      </g>
    </svg>
  );
}
