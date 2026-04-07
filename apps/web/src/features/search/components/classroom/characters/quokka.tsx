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
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Quokka teacher"
      role="img"
    >
      <defs>
        <radialGradient id="q-body-grad" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#E8B87A" />
          <stop offset="60%" stopColor="#C49A6C" />
          <stop offset="100%" stopColor="#A07848" />
        </radialGradient>
        <radialGradient id="q-head-grad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#EDBE84" />
          <stop offset="65%" stopColor="#C49A6C" />
          <stop offset="100%" stopColor="#9E7240" />
        </radialGradient>
        <radialGradient id="q-belly-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#F5DEB5" />
          <stop offset="100%" stopColor="#E8C99A" />
        </radialGradient>
        <radialGradient id="q-cheek-l" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A0A0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F4A0A0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="q-cheek-r" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A0A0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F4A0A0" stopOpacity="0" />
        </radialGradient>
        <filter id="q-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#7A5030" floodOpacity="0.25" />
        </filter>
        <linearGradient id="q-chalk-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#F0EEE8" />
          <stop offset="100%" stopColor="#E0DDD0" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes q-breathe {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.025) scaleX(0.99); }
        }
        @keyframes q-sway {
          0%, 100% { transform: rotate(-1.2deg) translateX(0px); }
          50% { transform: rotate(1.2deg) translateX(1px); }
        }
        @keyframes q-blink {
          0%, 88%, 100% { transform: scaleY(1); }
          92% { transform: scaleY(0.08); }
          96% { transform: scaleY(1); }
        }
        @keyframes q-tail-sway {
          0%, 100% { transform: rotate(-8deg) translateX(0); }
          50% { transform: rotate(8deg) translateX(2px); }
        }
        @keyframes q-chalk-tap {
          0%, 100% { transform: rotate(-8deg) translateY(0); }
          40% { transform: rotate(-2deg) translateY(2px); }
          60% { transform: rotate(-12deg) translateY(-1px); }
        }
        @keyframes q-chalk-scribble {
          0%   { transform: rotate(-20deg) translateY(-2px); }
          25%  { transform: rotate(10deg) translateY(3px); }
          50%  { transform: rotate(-15deg) translateY(0px); }
          75%  { transform: rotate(15deg) translateY(2px); }
          100% { transform: rotate(-20deg) translateY(-2px); }
        }
        @keyframes q-dust-float {
          0%   { opacity: 0; transform: translate(0, 0) scale(0.5); }
          30%  { opacity: 0.8; transform: translate(-4px, -6px) scale(1); }
          70%  { opacity: 0.5; transform: translate(-8px, -12px) scale(0.8); }
          100% { opacity: 0; transform: translate(-12px, -18px) scale(0.3); }
        }
        @keyframes q-dust-float2 {
          0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
          40%  { opacity: 0.7; transform: translate(5px, -8px) scale(0.9); }
          80%  { opacity: 0.3; transform: translate(9px, -14px) scale(0.6); }
          100% { opacity: 0; transform: translate(12px, -20px) scale(0.2); }
        }
        @keyframes q-bob-working {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        @keyframes q-squint {
          0%, 100% { transform: scaleY(1); }
        }
        @keyframes q-confetti-burst {
          0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--cx, 10px), var(--cy, -20px)) rotate(var(--cr, 90deg)) scale(0.3); }
        }

        .q-whole { transform-origin: 60px 90px; }
        .q-whole--idle { animation: q-sway 4.5s ease-in-out infinite; }
        .q-whole--working { animation: q-bob-working 0.65s ease-in-out infinite; }

        .q-body-grp { transform-origin: 60px 95px; }
        .q-body-grp--idle { animation: q-breathe 3.8s ease-in-out infinite; }

        .q-tail { transform-origin: 38px 112px; }
        .q-tail--idle { animation: q-tail-sway 2.8s ease-in-out infinite; }
        .q-tail--working { animation: q-tail-sway 1.2s ease-in-out infinite; }

        .q-blink-l { transform-origin: 47px 58px; }
        .q-blink-r { transform-origin: 73px 58px; }
        .q-blink-l--idle { animation: q-blink 4.2s ease-in-out 0.6s infinite; }
        .q-blink-r--idle { animation: q-blink 4.2s ease-in-out 0.7s infinite; }

        .q-chalk-arm { transform-origin: 82px 90px; }
        .q-chalk-arm--idle { animation: q-chalk-tap 2.5s ease-in-out infinite; }
        .q-chalk-arm--working { animation: q-chalk-scribble 0.45s ease-in-out infinite; }

        .q-dust1 { transform-origin: 88px 92px; }
        .q-dust2 { transform-origin: 92px 88px; }
        .q-dust1--working { animation: q-dust-float 0.8s ease-out 0s infinite; }
        .q-dust2--working { animation: q-dust-float2 0.8s ease-out 0.25s infinite; }

        .q-raised-paw { opacity: 0; }
        .q-raised-paw--done { opacity: 1; }

        .q-eye-done-l { opacity: 0; }
        .q-eye-done-r { opacity: 0; }
        .q-eye-done-l--done { opacity: 1; }
        .q-eye-done-r--done { opacity: 1; }
        .q-eye-normal-l { opacity: 1; }
        .q-eye-normal-r { opacity: 1; }
        .q-eye-normal-l--done { opacity: 0; }
        .q-eye-normal-r--done { opacity: 0; }

        .q-confetti rect {
          animation: q-confetti-burst 0.9s ease-out forwards;
        }
        .q-confetti--done rect { opacity: 1; }
        .q-confetti rect:nth-child(1) { --cx: -14px; --cy: -22px; --cr: 120deg; animation-delay: 0s; }
        .q-confetti rect:nth-child(2) { --cx: 14px; --cy: -26px; --cr: -80deg; animation-delay: 0.06s; }
        .q-confetti rect:nth-child(3) { --cx: -20px; --cy: -18px; --cr: 200deg; animation-delay: 0.1s; }
        .q-confetti rect:nth-child(4) { --cx: 20px; --cy: -20px; --cr: -140deg; animation-delay: 0.04s; }
        .q-confetti rect:nth-child(5) { --cx: 0px; --cy: -30px; --cr: 60deg; animation-delay: 0.12s; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Whole character sways */}
      <g className={`q-whole${isWorking ? " q-whole--working" : " q-whole--idle"}`}>
        {/* Tail */}
        <g className={`q-tail${isWorking ? " q-tail--working" : " q-tail--idle"}`}>
          <ellipse cx="38" cy="113" rx="11" ry="7" fill="url(#q-body-grad)" />
          <ellipse cx="38" cy="113" rx="7" ry="4.5" fill="#D4A870" />
        </g>

        {/* Body group — breathes */}
        <g className={`q-body-grp${!isWorking && !isDone ? " q-body-grp--idle" : ""}`}>
          {/* Main body */}
          <ellipse
            cx="60"
            cy="100"
            rx="26"
            ry="30"
            fill="url(#q-body-grad)"
            filter="url(#q-shadow)"
          />

          {/* Belly */}
          <ellipse cx="60" cy="104" rx="16" ry="20" fill="url(#q-belly-grad)" />

          {/* Belly detail line */}
          <path
            d="M50 96 Q60 93 70 96"
            stroke="#D4A870"
            strokeWidth="0.8"
            fill="none"
            opacity="0.5"
          />

          {/* Legs */}
          <ellipse cx="47" cy="127" rx="10" ry="7" fill="#B88A50" />
          <ellipse cx="73" cy="127" rx="10" ry="7" fill="#B88A50" />
          {/* Foot detail */}
          <ellipse cx="45" cy="130" rx="8" ry="4" fill="#A07840" />
          <ellipse cx="71" cy="130" rx="8" ry="4" fill="#A07840" />

          {/* Left arm (hip pose) */}
          <ellipse cx="36" cy="97" rx="7" ry="11" fill="#C49A6C" transform="rotate(-20 36 97)" />
          <ellipse cx="32" cy="105" rx="6" ry="5" fill="#B88A50" />

          {/* Right arm + chalk (animated separately) */}
          <g className={`q-chalk-arm${isWorking ? " q-chalk-arm--working" : " q-chalk-arm--idle"}`}>
            <ellipse cx="84" cy="97" rx="7" ry="11" fill="#C49A6C" transform="rotate(18 84 97)" />
            <ellipse cx="88" cy="105" rx="6" ry="5" fill="#B88A50" />
            {/* Chalk body */}
            <rect x="86" y="94" width="6" height="22" rx="2.5" fill="url(#q-chalk-grad)" />
            {/* Chalk tip */}
            <polygon points="86,116 92,116 89,122" fill="#D8D4C8" />
            {/* Chalk top cap */}
            <rect x="86" y="94" width="6" height="4" rx="1.5" fill="#E8E4D8" />
          </g>

          {/* Chalk dust particles */}
          <g className={`q-dust1${isWorking ? " q-dust1--working" : ""}`} style={{ opacity: 0 }}>
            <circle cx="88" cy="92" r="2.5" fill="white" opacity="0.9" />
          </g>
          <g className={`q-dust2${isWorking ? " q-dust2--working" : ""}`} style={{ opacity: 0 }}>
            <circle cx="93" cy="89" r="1.8" fill="white" opacity="0.7" />
          </g>
          {!!isWorking && (
            <>
              <circle
                cx="84"
                cy="86"
                r="1.2"
                fill="white"
                opacity="0.6"
                style={{ animation: "q-dust-float 0.8s ease-out 0.4s infinite" }}
              />
              <circle
                cx="96"
                cy="84"
                r="1"
                fill="white"
                opacity="0.5"
                style={{ animation: "q-dust-float2 0.8s ease-out 0.15s infinite" }}
              />
            </>
          )}
        </g>

        {/* Head */}
        <ellipse cx="60" cy="62" rx="24" ry="22" fill="url(#q-head-grad)" filter="url(#q-shadow)" />

        {/* Ears */}
        <ellipse cx="40" cy="46" rx="9" ry="12" fill="#C49A6C" />
        <ellipse cx="80" cy="46" rx="9" ry="12" fill="#C49A6C" />
        {/* Inner ears */}
        <ellipse cx="40" cy="46" rx="5.5" ry="8" fill="#E8A090" />
        <ellipse cx="80" cy="46" rx="5.5" ry="8" fill="#E8A090" />
        {/* Ear highlight */}
        <ellipse cx="38" cy="42" rx="2" ry="3" fill="white" opacity="0.25" />
        <ellipse cx="78" cy="42" rx="2" ry="3" fill="white" opacity="0.25" />

        {/* Head highlight */}
        <ellipse cx="52" cy="52" rx="10" ry="7" fill="white" opacity="0.12" />

        {/* Snout area */}
        <ellipse cx="60" cy="70" rx="12" ry="10" fill="#D4AC76" />

        {/* Rosy cheeks */}
        <ellipse cx="41" cy="65" rx="9" ry="7" fill="url(#q-cheek-l)" />
        <ellipse cx="79" cy="65" rx="9" ry="7" fill="url(#q-cheek-r)" />

        {/* Normal eyes (hidden when done) */}
        <g className={`q-eye-normal-l${isDone ? " q-eye-normal-l--done" : ""}`}>
          <circle cx="47" cy="58" r="6.5" fill="white" />
          <circle cx="47" cy="58" r="4.5" fill="#4A2C0A" />
          <circle cx="47" cy="58" r="2.5" fill="#2A1200" />
          <circle cx="48.8" cy="56.2" r="1.8" fill="white" />
          {/* Blink overlay */}
          <ellipse
            cx="47"
            cy="58"
            rx="6.5"
            ry="6.5"
            fill="#C49A6C"
            className={`q-blink-l${!isWorking && !isDone ? " q-blink-l--idle" : ""}`}
          />
        </g>
        <g className={`q-eye-normal-r${isDone ? " q-eye-normal-r--done" : ""}`}>
          <circle cx="73" cy="58" r="6.5" fill="white" />
          <circle cx="73" cy="58" r="4.5" fill="#4A2C0A" />
          <circle cx="73" cy="58" r="2.5" fill="#2A1200" />
          <circle cx="74.8" cy="56.2" r="1.8" fill="white" />
          {/* Blink overlay */}
          <ellipse
            cx="73"
            cy="58"
            rx="6.5"
            ry="6.5"
            fill="#C49A6C"
            className={`q-blink-r${!isWorking && !isDone ? " q-blink-r--idle" : ""}`}
          />
        </g>

        {/* Happy squinty eyes (done state) */}
        <g className={`q-eye-done-l${isDone ? " q-eye-done-l--done" : ""}`}>
          <path
            d="M41 60 Q47 54 53 60"
            stroke="#4A2C0A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g className={`q-eye-done-r${isDone ? " q-eye-done-r--done" : ""}`}>
          <path
            d="M67 60 Q73 54 79 60"
            stroke="#4A2C0A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Nose */}
        <ellipse cx="60" cy="68" rx="4.5" ry="3.5" fill="#D4836A" />
        <ellipse cx="59" cy="67" rx="1.5" ry="1" fill="white" opacity="0.4" />

        {/* Big warm smile */}
        <path
          d="M50 74 Q60 82 70 74"
          stroke="#8B4513"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Mouth corners */}
        <circle cx="50" cy="74" r="1.5" fill="#8B4513" />
        <circle cx="70" cy="74" r="1.5" fill="#8B4513" />

        {/* Whiskers */}
        <line x1="34" y1="69" x2="48" y2="70" stroke="#A08060" strokeWidth="0.8" opacity="0.6" />
        <line x1="34" y1="72" x2="48" y2="72" stroke="#A08060" strokeWidth="0.8" opacity="0.6" />
        <line x1="72" y1="70" x2="86" y2="69" stroke="#A08060" strokeWidth="0.8" opacity="0.6" />
        <line x1="72" y1="72" x2="86" y2="72" stroke="#A08060" strokeWidth="0.8" opacity="0.6" />

        {/* Done: raised paw with checkmark */}
        <g className={`q-raised-paw${isDone ? " q-raised-paw--done" : ""}`}>
          <ellipse cx="82" cy="72" rx="7" ry="11" fill="#C49A6C" transform="rotate(-40 82 72)" />
          <ellipse cx="80" cy="64" rx="6" ry="5" fill="#B88A50" />
          {/* Checkmark circle */}
          <circle cx="92" cy="48" r="12" fill="#22C55E" />
          <circle cx="92" cy="48" r="10" fill="#16A34A" />
          <path
            d="M85 48 L90 54 L100 40"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Sparkles around checkmark */}
          <path
            d="M82 38 L82 34 M80 40 L76 38 M78 44 L74 46"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M102 38 L102 34 M104 40 L108 38 M106 44 L110 46"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Confetti burst on done */}
        <g
          className={`q-confetti${isDone ? " q-confetti--done" : ""}`}
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
            x="68"
            y="40"
            width="4"
            height="4"
            rx="0.5"
            fill="#EC4899"
            transform="rotate(-20 68 40)"
          />
          <rect
            x="50"
            y="42"
            width="4"
            height="6"
            rx="1"
            fill="#6366F1"
            transform="rotate(35 50 42)"
          />
          <rect
            x="78"
            y="44"
            width="3"
            height="5"
            rx="0.5"
            fill="#14B8A6"
            transform="rotate(-10 78 44)"
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
