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
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Owl search query agent"
      role="img"
    >
      <defs>
        <radialGradient id="ow-body-grad" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#8B7CC8" />
          <stop offset="55%" stopColor="#6D5B9C" />
          <stop offset="100%" stopColor="#4A3A78" />
        </radialGradient>
        <radialGradient id="ow-head-grad" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#9B8CD8" />
          <stop offset="60%" stopColor="#7C6BAB" />
          <stop offset="100%" stopColor="#5A4888" />
        </radialGradient>
        <radialGradient id="ow-belly-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#F5EDD5" />
          <stop offset="100%" stopColor="#DFCCA0" />
        </radialGradient>
        <radialGradient id="ow-iris-l" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#312E81" />
        </radialGradient>
        <radialGradient id="ow-iris-r" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#312E81" />
        </radialGradient>
        <radialGradient id="ow-lens-grad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#818CF8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4338CA" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="ow-cheek-l" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F472B6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ow-cheek-r" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F472B6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
        </radialGradient>
        <filter id="ow-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#3A2860" floodOpacity="0.3" />
        </filter>
        <filter id="ow-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#818CF8" floodOpacity="0.8" />
        </filter>
      </defs>

      <style>{`
        @keyframes ow-breathe {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.02) scaleX(0.99); }
        }
        @keyframes ow-sway {
          0%, 100% { transform: rotate(-1.5deg); }
          50% { transform: rotate(1.5deg); }
        }
        @keyframes ow-head-tilt {
          0%, 20%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(-12deg); }
          65% { transform: rotate(12deg); }
          80% { transform: rotate(0deg); }
        }
        @keyframes ow-blink {
          0%, 85%, 100% { transform: scaleY(1); }
          90% { transform: scaleY(0.06); }
          95% { transform: scaleY(1); }
        }
        @keyframes ow-tuft-twitch {
          0%, 75%, 100% { transform: rotate(0deg); }
          80% { transform: rotate(-6deg); }
          88% { transform: rotate(5deg); }
          94% { transform: rotate(-3deg); }
        }
        @keyframes ow-tuft-twitch2 {
          0%, 65%, 100% { transform: rotate(0deg); }
          70% { transform: rotate(6deg); }
          78% { transform: rotate(-4deg); }
          85% { transform: rotate(3deg); }
        }
        @keyframes ow-magnifier-sweep {
          0%   { transform: rotate(-18deg) translateX(0); }
          25%  { transform: rotate(5deg) translateX(5px); }
          50%  { transform: rotate(-22deg) translateX(-3px); }
          75%  { transform: rotate(8deg) translateX(6px); }
          100% { transform: rotate(-18deg) translateX(0); }
        }
        @keyframes ow-lens-pulse {
          0%, 100% { opacity: 0.5; r: 9; }
          50% { opacity: 1; r: 11.5; }
        }
        @keyframes ow-lens-glow {
          0%, 100% { filter: url(#ow-shadow); }
          50% { filter: url(#ow-glow); }
        }
        @keyframes ow-working-bob {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-5px) rotate(0.5deg); }
        }
        @keyframes ow-confetti-burst {
          0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--cx, 10px), var(--cy, -20px)) rotate(var(--cr, 90deg)) scale(0.3); }
        }

        .ow-whole { transform-origin: 60px 90px; }
        .ow-whole--idle { animation: ow-sway 5s ease-in-out infinite; }
        .ow-whole--working { animation: ow-working-bob 0.75s ease-in-out infinite; }

        .ow-body-grp { transform-origin: 60px 100px; }
        .ow-body-grp--idle { animation: ow-breathe 3.5s ease-in-out infinite; }

        .ow-head-grp { transform-origin: 60px 58px; }
        .ow-head-grp--idle { animation: ow-head-tilt 6s ease-in-out 1s infinite; }

        .ow-blink-l { transform-origin: 46px 57px; }
        .ow-blink-r { transform-origin: 74px 57px; }
        .ow-blink-l--idle { animation: ow-blink 3.8s ease-in-out 0s infinite; }
        .ow-blink-r--idle { animation: ow-blink 3.8s ease-in-out 0.15s infinite; }

        .ow-tuft-l { transform-origin: 40px 38px; }
        .ow-tuft-r { transform-origin: 80px 38px; }
        .ow-tuft-l--idle { animation: ow-tuft-twitch 3.2s ease-in-out 0s infinite; }
        .ow-tuft-r--idle { animation: ow-tuft-twitch2 3.2s ease-in-out 0.5s infinite; }
        .ow-tuft-l--working { animation: ow-tuft-twitch 0.8s ease-in-out 0s infinite; }
        .ow-tuft-r--working { animation: ow-tuft-twitch2 0.8s ease-in-out 0.2s infinite; }

        .ow-magnifier { transform-origin: 84px 100px; }
        .ow-magnifier--idle { }
        .ow-magnifier--working { animation: ow-magnifier-sweep 0.9s ease-in-out infinite; }

        .ow-lens-pulse-ring { opacity: 0; }
        .ow-lens-pulse-ring--working { animation: ow-lens-pulse 0.9s ease-in-out infinite; }

        .ow-raised-wing { opacity: 0; }
        .ow-raised-wing--done { opacity: 1; }

        .ow-eye-done-l { opacity: 0; }
        .ow-eye-done-r { opacity: 0; }
        .ow-eye-done-l--done { opacity: 1; }
        .ow-eye-done-r--done { opacity: 1; }
        .ow-eye-normal-l--done { opacity: 0; }
        .ow-eye-normal-r--done { opacity: 0; }

        .ow-confetti rect {
          animation: ow-confetti-burst 0.9s ease-out forwards;
        }
        .ow-confetti--done rect { opacity: 1; }
        .ow-confetti rect:nth-child(1) { --cx: -16px; --cy: -24px; --cr: 110deg; animation-delay: 0s; }
        .ow-confetti rect:nth-child(2) { --cx: 16px; --cy: -28px; --cr: -85deg; animation-delay: 0.07s; }
        .ow-confetti rect:nth-child(3) { --cx: -22px; --cy: -20px; --cr: 190deg; animation-delay: 0.11s; }
        .ow-confetti rect:nth-child(4) { --cx: 22px; --cy: -22px; --cr: -145deg; animation-delay: 0.04s; }
        .ow-confetti rect:nth-child(5) { --cx: 2px; --cy: -32px; --cr: 55deg; animation-delay: 0.13s; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <g className={`ow-whole${isWorking ? " ow-whole--working" : " ow-whole--idle"}`}>
        {/* Body group */}
        <g className={`ow-body-grp${!isWorking && !isDone ? " ow-body-grp--idle" : ""}`}>
          {/* Wing shadows / body shape */}
          <ellipse cx="38" cy="102" rx="14" ry="20" fill="#5A4888" transform="rotate(-8 38 102)" />
          <ellipse cx="82" cy="102" rx="14" ry="20" fill="#5A4888" transform="rotate(8 82 102)" />

          {/* Main body */}
          <ellipse
            cx="60"
            cy="103"
            rx="24"
            ry="28"
            fill="url(#ow-body-grad)"
            filter="url(#ow-shadow)"
          />

          {/* Belly */}
          <ellipse cx="60" cy="108" rx="15" ry="19" fill="url(#ow-belly-grad)" />

          {/* Feather stripes on belly */}
          <path
            d="M48 100 Q60 97 72 100"
            stroke="#C8B890"
            strokeWidth="1.2"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M47 106 Q60 103 73 106"
            stroke="#C8B890"
            strokeWidth="1.2"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M48 112 Q60 109 72 112"
            stroke="#C8B890"
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M50 118 Q60 115 70 118"
            stroke="#C8B890"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />

          {/* Wing texture lines */}
          <path
            d="M36 96 Q40 100 36 110"
            stroke="#4A3A78"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M40 93 Q44 98 41 108"
            stroke="#4A3A78"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M80 93 Q76 98 79 108"
            stroke="#4A3A78"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M84 96 Q80 100 84 110"
            stroke="#4A3A78"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />

          {/* Left wing */}
          <ellipse cx="38" cy="100" rx="10" ry="16" fill="#7C6BAB" transform="rotate(-12 38 100)" />

          {/* Right wing + magnifying glass */}
          <g className={`ow-magnifier${isWorking ? " ow-magnifier--working" : ""}`}>
            <ellipse
              cx="82"
              cy="100"
              rx="10"
              ry="16"
              fill="#7C6BAB"
              transform="rotate(12 82 100)"
            />
            {/* Handle */}
            <rect
              x="88"
              y="108"
              width="4.5"
              height="16"
              rx="2"
              fill="#8B7355"
              transform="rotate(25 88 108)"
            />
            {/* Frame ring */}
            <circle cx="84" cy="102" r="12" fill="none" stroke="#8B7355" strokeWidth="3" />
            <circle
              cx="84"
              cy="102"
              r="11"
              fill="none"
              stroke="#6B5535"
              strokeWidth="1"
              opacity="0.5"
            />
            {/* Lens */}
            <circle cx="84" cy="102" r="9.5" fill="url(#ow-lens-grad)" />
            {/* Lens refraction highlight */}
            <ellipse
              cx="80"
              cy="98"
              rx="4"
              ry="2.5"
              fill="white"
              opacity="0.4"
              transform="rotate(-20 80 98)"
            />
            {/* Crosshairs */}
            <line
              x1="84"
              y1="93.5"
              x2="84"
              y2="110.5"
              stroke="#818CF8"
              strokeWidth="1"
              opacity="0.5"
            />
            <line
              x1="75.5"
              y1="102"
              x2="92.5"
              y2="102"
              stroke="#818CF8"
              strokeWidth="1"
              opacity="0.5"
            />
            {/* Pulsing ring when working */}
            <circle
              cx="84"
              cy="102"
              r="9"
              fill="none"
              stroke="#818CF8"
              strokeWidth="2.5"
              className={`ow-lens-pulse-ring${isWorking ? " ow-lens-pulse-ring--working" : ""}`}
            />
          </g>

          {/* Talons */}
          <ellipse cx="48" cy="128" rx="9" ry="4.5" fill="#C49A2C" />
          <ellipse cx="72" cy="128" rx="9" ry="4.5" fill="#C49A2C" />
          <line
            x1="41"
            y1="130"
            x2="39"
            y2="136"
            stroke="#C49A2C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="47"
            y1="131"
            x2="47"
            y2="137"
            stroke="#C49A2C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="53"
            y1="130"
            x2="55"
            y2="136"
            stroke="#C49A2C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="65"
            y1="130"
            x2="63"
            y2="136"
            stroke="#C49A2C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="71"
            y1="131"
            x2="71"
            y2="137"
            stroke="#C49A2C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="77"
            y1="130"
            x2="79"
            y2="136"
            stroke="#C49A2C"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Head group — tilts */}
        <g className={`ow-head-grp${!isWorking && !isDone ? " ow-head-grp--idle" : ""}`}>
          {/* Ear tufts */}
          <g className={`ow-tuft-l${isWorking ? " ow-tuft-l--working" : " ow-tuft-l--idle"}`}>
            <polygon points="40,38 34,22 44,30" fill="#6D5B9C" />
            <polygon points="40,38 36,24 43,31" fill="#7C6BAB" />
            <polygon points="41,36 37,25 43,30" fill="#5A4888" opacity="0.5" />
          </g>
          <g className={`ow-tuft-r${isWorking ? " ow-tuft-r--working" : " ow-tuft-r--idle"}`}>
            <polygon points="80,38 86,22 76,30" fill="#6D5B9C" />
            <polygon points="80,38 84,24 77,31" fill="#7C6BAB" />
            <polygon points="79,36 83,25 77,30" fill="#5A4888" opacity="0.5" />
          </g>

          {/* Head */}
          <ellipse
            cx="60"
            cy="58"
            rx="26"
            ry="24"
            fill="url(#ow-head-grad)"
            filter="url(#ow-shadow)"
          />

          {/* Head highlight */}
          <ellipse cx="50" cy="46" rx="12" ry="8" fill="white" opacity="0.1" />

          {/* Face disc */}
          <ellipse cx="60" cy="60" rx="18" ry="16" fill="#C8A86E" />
          <ellipse cx="60" cy="60" rx="15" ry="13" fill="#D4B87A" opacity="0.6" />

          {/* Rosy cheeks */}
          <ellipse cx="42" cy="65" rx="9" ry="7" fill="url(#ow-cheek-l)" />
          <ellipse cx="78" cy="65" rx="9" ry="7" fill="url(#ow-cheek-r)" />

          {/* Big expressive eyes */}
          {/* Normal eyes */}
          <g className={`ow-eye-normal-l${isDone ? " ow-eye-normal-l--done" : ""}`}>
            <circle cx="46" cy="57" r="10" fill="white" />
            <circle cx="46" cy="57" r="7.5" fill="url(#ow-iris-l)" />
            <circle cx="46" cy="57" r="4.5" fill="#1E1B4B" />
            <circle cx="48.2" cy="54.5" r="2.5" fill="white" />
            <circle cx="44.5" cy="59" r="1" fill="white" opacity="0.5" />
            {/* Blink overlay */}
            <ellipse
              cx="46"
              cy="57"
              rx="10"
              ry="10"
              fill="#C8A86E"
              className={`ow-blink-l${!isWorking && !isDone ? " ow-blink-l--idle" : ""}`}
            />
          </g>
          <g className={`ow-eye-normal-r${isDone ? " ow-eye-normal-r--done" : ""}`}>
            <circle cx="74" cy="57" r="10" fill="white" />
            <circle cx="74" cy="57" r="7.5" fill="url(#ow-iris-r)" />
            <circle cx="74" cy="57" r="4.5" fill="#1E1B4B" />
            <circle cx="76.2" cy="54.5" r="2.5" fill="white" />
            <circle cx="72.5" cy="59" r="1" fill="white" opacity="0.5" />
            {/* Blink overlay */}
            <ellipse
              cx="74"
              cy="57"
              rx="10"
              ry="10"
              fill="#C8A86E"
              className={`ow-blink-r${!isWorking && !isDone ? " ow-blink-r--idle" : ""}`}
            />
          </g>

          {/* Happy squinty eyes (done state) */}
          <g className={`ow-eye-done-l${isDone ? " ow-eye-done-l--done" : ""}`}>
            <path
              d="M38 59 Q46 51 54 59"
              stroke="#4A3A78"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g className={`ow-eye-done-r${isDone ? " ow-eye-done-r--done" : ""}`}>
            <path
              d="M66 59 Q74 51 82 59"
              stroke="#4A3A78"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Beak */}
          <polygon points="60,66 54,74 66,74" fill="#D4974A" />
          <polygon points="60,67 55,72 65,72" fill="#E8AC5A" opacity="0.6" />
        </g>

        {/* Done: raised wing */}
        <g className={`ow-raised-wing${isDone ? " ow-raised-wing--done" : ""}`}>
          <ellipse cx="80" cy="76" rx="10" ry="16" fill="#7C6BAB" transform="rotate(-50 80 76)" />
          <circle cx="94" cy="52" r="13" fill="#22C55E" />
          <circle cx="94" cy="52" r="11" fill="#16A34A" />
          <path
            d="M87 52 L92 58 L102 44"
            stroke="white"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M84 42 L84 38 M82 44 L78 42 M80 48 L76 50"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M104 42 L104 38 M106 44 L110 42 M108 48 L112 50"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Confetti burst */}
        <g
          className={`ow-confetti${isDone ? " ow-confetti--done" : ""}`}
          style={{ opacity: isDone ? 1 : 0 }}
        >
          <rect
            x="59"
            y="42"
            width="5"
            height="5"
            rx="1"
            fill="#F59E0B"
            transform="rotate(15 59 42)"
          />
          <rect
            x="70"
            y="38"
            width="4"
            height="4"
            rx="0.5"
            fill="#EC4899"
            transform="rotate(-20 70 38)"
          />
          <rect
            x="48"
            y="40"
            width="4"
            height="6"
            rx="1"
            fill="#6366F1"
            transform="rotate(35 48 40)"
          />
          <rect
            x="80"
            y="42"
            width="3"
            height="5"
            rx="0.5"
            fill="#14B8A6"
            transform="rotate(-10 80 42)"
          />
          <rect
            x="62"
            y="34"
            width="4"
            height="4"
            rx="0.5"
            fill="#F97316"
            transform="rotate(50 62 34)"
          />
        </g>
      </g>
    </svg>
  );
}
