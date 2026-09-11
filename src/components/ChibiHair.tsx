import type { HairStyle } from '../data/demoPlayers'

/** Shared chibi hair silhouettes for players + staff. */
export function ChibiHair({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case 'spiky':
      return (
        <g className="pf-hair">
          <path
            d="M42 48 C40 28 52 18 70 16 C88 18 100 28 98 48 L94 52 C90 36 78 28 70 26 C62 28 50 36 46 52 Z"
            fill={color}
          />
          <path d="M52 28 L48 12 L58 26" fill={color} />
          <path d="M68 22 L70 8 L76 22" fill={color} />
          <path d="M84 26 L92 12 L90 30" fill={color} />
          <path
            d="M58 24 Q70 18 82 24"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.18"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )
    case 'bowl':
      return (
        <g className="pf-hair">
          <ellipse cx="70" cy="42" rx="32" ry="26" fill={color} />
          <rect x="40" y="42" width="60" height="14" fill={color} />
          <ellipse cx="62" cy="30" rx="10" ry="6" fill="#fff" opacity="0.12" />
        </g>
      )
    case 'side':
      return (
        <g className="pf-hair">
          <path
            d="M44 50 C42 30 55 18 72 18 C90 18 100 32 98 50 L94 48 C92 34 82 26 72 26 C58 26 48 36 48 48 Z"
            fill={color}
          />
          <path d="M98 48 Q110 62 104 78 Q98 70 94 58 Z" fill={color} />
          <ellipse cx="64" cy="30" rx="9" ry="5" fill="#fff" opacity="0.12" />
        </g>
      )
    case 'curly':
      return (
        <g className="pf-hair">
          <circle cx="48" cy="40" r="12" fill={color} />
          <circle cx="62" cy="28" r="13" fill={color} />
          <circle cx="78" cy="26" r="14" fill={color} />
          <circle cx="92" cy="38" r="12" fill={color} />
          <circle cx="54" cy="48" r="10" fill={color} />
          <circle cx="86" cy="48" r="10" fill={color} />
          <circle cx="70" cy="32" r="5" fill="#fff" opacity="0.1" />
        </g>
      )
    case 'fluffy':
      return (
        <g className="pf-hair">
          <ellipse cx="70" cy="38" rx="34" ry="28" fill={color} />
          <circle cx="44" cy="48" r="10" fill={color} />
          <circle cx="96" cy="48" r="10" fill={color} />
          <ellipse cx="60" cy="28" rx="10" ry="6" fill="#fff" opacity="0.12" />
        </g>
      )
    case 'long':
      // Adult / female: soft fringe + shoulder-length layers (still chibi)
      return (
        <g className="pf-hair">
          <path
            d="M40 52 C38 28 52 16 70 15 C88 16 102 28 100 52 L96 50 C94 34 84 26 70 25 C56 26 46 34 44 50 Z"
            fill={color}
          />
          {/* left cascade */}
          <path
            d="M40 50 C36 68 34 88 38 102 Q46 96 48 78 Q50 62 46 52 Z"
            fill={color}
          />
          {/* right cascade */}
          <path
            d="M100 50 C104 68 106 88 102 102 Q94 96 92 78 Q90 62 94 52 Z"
            fill={color}
          />
          {/* soft fringe */}
          <path
            d="M48 40 Q58 48 70 42 Q82 48 92 40"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.95"
          />
          <ellipse cx="60" cy="28" rx="9" ry="5" fill="#fff" opacity="0.12" />
        </g>
      )
    case 'buzz':
      // very short buzz cut — thin cap hugging the skull
      return (
        <g className="pf-hair">
          <path
            d="M48 50 C46 36 56 26 70 26 C84 26 94 36 92 50 L88 48 C86 38 80 32 70 32 C60 32 54 38 52 48 Z"
            fill={color}
          />
          <ellipse cx="70" cy="34" rx="18" ry="8" fill="#fff" opacity="0.08" />
        </g>
      )
    case 'afro':
      // rounded afro / curly volume — big soft sphere of coils
      return (
        <g className="pf-hair">
          <circle cx="70" cy="36" r="36" fill={color} />
          <circle cx="42" cy="44" r="14" fill={color} />
          <circle cx="98" cy="44" r="14" fill={color} />
          <circle cx="50" cy="24" r="12" fill={color} />
          <circle cx="90" cy="24" r="12" fill={color} />
          <circle cx="70" cy="18" r="14" fill={color} />
          <circle cx="58" cy="30" r="6" fill="#fff" opacity="0.1" />
          <circle cx="82" cy="28" r="5" fill="#fff" opacity="0.08" />
        </g>
      )
    default:
      // short — neat straight fringe
      return (
        <g className="pf-hair">
          <path
            d="M46 52 C44 34 55 22 70 22 C85 22 96 34 94 52 L90 50 C88 38 80 30 70 30 C60 30 52 38 50 50 Z"
            fill={color}
          />
          <path
            d="M52 36 Q70 28 88 36"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.14"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      )
  }
}
