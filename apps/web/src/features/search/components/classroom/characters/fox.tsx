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
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Fox federated search agent"
      role="img"
    >
      <defs>
        <radialGradient id="fx-body-grad" cx="42%" cy="35%" r="58%">
          <stop offset="0%" stopColor="#F4A04A" />
          <stop offset="55%" stopColor="#E8722A" />
          <stop offset="100%" stopColor="#C4581A" />
        </radialGradient>
        <radialGradient id="fx-head-grad" cx="38%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#F8B060" />
          <stop offset="55%" stopColor="#E87830" />
          <stop offset="100%" stopColor="#C05A18" />
        </radialGradient>
        <radialGradient id="fx-belly-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFF0D8" />
          <stop offset="100%" stopColor="#F5D5B0" />
        </radialGradient>
        <radialGradient id="fx-tail-grad" cx="30%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F4A050" />
          <stop offset="60%" stopColor="#E87230" />
          <stop offset="100%" stopColor="#B85010" />
        </radialGradient>
        <radialGradient id="fx-cheek-l" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A0A0" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#F4A0A0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fx-cheek-r" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A0A0" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#F4A0A0" stopOpacity="0" />
        </radialGradient>
        <filter id="fx-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#8B3A10" floodOpacity="0.28" />
        </filter>
        <linearGradient id="fx-screen-idle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0F1F3A" />
        </linearGradient>
        <linearGradient id="fx-screen-working" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes fx-breathe {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.022) scaleX(0.99); }
        }
        @keyframes fx-sway {
          0%, 100% { transform: rotate(-1.5deg) translateX(0); }
          50% { transform: rotate(1.5deg) translateX(1px); }
        }
        @keyframes fx-tail-swish-idle {
          0%, 100% { transform: rotate(-10deg) translateX(0); }
          33% { transform: rotate(8deg) translateX(3px); }
          66% { transform: rotate(-6deg) translateX(-1px); }
        }
        @keyframes fx-tail-swish-work {
          0%, 100% { transform: rotate(-18deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes fx-ear-rotate-l {
          0%, 70%, 100% { transform: rotate(0deg); }
          80% { transform: rotate(-8deg); }
          90% { transform: rotate(5deg); }
        }
        @keyframes fx-ear-rotate-r {
          0%, 60%, 100% { transform: rotate(0deg); }
          70% { transform: rotate(8deg); }
          82% { transform: rotate(-5deg); }
        }
        @keyframes fx-blink {
          0%, 87%, 100% { transform: scaleY(1); }
          92% { transform: scaleY(0.07); }
          97% { transform: scaleY(1); }
        }
        @keyframes fx-paw-l-type {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-5px) rotate(-5deg); }
        }
        @keyframes fx-paw-r-type {
          0%, 100% { transform: translateY(-5px) rotate(5deg); }
          50% { transform: translateY(0) rotate(5deg); }
        }
        @keyframes fx-screen-flicker {
          0%, 90%, 100% { opacity: 1; }
          92% { opacity: 0.7; }
          95% { opacity: 1; }
          97% { opacity: 0.8; }
        }
        @keyframes fx-data-line {
          0% { transform: translateX(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes fx-bob-working {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-6px) rotate(0.5deg); }
        }
        @keyframes fx-confetti-burst {
          0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--cx, 10px), var(--cy, -20px)) rotate(var(--cr, 90deg)) scale(0.3); }
        }

        .fx-whole { transform-origin: 60px 90px; }
        .fx-whole--idle { animation: fx-sway 4s ease-in-out infinite; }
        .fx-whole--working { animation: fx-bob-working 0.55s ease-in-out infinite; }

        .fx-body-grp { transform-origin: 60px 100px; }
        .fx-body-grp--idle { animation: fx-breathe 3.2s ease-in-out infinite; }

        .fx-tail { transform-origin: 88px 105px; }
        .fx-tail--idle { animation: fx-tail-swish-idle 3s ease-in-out infinite; }
        .fx-tail--working { animation: fx-tail-swish-work 0.5s ease-in-out infinite; }

        .fx-ear-l { transform-origin: 34px 42px; }
        .fx-ear-r { transform-origin: 86px 42px; }
        .fx-ear-l--idle { animation: fx-ear-rotate-l 3.5s ease-in-out 0s infinite; }
        .fx-ear-r--idle { animation: fx-ear-rotate-r 3.5s ease-in-out 0.4s infinite; }
        .fx-ear-l--working { animation: fx-ear-rotate-l 1s ease-in-out 0s infinite; }
        .fx-ear-r--working { animation: fx-ear-rotate-r 1s ease-in-out 0.2s infinite; }

        .fx-blink-l { transform-origin: 46px 58px; }
        .fx-blink-r { transform-origin: 74px 58px; }
        .fx-blink-l--idle { animation: fx-blink 4s ease-in-out 0s infinite; }
        .fx-blink-r--idle { animation: fx-blink 4s ease-in-out 0.2s infinite; }

        .fx-paw-l { transform-origin: 36px 105px; }
        .fx-paw-r { transform-origin: 80px 105px; }
        .fx-paw-l--working { animation: fx-paw-l-type 0.38s ease-in-out infinite; }
        .fx-paw-r--working { animation: fx-paw-r-type 0.38s ease-in-out 0.19s infinite; }

        .fx-screen { }
        .fx-screen--working { animation: fx-screen-flicker 1.5s ease-in-out infinite; }

        .fx-data-line { opacity: 0; }
        .fx-data-line--working {
          clip-path: inset(0 0 0 0);
          animation: fx-data-line 0.6s linear infinite;
          opacity: 1;
        }
        .fx-data-line--working:nth-of-type(2) { animation-delay: 0.2s; }
        .fx-data-line--working:nth-of-type(3) { animation-delay: 0.4s; }

        .fx-raised-paw { opacity: 0; }
        .fx-raised-paw--done { opacity: 1; }

        .fx-eye-done-l { opacity: 0; }
        .fx-eye-done-r { opacity: 0; }
        .fx-eye-done-l--done { opacity: 1; }
        .fx-eye-done-r--done { opacity: 1; }
        .fx-eye-normal-l--done { opacity: 0; }
        .fx-eye-normal-r--done { opacity: 0; }

        .fx-confetti rect {
          animation: fx-confetti-burst 0.9s ease-out forwards;
        }
        .fx-confetti--done rect { opacity: 1; }
        .fx-confetti rect:nth-child(1) { --cx: -15px; --cy: -22px; --cr: 115deg; animation-delay: 0s; }
        .fx-confetti rect:nth-child(2) { --cx: 15px; --cy: -26px; --cr: -80deg; animation-delay: 0.07s; }
        .fx-confetti rect:nth-child(3) { --cx: -21px; --cy: -19px; --cr: 200deg; animation-delay: 0.1s; }
        .fx-confetti rect:nth-child(4) { --cx: 21px; --cy: -21px; --cr: -140deg; animation-delay: 0.04s; }
        .fx-confetti rect:nth-child(5) { --cx: 1px; --cy: -31px; --cr: 60deg; animation-delay: 0.13s; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <g className={`fx-whole${isWorking ? " fx-whole--working" : " fx-whole--idle"}`}>
        {/* Big fluffy tail */}
        <g className={`fx-tail${isWorking ? " fx-tail--working" : " fx-tail--idle"}`}>
          {/* Tail outer shape */}
          <path
            d="M80 108 Q102 98 106 115 Q104 130 88 128 Q72 126 74 115 Z"
            fill="url(#fx-tail-grad)"
          />
          {/* White tail tip */}
          <path d="M90 120 Q105 118 105 126 Q100 132 90 128 Z" fill="white" />
          <path d="M92 122 Q103 121 103 126 Q100 130 92 126 Z" fill="white" opacity="0.5" />
          {/* Tail shading */}
          <path
            d="M80 110 Q98 102 104 118"
            stroke="#B85010"
            strokeWidth="1.5"
            fill="none"
            opacity="0.3"
          />
        </g>

        {/* Body group */}
        <g className={`fx-body-grp${!isWorking && !isDone ? " fx-body-grp--idle" : ""}`}>
          {/* Main body */}
          <ellipse
            cx="55"
            cy="98"
            rx="24"
            ry="28"
            fill="url(#fx-body-grad)"
            filter="url(#fx-shadow)"
          />

          {/* Belly */}
          <ellipse cx="55" cy="102" rx="15" ry="19" fill="url(#fx-belly-grad)" />

          {/* Belly highlight */}
          <ellipse cx="51" cy="95" rx="7" ry="5" fill="white" opacity="0.15" />

          {/* Left paw */}
          <g className={`fx-paw-l${isWorking ? " fx-paw-l--working" : ""}`}>
            <ellipse
              cx="36"
              cy="108"
              rx="8"
              ry="12"
              fill="#E8722A"
              transform="rotate(-12 36 108)"
            />
            <ellipse cx="33" cy="118" rx="7" ry="5" fill="#D4601A" />
            {/* Paw pads */}
            <ellipse cx="32" cy="119" rx="3.5" ry="2.5" fill="#C05010" opacity="0.6" />
          </g>

          {/* Laptop */}
          <g>
            {/* Laptop base */}
            <rect x="32" y="112" width="46" height="6" rx="3" fill="#374151" />
            <rect x="33" y="112" width="44" height="5" rx="2.5" fill="#4B5563" />
            {/* Laptop hinge */}
            <rect x="32" y="110" width="46" height="3" rx="1.5" fill="#1F2937" />
            {/* Laptop screen body */}
            <rect x="34" y="80" width="42" height="32" rx="3" fill="#1F2937" />
            <rect x="35" y="81" width="40" height="30" rx="2" fill="#111827" />
            {/* Screen bezel top */}
            <rect x="34" y="80" width="42" height="4" rx="2" fill="#374151" />
            {/* Screen content */}
            <rect
              x="37"
              y="85"
              width="36"
              height="22"
              rx="1.5"
              fill={isWorking ? "url(#fx-screen-working)" : "url(#fx-screen-idle)"}
              className={`fx-screen${isWorking ? " fx-screen--working" : ""}`}
            />
            {/* Code lines on screen */}
            <line
              x1="39"
              y1="89"
              x2="66"
              y2="89"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.2"
            />
            <line
              x1="39"
              y1="92"
              x2="60"
              y2="92"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
            />
            <line
              x1="39"
              y1="95"
              x2="68"
              y2="95"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.2"
            />
            <line
              x1="39"
              y1="98"
              x2="55"
              y2="98"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.2"
            />
            <line
              x1="39"
              y1="101"
              x2="62"
              y2="101"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
            />
            {/* Animated data lines when working */}
            {!!isWorking && (
              <>
                <rect
                  x="37"
                  y="89"
                  width="36"
                  height="1.5"
                  fill="#60A5FA"
                  opacity="0.6"
                  className="fx-data-line fx-data-line--working"
                  style={{ clipPath: "inset(0 0 0 0)" }}
                />
                <rect
                  x="37"
                  y="94"
                  width="36"
                  height="1.5"
                  fill="#34D399"
                  opacity="0.5"
                  className="fx-data-line fx-data-line--working"
                  style={{ clipPath: "inset(0 0 0 0)", animationDelay: "0.2s" }}
                />
                <rect
                  x="37"
                  y="99"
                  width="36"
                  height="1.5"
                  fill="#A78BFA"
                  opacity="0.6"
                  className="fx-data-line fx-data-line--working"
                  style={{ clipPath: "inset(0 0 0 0)", animationDelay: "0.4s" }}
                />
              </>
            )}
            {/* Camera dot */}
            <circle cx="55" cy="83" r="1" fill="#374151" />
          </g>

          {/* Right paw */}
          <g className={`fx-paw-r${isWorking ? " fx-paw-r--working" : ""}`}>
            <ellipse cx="76" cy="108" rx="8" ry="12" fill="#E8722A" transform="rotate(12 76 108)" />
            <ellipse cx="78" cy="118" rx="7" ry="5" fill="#D4601A" />
            <ellipse cx="79" cy="119" rx="3.5" ry="2.5" fill="#C05010" opacity="0.6" />
          </g>

          {/* Legs/feet */}
          <ellipse cx="44" cy="124" rx="11" ry="7" fill="#D4601A" />
          <ellipse cx="66" cy="124" rx="11" ry="7" fill="#C4501A" />
          <ellipse cx="42" cy="128" rx="9" ry="4.5" fill="#B84010" />
          <ellipse cx="64" cy="128" rx="9" ry="4.5" fill="#A83A0A" />
        </g>

        {/* Head */}
        <ellipse
          cx="55"
          cy="60"
          rx="24"
          ry="22"
          fill="url(#fx-head-grad)"
          filter="url(#fx-shadow)"
        />

        {/* Ears */}
        <g className={`fx-ear-l${isWorking ? " fx-ear-l--working" : " fx-ear-l--idle"}`}>
          <polygon points="34,45 26,26 44,38" fill="#E8722A" />
          <polygon points="34,45 28,28 43,39" fill="#D4601A" />
          <polygon points="34,44 29,30 42,39" fill="#E89090" />
        </g>
        <g className={`fx-ear-r${isWorking ? " fx-ear-r--working" : " fx-ear-r--idle"}`}>
          <polygon points="76,45 84,26 66,38" fill="#E8722A" />
          <polygon points="76,45 82,28 67,39" fill="#D4601A" />
          <polygon points="76,44 81,30 68,39" fill="#E89090" />
        </g>

        {/* Head highlight */}
        <ellipse cx="46" cy="50" rx="11" ry="7" fill="white" opacity="0.12" />

        {/* White face mask */}
        <ellipse cx="55" cy="65" rx="14" ry="13" fill="url(#fx-belly-grad)" />

        {/* Rosy cheeks */}
        <ellipse cx="37" cy="65" rx="10" ry="8" fill="url(#fx-cheek-l)" />
        <ellipse cx="73" cy="65" rx="10" ry="8" fill="url(#fx-cheek-r)" />

        {/* Eyes */}
        <g className={`fx-eye-normal-l${isDone ? " fx-eye-normal-l--done" : ""}`}>
          <circle cx="46" cy="58" r="6" fill="#3D2B0A" />
          <circle cx="46" cy="58" r="4" fill="#2A1800" />
          <circle cx="47.8" cy="56.2" r="2" fill="white" />
          {/* Blink */}
          <ellipse
            cx="46"
            cy="58"
            rx="6"
            ry="6"
            fill="#E87830"
            className={`fx-blink-l${!isWorking && !isDone ? " fx-blink-l--idle" : ""}`}
          />
        </g>
        <g className={`fx-eye-normal-r${isDone ? " fx-eye-normal-r--done" : ""}`}>
          <circle cx="64" cy="58" r="6" fill="#3D2B0A" />
          <circle cx="64" cy="58" r="4" fill="#2A1800" />
          <circle cx="65.8" cy="56.2" r="2" fill="white" />
          {/* Blink */}
          <ellipse
            cx="64"
            cy="58"
            rx="6"
            ry="6"
            fill="#E87830"
            className={`fx-blink-r${!isWorking && !isDone ? " fx-blink-r--idle" : ""}`}
          />
        </g>

        {/* Happy squinty eyes (done) */}
        <g className={`fx-eye-done-l${isDone ? " fx-eye-done-l--done" : ""}`}>
          <path
            d="M40 60 Q46 52 52 60"
            stroke="#3D2B0A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g className={`fx-eye-done-r${isDone ? " fx-eye-done-r--done" : ""}`}>
          <path
            d="M58 60 Q64 52 70 60"
            stroke="#3D2B0A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Nose */}
        <ellipse cx="55" cy="66" rx="3.5" ry="3" fill="#2A1800" />
        <ellipse cx="54" cy="65" rx="1.2" ry="0.9" fill="white" opacity="0.5" />

        {/* Mouth */}
        <path
          d="M50 70 Q55 75 60 70"
          stroke="#A0522D"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="55" y1="69" x2="55" y2="71" stroke="#A0522D" strokeWidth="1.2" />

        {/* White chin */}
        <path d="M46 71 Q55 78 64 71" fill="#F5D5B0" opacity="0.7" />

        {/* Whiskers */}
        <line x1="30" y1="65" x2="44" y2="66" stroke="#D4A870" strokeWidth="0.9" opacity="0.7" />
        <line x1="30" y1="68" x2="44" y2="68" stroke="#D4A870" strokeWidth="0.9" opacity="0.7" />
        <line x1="66" y1="66" x2="80" y2="65" stroke="#D4A870" strokeWidth="0.9" opacity="0.7" />
        <line x1="66" y1="68" x2="80" y2="68" stroke="#D4A870" strokeWidth="0.9" opacity="0.7" />

        {/* Done: raised paw */}
        <g className={`fx-raised-paw${isDone ? " fx-raised-paw--done" : ""}`}>
          <ellipse cx="78" cy="74" rx="8" ry="13" fill="#E8722A" transform="rotate(-42 78 74)" />
          <ellipse cx="84" cy="64" rx="7" ry="5" fill="#D4601A" />
          <circle cx="94" cy="50" r="13" fill="#22C55E" />
          <circle cx="94" cy="50" r="11" fill="#16A34A" />
          <path
            d="M87 50 L92 56 L102 42"
            stroke="white"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M84 40 L84 36 M82 42 L78 40 M80 46 L76 48"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M104 40 L104 36 M106 42 L110 40 M108 46 L112 48"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Confetti */}
        <g
          className={`fx-confetti${isDone ? " fx-confetti--done" : ""}`}
          style={{ opacity: isDone ? 1 : 0 }}
        >
          <rect
            x="54"
            y="44"
            width="5"
            height="5"
            rx="1"
            fill="#F59E0B"
            transform="rotate(15 54 44)"
          />
          <rect
            x="66"
            y="39"
            width="4"
            height="4"
            rx="0.5"
            fill="#EC4899"
            transform="rotate(-20 66 39)"
          />
          <rect
            x="43"
            y="42"
            width="4"
            height="6"
            rx="1"
            fill="#6366F1"
            transform="rotate(35 43 42)"
          />
          <rect
            x="77"
            y="43"
            width="3"
            height="5"
            rx="0.5"
            fill="#14B8A6"
            transform="rotate(-10 77 43)"
          />
          <rect
            x="58"
            y="34"
            width="4"
            height="4"
            rx="0.5"
            fill="#F97316"
            transform="rotate(50 58 34)"
          />
        </g>
      </g>
    </svg>
  );
}
