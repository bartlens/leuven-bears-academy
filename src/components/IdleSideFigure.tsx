import type { AcademyPlayer } from '../data/demoPlayers'

type Props = {
  player: AcademyPlayer
  /** Walk direction — drawn facing RIGHT, flipped for left */
  facing: 'left' | 'right'
  /** Looking toward the camera (peek / glance) */
  glance?: boolean
  holding?: boolean
  className?: string
}

/**
 * Compact side-profile chibi for idle egg.
 * Clear legs, jersey, shoes; optional ¾ face when glancing at camera.
 */
export function IdleSideFigure({
  player,
  facing,
  glance = false,
  holding = false,
  className = '',
}: Props) {
  const { hair, skin, cheek = '#f08070' } = player.look
  const flip = facing === 'left' ? -1 : 1

  return (
    <svg
      viewBox="0 0 110 160"
      className={`idle-side-figure ${glance ? 'is-glance' : ''} ${holding ? 'is-holding' : ''} ${className}`}
      style={{ transform: `scaleX(${flip})` }}
      role="img"
      aria-hidden="true"
      overflow="visible"
    >
      <ellipse cx="55" cy="152" rx="26" ry="5" fill="#000" opacity="0.28" />

      <g className="idle-side-char">
        {/* Far leg */}
        <g className="idle-side-leg idle-side-leg--back">
          <path
            d="M52 102 C48 118 46 130 44 146"
            fill="none"
            stroke="#1a2127"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <ellipse cx="43" cy="148" rx="10" ry="4.5" fill="#0a0a0a" />
        </g>

        {/* Torso / jersey */}
        <path
          d="M38 58
             C36 78 38 96 42 102
             H68
             C72 96 74 78 72 58
             Z"
          fill="#f38019"
        />
        <path d="M40 96 H70 L72 106 H38 Z" fill="#141a1f" />
        <path d="M42 64 H68" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.4" />
        <text
          x="55"
          y="84"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          fill="#1a120e"
          fontFamily="system-ui, sans-serif"
        >
          {player.number}
        </text>

        {/* Near leg */}
        <g className="idle-side-leg idle-side-leg--front">
          <path
            d="M60 102 C66 118 68 130 70 146"
            fill="none"
            stroke="#12171c"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path d="M64 132 H76 V142 H62 Z" fill="#f2f2f2" opacity="0.95" />
          <ellipse cx="71" cy="148" rx="10" ry="4.5" fill="#0a0a0a" />
        </g>

        {/* Far arm */}
        <path
          d="M70 62 C84 74 82 96 78 102"
          fill="none"
          stroke={skin}
          strokeWidth="9"
          strokeLinecap="round"
          className="idle-side-arm-back"
        />

        {/* Near arm */}
        <path
          d={holding ? 'M42 62 C26 70 28 88 32 94' : 'M42 62 C28 78 30 98 34 104'}
          fill="none"
          stroke={skin}
          strokeWidth="9"
          strokeLinecap="round"
          className="idle-side-arm-front"
        />

        {holding && (
          <g className="idle-side-ball">
            <circle cx="30" cy="96" r="13" fill="#f38019" />
            <path
              d="M30 84 V108 M18 96 H42"
              fill="none"
              stroke="#1a120e"
              strokeWidth="1.4"
            />
          </g>
        )}

        {/* Head */}
        <g className="idle-side-head">
          {glance ? (
            <>
              {/* ¾ face toward camera */}
              <circle cx="56" cy="38" r="22" fill={skin} />
              <path
                d="M36 36 Q42 12 58 10 Q78 12 78 38 Q74 24 56 22 Q42 24 36 36 Z"
                fill={hair}
              />
              <ellipse cx="48" cy="38" rx="3.6" ry="4" fill="#1a120e" />
              <circle cx="49" cy="37" r="1.2" fill="#fff" />
              <ellipse cx="62" cy="38" rx="3.6" ry="4" fill="#1a120e" />
              <circle cx="63" cy="37" r="1.2" fill="#fff" />
              <path
                d="M48 48 Q56 53 64 48"
                fill="none"
                stroke="#1a120e"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="44" cy="46" r="2.6" fill={cheek} opacity="0.75" />
              <circle cx="66" cy="46" r="2.6" fill={cheek} opacity="0.75" />
            </>
          ) : (
            <>
              {/* True side profile */}
              <ellipse cx="62" cy="38" rx="18" ry="21" fill={skin} />
              <path
                d="M74 36 C82 38 82 44 74 46"
                fill="none"
                stroke={skin}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M46 34 Q52 10 66 10 Q82 12 84 36 Q80 22 66 20 Q52 22 46 34 Z"
                fill={hair}
              />
              <path d="M46 32 C42 42 44 54 50 56 C48 48 50 40 54 36" fill={hair} />
              <ellipse cx="50" cy="40" rx="4.5" ry="6" fill={skin} />
              <ellipse cx="70" cy="38" rx="3.2" ry="3.8" fill="#1a120e" />
              <circle cx="71" cy="37" r="1.1" fill="#fff" />
              <path
                d="M68 47 C72 50 76 48 78 46"
                fill="none"
                stroke="#1a120e"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <circle cx="58" cy="46" r="2.4" fill={cheek} opacity="0.7" />
            </>
          )}
        </g>
      </g>
    </svg>
  )
}
