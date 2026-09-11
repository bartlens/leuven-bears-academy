import type { StaffMember } from '../sheet/beheerTypes'
import { ChibiHair } from './ChibiHair'

type StaffFigureProps = {
  staff: StaffMember
  className?: string
}

/**
 * Chibi staff poppetje — same visual language as PlayerFigure, but adult
 * outfits (coach tracksuit / parent volunteer). Hover moves:
 * whistle-clap (Jonathan), laugh (Rafa), cheer (Els).
 */
export function StaffFigure({ staff, className = '' }: StaffFigureProps) {
  const { hair, skin, hairStyle, cheek = '#f08070', eyeStyle = 'round' } = staff.look
  const uid = staff.id
  const softEyes = eyeStyle === 'soft'
  const isCoach = staff.outfit === 'coach'
  const move = staff.move

  return (
    <svg
      viewBox="0 0 140 160"
      className={`staff-figure player-figure sf-move-${move} ${className}`}
      data-move={move}
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`sf-glow-${uid}`} cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#f38019" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f38019" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`sf-top-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          {isCoach ? (
            <>
              <stop offset="0%" stopColor="#2a3238" />
              <stop offset="45%" stopColor="#1a2127" />
              <stop offset="100%" stopColor="#0e1215" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#f0b070" />
              <stop offset="40%" stopColor="#e8954a" />
              <stop offset="100%" stopColor="#c45f0a" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`sf-shine-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
        <filter id={`sf-soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>

      <ellipse
        className="pf-glow"
        cx="70"
        cy="152"
        rx="44"
        ry="8"
        fill={`url(#sf-glow-${uid})`}
      />
      <ellipse className="pf-shadow" cx="70" cy="150" rx="28" ry="4.5" fill="#000" opacity="0.28" />

      {/* coach encourage — closed-eye laugh + cheers, no teeth mouth */}
      {(move === 'laugh' || move === 'whistle-clap') && (
        <g className="sf-encourage" opacity="0">
          <text
            x="106"
            y="32"
            fontSize="10"
            fontWeight="900"
            fill="#f38019"
            fontFamily="'Space Grotesk', system-ui, sans-serif"
          >
            kom op!
          </text>
          <text
            x="14"
            y="40"
            fontSize="11"
            fontWeight="900"
            fill="#ff9a3d"
            fontFamily="'Space Grotesk', system-ui, sans-serif"
          >
            yes!
          </text>
          <text
            x="112"
            y="50"
            fontSize="9"
            fontWeight="800"
            fill="#fff8f0"
            fontFamily="'Space Grotesk', system-ui, sans-serif"
          >
            go!
          </text>
        </g>
      )}

      {/* cheer sparkles — no hearts; soft supporter vibe */}
      {move === 'cheer' && (
        <g className="sf-cheer-bits" opacity="0">
          <text
            x="18"
            y="48"
            fontSize="10"
            fontWeight="900"
            fill="#f38019"
            fontFamily="'Space Grotesk', system-ui, sans-serif"
          >
            go!
          </text>
          <circle cx="112" cy="34" r="2.2" fill="#f38019" opacity="0.9" />
          <circle cx="120" cy="44" r="1.6" fill="#fff8f0" opacity="0.85" />
          <circle cx="104" cy="42" r="1.4" fill="#0a0a0a" opacity="0.7" />
        </g>
      )}

      <g className="pf-char" filter={`url(#sf-soft-${uid})`}>
        <g className="pf-legs">
          <g className="pf-leg-l">
            <rect x="52" y="116" width="13" height="28" rx="6.5" fill="#141414" />
            <ellipse cx="58.5" cy="146" rx="11" ry="5" fill="#080808" />
            <rect x="49" y="141" width="19" height="6" rx="2.5" fill="#f38019" opacity="0.95" />
            <rect x="49" y="141" width="19" height="2" rx="1" fill="#ff9a3d" opacity="0.55" />
          </g>
          <g className="pf-leg-r">
            <rect x="75" y="116" width="13" height="28" rx="6.5" fill="#141414" />
            <ellipse cx="81.5" cy="146" rx="11" ry="5" fill="#080808" />
            <rect x="72" y="141" width="19" height="6" rx="2.5" fill="#f38019" opacity="0.95" />
            <rect x="72" y="141" width="19" height="2" rx="1" fill="#ff9a3d" opacity="0.55" />
          </g>
        </g>

        <g className="pf-body">
          <path
            d="M43 68 C43 61 52 56 70 56 C88 56 97 61 97 68 L101 116 C101 123 94 127 70 127 C46 127 39 123 39 116 Z"
            fill={`url(#sf-top-${uid})`}
            className="pf-jersey"
          />
          <path
            d="M43 68 C43 61 52 56 70 56 C88 56 97 61 97 68 L101 116 C101 123 94 127 70 127 C46 127 39 123 39 116 Z"
            fill={`url(#sf-shine-${uid})`}
            pointerEvents="none"
          />

          {isCoach ? (
            <>
              <path d="M49 72 L47 122" stroke="#f38019" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M91 72 L93 122" stroke="#f38019" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M52 72 L50 122" stroke="#ff9a3d" strokeWidth="1" strokeOpacity="0.45" />
              <path d="M88 72 L90 122" stroke="#ff9a3d" strokeWidth="1" strokeOpacity="0.45" />
              <path d="M58 56 Q70 66 82 56 L82 62 Q70 70 58 62 Z" fill="#0a0a0a" />
              <path
                d="M60 58 Q70 64 80 58"
                fill="none"
                stroke="#f38019"
                strokeWidth="1.3"
                strokeOpacity="0.8"
              />
              <circle cx="70" cy="88" r="9" fill="#f38019" opacity="0.95" />
              <circle cx="70" cy="88" r="9" fill="none" stroke="#fff8f0" strokeWidth="1" strokeOpacity="0.35" />
              <text x="70" y="92" textAnchor="middle" fontSize="10">
                🐻
              </text>
              {/* whistle on lanyard — Rafa keeps chest bounce; Jonathan fades this during blow */}
              <g className="sf-whistle">
                <path
                  d="M74 72 Q86 86 96 98"
                  fill="none"
                  stroke="#f38019"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  opacity="0.95"
                />
                <ellipse cx="99" cy="101" rx="8.2" ry="6" fill="#f2ebe0" stroke="#1a2127" strokeWidth="1.25" />
                <rect x="105.5" y="97.8" width="9.5" height="5.8" rx="1.5" fill="#1a2127" />
                <circle cx="96.5" cy="100.5" r="1.5" fill="#1a2127" opacity="0.5" />
                <circle cx="101.5" cy="99.8" r="1.2" fill="#f38019" opacity="0.9" />
              </g>
            </>
          ) : (
            <>
              <path d="M58 56 Q70 64 82 56 L80 62 Q70 68 60 62 Z" fill="#fff8f0" opacity="0.85" />
              <path
                d="M48 100 Q70 108 92 100"
                fill="none"
                stroke="#fff8f0"
                strokeWidth="1.4"
                strokeOpacity="0.28"
              />
              <rect x="58" y="92" width="24" height="16" rx="3" fill="#0a0a0a" opacity="0.12" />
              <text x="70" y="86" textAnchor="middle" fontSize="11" opacity="0.9">
                🐻
              </text>
            </>
          )}

          <g className="pf-jersey-hem">
            <path
              d="M42 118 Q70 124 98 118 L100 122 Q70 130 40 122 Z"
              fill={isCoach ? '#0a0a0a' : '#a84a0a'}
              opacity="0.95"
            />
          </g>
        </g>

        <g className="pf-arm-l">
          <ellipse
            cx="34"
            cy="90"
            rx="10"
            ry="17"
            fill={isCoach ? '#1a2127' : `url(#sf-top-${uid})`}
          />
          <ellipse cx="34" cy="84" rx="5" ry="4" fill="#fff" opacity="0.1" />
          <circle cx="32" cy="106" r="7.5" fill={skin} />
          <circle cx="30" cy="104" r="1.6" fill="#fff" opacity="0.25" />
          {/* coachbord — held in left hand; light tilt on hover */}
          {isCoach && (
            <g className="sf-clipboard">
              <rect
                x="10"
                y="96"
                width="20"
                height="26"
                rx="2"
                fill="#fff8f0"
                stroke="#1a2127"
                strokeWidth="1.2"
              />
              <rect x="14" y="92.5" width="12" height="6" rx="1.4" fill="#1a2127" />
              <rect x="16" y="94" width="8" height="2.6" rx="0.7" fill="#f38019" />
              <path
                d="M14 106 H26 M14 111 H26 M14 116 H23"
                fill="none"
                stroke="#1a2127"
                strokeWidth="1.05"
                strokeLinecap="round"
                opacity="0.4"
              />
              <text
                x="20"
                y="123"
                textAnchor="middle"
                fontSize="5.5"
                fontWeight="800"
                fill="#f38019"
                fontFamily="'Space Grotesk', system-ui, sans-serif"
                opacity="0.9"
              >
                C
              </text>
            </g>
          )}
        </g>
        <g className="pf-arm-r">
          <ellipse
            cx="106"
            cy="86"
            rx="10"
            ry="16"
            fill={isCoach ? '#1a2127' : `url(#sf-top-${uid})`}
          />
          <ellipse cx="106" cy="80" rx="5" ry="4" fill="#fff" opacity="0.1" />
          <circle cx="110" cy="100" r="7.5" fill={skin} />
          <circle cx="108" cy="98" r="1.6" fill="#fff" opacity="0.25" />
          {/* Jonathan: hand-held whistle — rides the arm raise up to the mouth */}
          {move === 'whistle-clap' && (
            <g className="sf-whistle-hand" opacity="0">
              <ellipse
                cx="104"
                cy="94"
                rx="7.4"
                ry="5.4"
                fill="#f2ebe0"
                stroke="#1a2127"
                strokeWidth="1.2"
                transform="rotate(-55 104 94)"
              />
              <rect
                x="108.2"
                y="88.2"
                width="8.8"
                height="5.2"
                rx="1.4"
                fill="#1a2127"
                transform="rotate(-55 112.6 90.8)"
              />
              <circle cx="101.2" cy="93.2" r="1.3" fill="#1a2127" opacity="0.5" />
              <circle cx="105.6" cy="92.4" r="1.1" fill="#f38019" opacity="0.95" />
            </g>
          )}
        </g>

        <g className="pf-head">
          <ellipse cx="70" cy="48" rx="27" ry="28" fill={skin} />
          <ChibiHair style={hairStyle} color={hair} />
          <ellipse cx="70" cy="52" rx="23" ry="20" fill={skin} />
          <ellipse cx="70" cy="60" rx="16" ry="10" fill="#000" opacity="0.04" />

          <g className="pf-eyes">
            <ellipse
              cx="58"
              cy="50"
              rx={softEyes ? 5.5 : 5}
              ry={softEyes ? 4.2 : 5.5}
              fill="#0a0a0a"
              className="sf-eye-open"
            />
            <ellipse
              cx="82"
              cy="50"
              rx={softEyes ? 5.5 : 5}
              ry={softEyes ? 4.2 : 5.5}
              fill="#0a0a0a"
              className="sf-eye-open"
            />
            {/* squint arcs for laugh — shown via CSS */}
            <path
              className="sf-eye-squint"
              d="M52 50 Q58 46 64 50"
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0"
            />
            <path
              className="sf-eye-squint"
              d="M76 50 Q82 46 88 50"
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0"
            />
            <circle cx="60" cy="48" r="1.9" fill="#fff" className="pf-eye-shine" />
            <circle cx="84" cy="48" r="1.9" fill="#fff" className="pf-eye-shine" />
            <ellipse className="pf-lid" cx="58" cy="50" rx="6" ry="0.5" fill={skin} opacity="0" />
            <ellipse className="pf-lid" cx="82" cy="50" rx="6" ry="0.5" fill={skin} opacity="0" />
          </g>

          <ellipse cx="48" cy="58" rx="5" ry="3" fill={cheek} opacity="0.45" className="sf-cheek" />
          <ellipse cx="92" cy="58" rx="5" ry="3" fill={cheek} opacity="0.45" className="sf-cheek" />

          {/* idle smile — kept on laugh (eyes closed = the laugh) */}
          <path
            d="M60 64 Q70 72 80 64"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2"
            strokeLinecap="round"
            className="pf-smile sf-smile-idle"
          />
          {/* whistle O-mouth + blow whistle + sound ticks — Jonathan only */}
          {move === 'whistle-clap' && (
            <>
              <ellipse
                className="sf-whistle-mouth"
                cx="70"
                cy="66"
                rx="5.2"
                ry="4.2"
                fill="#0a0a0a"
                opacity="0"
              />
              {/* mouth-held whistle (unmistakable blow) — crossfades with chest/hand */}
              <g className="sf-whistle-blow" opacity="0">
                <ellipse
                  cx="78"
                  cy="66"
                  rx="7.6"
                  ry="5.5"
                  fill="#f2ebe0"
                  stroke="#1a2127"
                  strokeWidth="1.25"
                  transform="rotate(-18 78 66)"
                />
                <rect
                  x="83.5"
                  y="61.6"
                  width="9"
                  height="5.4"
                  rx="1.4"
                  fill="#1a2127"
                  transform="rotate(-18 88 64.3)"
                />
                <circle cx="75.2" cy="65.4" r="1.35" fill="#1a2127" opacity="0.5" />
                <circle cx="79.8" cy="64.6" r="1.15" fill="#f38019" opacity="0.95" />
              </g>
              <g className="sf-whistle-sound" opacity="0">
                <path
                  d="M88 58 Q94 54 98 57"
                  fill="none"
                  stroke="#f38019"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M90 64 Q97 61 102 65"
                  fill="none"
                  stroke="#ff9a3d"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <path
                  d="M89 52 Q95 47 101 50"
                  fill="none"
                  stroke="#fff8f0"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <text
                  x="104"
                  y="48"
                  fontSize="11"
                  fill="#f38019"
                  fontFamily="'Space Grotesk', system-ui, sans-serif"
                >
                  ♪
                </text>
              </g>
            </>
          )}
          {/* soft cheer smile — slightly wider, still closed */}
          <path
            d="M58 64 Q70 74 82 64"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2.3"
            strokeLinecap="round"
            className="sf-cheer-smile"
            opacity="0"
          />
        </g>
      </g>
    </svg>
  )
}
