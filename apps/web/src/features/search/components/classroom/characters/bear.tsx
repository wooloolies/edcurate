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
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Bear evaluation agent"
      role="img"
    >
      <defs>
        <radialGradient id="br-body-grad" cx="42%" cy="35%" r="58%">
          <stop offset="0%" stopColor="#7A5040" />
          <stop offset="55%" stopColor="#5C3D2E" />
          <stop offset="100%" stopColor="#3E2418" />
        </radialGradient>
        <radialGradient id="br-head-grad" cx="38%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#8A6050" />
          <stop offset="55%" stopColor="#6C4A38" />
          <stop offset="100%" stopColor="#4A2C1C" />
        </radialGradient>
        <radialGradient id="br-belly-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#C89470" />
          <stop offset="100%" stopColor="#A87050" />
        </radialGradient>
        <radialGradient id="br-snout-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#9A7050" />
          <stop offset="100%" stopColor="#7A5030" />
        </radialGradient>
        <radialGradient id="br-cheek-l" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A0A0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F4A0A0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="br-cheek-r" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A0A0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F4A0A0" stopOpacity="0" />
        </radialGradient>
        <filter id="br-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2.5" floodColor="#2C1208" floodOpacity="0.3" />
        </filter>
        <linearGradient id="br-clipboard-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8C880" />
          <stop offset="100%" stopColor="#C8A058" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes br-breathe {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.02) scaleX(0.99); }
        }
        @keyframes br-sway {
          0%, 100% { transform: rotate(-1deg) translateX(0); }
          50% { transform: rotate(1deg) translateX(0.5px); }
        }
        @keyframes br-glasses-adjust {
          0%, 80%, 100% { transform: translateY(0) rotate(0deg); }
          85% { transform: translateY(-1.5px) rotate(-2deg); }
          93% { transform: translateY(0px) rotate(1deg); }
        }
        @keyframes br-nod {
          0%, 60%, 100% { transform: rotate(0deg); }
          70% { transform: rotate(6deg); }
          80% { transform: rotate(-2deg); }
          90% { transform: rotate(3deg); }
        }
        @keyframes br-nod-fast {
          0%, 100% { transform: rotate(0deg); }
          30% { transform: rotate(7deg); }
          60% { transform: rotate(-3deg); }
        }
        @keyframes br-blink {
          0%, 85%, 100% { transform: scaleY(1); }
          90% { transform: scaleY(0.07); }
          95% { transform: scaleY(1); }
        }
        @keyframes br-pencil-write {
          0%, 100% { transform: rotate(-8deg) translateX(0); }
          25% { transform: rotate(2deg) translateX(4px) translateY(2px); }
          50% { transform: rotate(-10deg) translateX(-2px); }
          75% { transform: rotate(5deg) translateX(5px) translateY(3px); }
        }
        @keyframes br-check-appear {
          0% { opacity: 0; transform: scale(0.3); }
          60% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes br-bob-working {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-5px) rotate(0.5deg); }
        }
        @keyframes br-confetti-burst {
          0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--cx, 10px), var(--cy, -20px)) rotate(var(--cr, 90deg)) scale(0.3); }
        }

        .br-whole { transform-origin: 60px 90px; }
        .br-whole--idle { animation: br-sway 5s ease-in-out infinite; }
        .br-whole--working { animation: br-bob-working 0.85s ease-in-out infinite; }

        .br-body-grp { transform-origin: 60px 100px; }
        .br-body-grp--idle { animation: br-breathe 4s ease-in-out infinite; }

        .br-head-grp { transform-origin: 60px 58px; }
        .br-head-grp--idle { animation: br-nod 5.5s ease-in-out 0.5s infinite; }
        .br-head-grp--working { animation: br-nod-fast 1.4s ease-in-out infinite; }

        .br-glasses { transform-origin: 60px 66px; }
        .br-glasses--idle { animation: br-glasses-adjust 5s ease-in-out 2s infinite; }

        .br-blink-l { transform-origin: 46px 57px; }
        .br-blink-r { transform-origin: 74px 57px; }
        .br-blink-l--idle { animation: br-blink 4.5s ease-in-out 0s infinite; }
        .br-blink-r--idle { animation: br-blink 4.5s ease-in-out 0.2s infinite; }

        .br-pencil { transform-origin: 90px 88px; }
        .br-pencil--idle { }
        .br-pencil--working { animation: br-pencil-write 0.55s ease-in-out infinite; }

        .br-check1 { opacity: 0; transform-origin: 60px 85px; }
        .br-check2 { opacity: 0; transform-origin: 60px 92px; }
        .br-check3 { opacity: 0; transform-origin: 60px 99px; }
        .br-check1--working { animation: br-check-appear 0.5s ease-out 0s forwards; }
        .br-check2--working { animation: br-check-appear 0.5s ease-out 0.45s forwards; }
        .br-check3--working { animation: br-check-appear 0.5s ease-out 0.9s both; }

        .br-raised-paw { opacity: 0; }
        .br-raised-paw--done { opacity: 1; }

        .br-eye-done-l { opacity: 0; }
        .br-eye-done-r { opacity: 0; }
        .br-eye-done-l--done { opacity: 1; }
        .br-eye-done-r--done { opacity: 1; }
        .br-eye-normal-l--done { opacity: 0; }
        .br-eye-normal-r--done { opacity: 0; }

        .br-confetti rect {
          animation: br-confetti-burst 0.9s ease-out forwards;
        }
        .br-confetti--done rect { opacity: 1; }
        .br-confetti rect:nth-child(1) { --cx: -14px; --cy: -22px; --cr: 120deg; animation-delay: 0s; }
        .br-confetti rect:nth-child(2) { --cx: 14px; --cy: -26px; --cr: -82deg; animation-delay: 0.07s; }
        .br-confetti rect:nth-child(3) { --cx: -20px; --cy: -18px; --cr: 200deg; animation-delay: 0.1s; }
        .br-confetti rect:nth-child(4) { --cx: 20px; --cy: -20px; --cr: -140deg; animation-delay: 0.04s; }
        .br-confetti rect:nth-child(5) { --cx: 1px; --cy: -30px; --cr: 60deg; animation-delay: 0.13s; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <g className={`br-whole${isWorking ? " br-whole--working" : " br-whole--idle"}`}>
        {/* Body group */}
        <g className={`br-body-grp${!isWorking && !isDone ? " br-body-grp--idle" : ""}`}>
          {/* Chubby body */}
          <ellipse
            cx="58"
            cy="102"
            rx="28"
            ry="32"
            fill="url(#br-body-grad)"
            filter="url(#br-shadow)"
          />

          {/* Warm belly */}
          <ellipse cx="58" cy="108" rx="18" ry="22" fill="url(#br-belly-grad)" />

          {/* Belly highlight */}
          <ellipse cx="53" cy="100" rx="8" ry="6" fill="white" opacity="0.1" />

          {/* Left arm */}
          <ellipse cx="32" cy="100" rx="10" ry="16" fill="#5C3D2E" transform="rotate(-12 32 100)" />
          <ellipse cx="28" cy="114" rx="9" ry="7" fill="#4A2C1E" />
          {/* Left paw pads */}
          <ellipse cx="26" cy="115" rx="4" ry="3" fill="#3A1C0E" opacity="0.5" />

          {/* Clipboard */}
          <g>
            {/* Board */}
            <rect x="68" y="78" width="32" height="40" rx="3" fill="url(#br-clipboard-grad)" />
            <rect
              x="68"
              y="78"
              width="32"
              height="40"
              rx="3"
              fill="none"
              stroke="#B8904A"
              strokeWidth="1.2"
            />
            {/* Shadow on clipboard */}
            <rect x="69" y="79" width="30" height="4" rx="2" fill="white" opacity="0.2" />
            {/* Clip mechanism */}
            <rect x="76" y="73" width="16" height="8" rx="3" fill="#C8A050" />
            <rect
              x="76"
              y="73"
              width="16"
              height="8"
              rx="3"
              fill="none"
              stroke="#A08030"
              strokeWidth="1"
            />
            <rect x="80" y="71" width="8" height="5" rx="1.5" fill="#9A7830" />
            {/* Paper lines */}
            <line x1="72" y1="91" x2="96" y2="91" stroke="#B8904A" strokeWidth="1" />
            <line x1="72" y1="97" x2="96" y2="97" stroke="#B8904A" strokeWidth="1" />
            <line x1="72" y1="103" x2="96" y2="103" stroke="#B8904A" strokeWidth="1" />
            <line x1="72" y1="109" x2="88" y2="109" stroke="#B8904A" strokeWidth="1" />

            {/* Checkmarks (staggered on working, all on done) */}
            <g
              className={`br-check1${isWorking ? " br-check1--working" : ""}`}
              style={isDone ? { opacity: 1 } : {}}
            >
              <path
                d="M71 89 L74 93 L80 85"
                stroke="#22C55E"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <g
              className={`br-check2${isWorking ? " br-check2--working" : ""}`}
              style={isDone ? { opacity: 1 } : {}}
            >
              <path
                d="M71 95 L74 99 L80 91"
                stroke="#22C55E"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <g
              className={`br-check3${isWorking ? " br-check3--working" : ""}`}
              style={isDone ? { opacity: 1 } : {}}
            >
              <path
                d="M71 101 L74 105 L80 97"
                stroke="#22C55E"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>

          {/* Right arm / pencil arm */}
          <ellipse cx="84" cy="100" rx="10" ry="16" fill="#5C3D2E" transform="rotate(14 84 100)" />
          <ellipse cx="90" cy="113" rx="9" ry="7" fill="#4A2C1E" />

          {/* Pencil */}
          <g className={`br-pencil${isWorking ? " br-pencil--working" : ""}`}>
            <rect x="93" y="80" width="6" height="26" rx="2" fill="#F5C842" />
            <rect x="93" y="80" width="6" height="5" rx="1.5" fill="#FFC0CB" />
            <rect x="93" y="85" width="6" height="2" fill="#E8A830" />
            <polygon points="93,106 99,106 96,114" fill="#F5C842" />
            <polygon points="94,108 98,108 96,113" fill="#E8D8A0" />
            <polygon points="95,110 97,110 96,114" fill="#1F2937" />
            {/* Pencil highlight */}
            <rect x="94" y="81" width="2" height="20" rx="1" fill="white" opacity="0.2" />
          </g>

          {/* Legs */}
          <ellipse cx="44" cy="129" rx="13" ry="8" fill="#4A2C1E" />
          <ellipse cx="72" cy="129" rx="13" ry="8" fill="#4A2C1E" />
          <ellipse cx="42" cy="133" rx="11" ry="5" fill="#3A1C0E" />
          <ellipse cx="70" cy="133" rx="11" ry="5" fill="#3A1C0E" />
        </g>

        {/* Head group — nods */}
        <g className={`br-head-grp${isWorking ? " br-head-grp--working" : " br-head-grp--idle"}`}>
          {/* Round ears */}
          <circle cx="36" cy="38" r="12" fill="#5C3D2E" />
          <circle cx="84" cy="38" r="12" fill="#5C3D2E" />
          <circle cx="36" cy="38" r="8" fill="#7A5040" />
          <circle cx="84" cy="38" r="8" fill="#7A5040" />
          <circle cx="36" cy="38" r="5" fill="#9A7050" />
          <circle cx="84" cy="38" r="5" fill="#9A7050" />
          {/* Ear highlight */}
          <circle cx="34" cy="35" r="2.5" fill="white" opacity="0.15" />
          <circle cx="82" cy="35" r="2.5" fill="white" opacity="0.15" />

          {/* Head */}
          <ellipse
            cx="60"
            cy="60"
            rx="28"
            ry="26"
            fill="url(#br-head-grad)"
            filter="url(#br-shadow)"
          />

          {/* Head highlight */}
          <ellipse cx="48" cy="48" rx="13" ry="9" fill="white" opacity="0.1" />

          {/* Snout */}
          <ellipse cx="60" cy="70" rx="14" ry="12" fill="url(#br-snout-grad)" />
          <ellipse cx="60" cy="69" rx="11" ry="9" fill="#8A6040" opacity="0.5" />

          {/* Rosy cheeks */}
          <ellipse cx="40" cy="66" rx="10" ry="8" fill="url(#br-cheek-l)" />
          <ellipse cx="80" cy="66" rx="10" ry="8" fill="url(#br-cheek-r)" />

          {/* Eyes */}
          <g className={`br-eye-normal-l${isDone ? " br-eye-normal-l--done" : ""}`}>
            <circle cx="46" cy="57" r="6.5" fill="#2C1A0E" />
            <circle cx="46" cy="57" r="4.5" fill="#180E06" />
            <circle cx="47.8" cy="55.2" r="2" fill="white" />
            <circle cx="44.8" cy="58.5" r="1" fill="white" opacity="0.5" />
            {/* Blink */}
            <ellipse
              cx="46"
              cy="57"
              rx="6.5"
              ry="6.5"
              fill="#6C4A38"
              className={`br-blink-l${!isWorking && !isDone ? " br-blink-l--idle" : ""}`}
            />
          </g>
          <g className={`br-eye-normal-r${isDone ? " br-eye-normal-r--done" : ""}`}>
            <circle cx="74" cy="57" r="6.5" fill="#2C1A0E" />
            <circle cx="74" cy="57" r="4.5" fill="#180E06" />
            <circle cx="75.8" cy="55.2" r="2" fill="white" />
            <circle cx="72.8" cy="58.5" r="1" fill="white" opacity="0.5" />
            {/* Blink */}
            <ellipse
              cx="74"
              cy="57"
              rx="6.5"
              ry="6.5"
              fill="#6C4A38"
              className={`br-blink-r${!isWorking && !isDone ? " br-blink-r--idle" : ""}`}
            />
          </g>

          {/* Happy squinty eyes (done) */}
          <g className={`br-eye-done-l${isDone ? " br-eye-done-l--done" : ""}`}>
            <path
              d="M40 59 Q46 51 52 59"
              stroke="#2C1A0E"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g className={`br-eye-done-r${isDone ? " br-eye-done-r--done" : ""}`}>
            <path
              d="M68 59 Q74 51 80 59"
              stroke="#2C1A0E"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Nose */}
          <ellipse cx="60" cy="66" rx="5" ry="4" fill="#1A0A04" />
          <ellipse cx="58.5" cy="64.8" rx="1.8" ry="1.2" fill="white" opacity="0.4" />

          {/* Smile */}
          <path
            d="M52 73 Q60 80 68 73"
            stroke="#2C1A0E"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Spectacles */}
          <g className={`br-glasses${!isWorking && !isDone ? " br-glasses--idle" : ""}`}>
            {/* Left lens */}
            <circle cx="46" cy="66" r="9" fill="none" stroke="#6B5030" strokeWidth="2" />
            <circle cx="46" cy="66" r="9" fill="rgba(200,230,255,0.15)" />
            {/* Right lens */}
            <circle cx="74" cy="66" r="9" fill="none" stroke="#6B5030" strokeWidth="2" />
            <circle cx="74" cy="66" r="9" fill="rgba(200,230,255,0.15)" />
            {/* Bridge */}
            <line x1="55" y1="66" x2="65" y2="66" stroke="#6B5030" strokeWidth="2" />
            {/* Left arm */}
            <path d="M37 64 Q30 62 28 65" stroke="#6B5030" strokeWidth="1.8" fill="none" />
            {/* Right arm */}
            <path d="M83 64 Q90 62 92 65" stroke="#6B5030" strokeWidth="1.8" fill="none" />
            {/* Lens glare */}
            <line
              x1="40"
              y1="61"
              x2="43"
              y2="63"
              stroke="white"
              strokeWidth="1.2"
              opacity="0.5"
              strokeLinecap="round"
            />
            <line
              x1="68"
              y1="61"
              x2="71"
              y2="63"
              stroke="white"
              strokeWidth="1.2"
              opacity="0.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Done: raised paw */}
        <g className={`br-raised-paw${isDone ? " br-raised-paw--done" : ""}`}>
          <ellipse cx="34" cy="72" rx="10" ry="16" fill="#5C3D2E" transform="rotate(30 34 72)" />
          <ellipse cx="26" cy="60" rx="9" ry="7" fill="#4A2C1E" />
          <circle cx="18" cy="46" r="13" fill="#22C55E" />
          <circle cx="18" cy="46" r="11" fill="#16A34A" />
          <path
            d="M11 46 L16 52 L26 38"
            stroke="white"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 36 L8 32 M6 38 L2 36 M4 42 L0 44"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M28 36 L28 32 M30 38 L34 36 M32 42 L36 44"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Confetti */}
        <g
          className={`br-confetti${isDone ? " br-confetti--done" : ""}`}
          style={{ opacity: isDone ? 1 : 0 }}
        >
          <rect
            x="59"
            y="43"
            width="5"
            height="5"
            rx="1"
            fill="#F59E0B"
            transform="rotate(15 59 43)"
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
            y="41"
            width="4"
            height="6"
            rx="1"
            fill="#6366F1"
            transform="rotate(35 48 41)"
          />
          <rect
            x="80"
            y="43"
            width="3"
            height="5"
            rx="0.5"
            fill="#14B8A6"
            transform="rotate(-10 80 43)"
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
