import type { AcademyPlayer as Player } from '../data/demoPlayers'
import { ChibiHair } from './ChibiHair'

type PlayerFigureProps = {
  player: Player
  className?: string
}

/** Accent / emoji props that don't come from look — keep playful extras. */
function extrasFromPlayer(player: Player) {
  const cheek = player.look.cheek ?? (player.accent === 'warm' ? '#ff8a7a' : '#f08070')
  // Bear ears look like side hair-buns; skip on short hair (Thomas/Felix look)
  const showBearEars =
    (player.accent === 'bear' || player.emoji === '🐻') && player.look.hairStyle !== 'short'
  const showSpark = player.emoji === '⚡' || player.emoji === '✨' || player.emoji === '⭐'
  const showBand = player.emoji === '🔥' || player.emoji === '🚀' || player.emoji === '🌪️'
  const showShield = player.emoji === '🛡️' || player.emoji === '💪'
  const showTrophy = player.emoji === '🏆' || player.emoji === '🎯'
  return { cheek, showBearEars, showSpark, showBand, showShield, showTrophy }
}

export function PlayerFigure({ player, className = '' }: PlayerFigureProps) {
  const { hair, skin, hairStyle, eyeStyle = 'round' } = player.look
  const t = extrasFromPlayer(player)
  const num = String(player.number)
  const isDunk = player.move === 'dunk'
  const isRebound = player.move === 'rebound'
  const softEyes = eyeStyle === 'soft'
  const uid = player.id

  return (
    <svg
      viewBox="0 0 140 160"
      className={`player-figure pf-move-${player.move} ${className}`}
      data-move={player.move}
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#f38019" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f38019" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`jersey-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff9a3d" />
          <stop offset="42%" stopColor="#f38019" />
          <stop offset="100%" stopColor="#c45f0a" />
        </linearGradient>
        <linearGradient id={`jersey-shine-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id={`ball-${uid}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffb060" />
          <stop offset="55%" stopColor="#e87722" />
          <stop offset="100%" stopColor="#a84a0a" />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* soft floor glow + contact shadow */}
      <ellipse
        className="pf-glow"
        cx="70"
        cy="152"
        rx="44"
        ry="8"
        fill={`url(#glow-${uid})`}
      />
      <ellipse className="pf-shadow" cx="70" cy="150" rx="28" ry="4.5" fill="#000" opacity="0.28" />

      {/* rim + net for dunk / rebound (hidden until hover via CSS) */}
      {(isDunk || isRebound) && (
        <g className="pf-rim" opacity="0">
          {/* backboard */}
          <rect x="92" y="2" width="18" height="22" rx="2" fill="#fff8f0" stroke="#c9d0d6" strokeWidth="1.2" opacity="0.92" />
          <rect x="96" y="6" width="10" height="10" rx="1" fill="none" stroke="#f38019" strokeWidth="1.4" opacity="0.85" />
          {/* pole */}
          <rect x="108" y="22" width="3.5" height="18" rx="1" fill="#9aa3ab" />
          {/* orange rim */}
          <ellipse cx="78" cy="14" rx="26" ry="7.5" fill="none" stroke="#f38019" strokeWidth="3.8" />
          <ellipse cx="78" cy="14" rx="26" ry="7.5" fill="none" stroke="#ffb060" strokeWidth="1.2" opacity="0.55" />
          {/* net — separate class for swish on dunk slam */}
          <g className="pf-net">
            <path
              d="M56 16 Q62 30 66 38 M66 16 Q70 32 72 40 M78 16 L78 42 M90 16 Q86 32 84 40 M100 16 Q94 30 90 38"
              fill="none"
              stroke="#fff8f0"
              strokeWidth="1.15"
              strokeOpacity="0.7"
              strokeLinecap="round"
            />
            <path
              d="M56 16 Q78 26 100 16 M60 24 Q78 34 96 24 M64 32 Q78 40 92 32"
              fill="none"
              stroke="#fff8f0"
              strokeWidth="1"
              strokeOpacity="0.45"
              strokeLinecap="round"
            />
          </g>
        </g>
      )}

      {/* character root — most move anims target this */}
      <g className="pf-char" filter={`url(#soft-${uid})`}>
        {/* legs */}
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

        {/* body / jersey — cleaner Leuven orange/black */}
        <g className="pf-body">
          <path
            d="M43 70 C43 63 52 58 70 58 C88 58 97 63 97 70 L101 116 C101 123 94 127 70 127 C46 127 39 123 39 116 Z"
            fill={`url(#jersey-${uid})`}
            className="pf-jersey"
          />
          {/* fabric shine overlay */}
          <path
            d="M43 70 C43 63 52 58 70 58 C88 58 97 63 97 70 L101 116 C101 123 94 127 70 127 C46 127 39 123 39 116 Z"
            fill={`url(#jersey-shine-${uid})`}
            pointerEvents="none"
          />
          {/* black side panels */}
          <path d="M43 76 L39 116 C39 121 45 124 49 124 L49 76 Z" fill="#0a0a0a" opacity="0.9" />
          <path d="M97 76 L101 116 C101 121 95 124 91 124 L91 76 Z" fill="#0a0a0a" opacity="0.9" />
          {/* thin white piping */}
          <path d="M49 76 L49 122" stroke="#fff8f0" strokeWidth="1" strokeOpacity="0.35" />
          <path d="M91 76 L91 122" stroke="#fff8f0" strokeWidth="1" strokeOpacity="0.35" />
          {/* collar */}
          <path d="M58 58 Q70 67 82 58 L82 64 Q70 72 58 64 Z" fill="#0a0a0a" />
          <path
            d="M60 60 Q70 66 80 60"
            fill="none"
            stroke="#f38019"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
          {/* jersey hem flap — secondary motion, hinged at waist */}
          <g className="pf-jersey-hem">
            <path
              d="M42 118 Q70 124 98 118 L100 122 Q70 130 40 122 Z"
              fill="#c45f0a"
              opacity="0.95"
            />
            <path
              d="M48 120 Q70 126 92 120"
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="1"
              strokeOpacity="0.25"
            />
          </g>
          {/* number */}
          <text
            x="70"
            y="100"
            textAnchor="middle"
            fontFamily="'Space Grotesk', system-ui, sans-serif"
            fontWeight="900"
            fontSize={num.length > 1 ? 22 : 26}
            fill="#fff8f0"
            className="pf-number"
            style={{ paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 0.6 }}
          >
            {num}
          </text>
          {t.showShield && (
            <text x="70" y="76" textAnchor="middle" fontSize="10" opacity="0.9">
              🛡️
            </text>
          )}
          {t.showTrophy && (
            <text x="70" y="76" textAnchor="middle" fontSize="10" opacity="0.9">
              ⭐
            </text>
          )}
        </g>

        {/* arms — hinged at shoulders */}
        <g className="pf-arm-l">
          <ellipse cx="34" cy="90" rx="10" ry="17" fill={`url(#jersey-${uid})`} />
          <ellipse cx="34" cy="84" rx="5" ry="4" fill="#fff" opacity="0.12" />
          <circle cx="32" cy="106" r="7.5" fill={skin} />
          <circle cx="30" cy="104" r="1.6" fill="#fff" opacity="0.25" />
        </g>
        <g className="pf-arm-r">
          <ellipse cx="106" cy="86" rx="10" ry="16" fill={`url(#jersey-${uid})`} />
          <ellipse cx="106" cy="80" rx="5" ry="4" fill="#fff" opacity="0.12" />
          <circle cx="110" cy="100" r="7.5" fill={skin} />
          <circle cx="108" cy="98" r="1.6" fill="#fff" opacity="0.25" />
        </g>

        {/* basketball — premium highlight */}
        <g className="pf-ball">
          <circle cx="118" cy="116" r="14.5" fill={`url(#ball-${uid})`} />
          <path
            d="M118 102 Q126 116 118 130 M104 116 Q118 108 132 116 M108 106 Q118 116 128 126 M128 106 Q118 116 108 126"
            fill="none"
            stroke="#6b2e08"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <circle cx="118" cy="116" r="14.5" fill="none" stroke="#a84a0a" strokeWidth="1.4" />
          <ellipse cx="112" cy="110" rx="4.5" ry="3" fill="#fff" opacity="0.35" />
        </g>

        {/* head */}
        <g className="pf-head">
          {t.showBearEars && (
            <g className="pf-ears">
              <ellipse cx="48" cy="42" rx="10" ry="12" fill={hair} />
              <ellipse cx="48" cy="42" rx="5" ry="6" fill={skin} />
              <ellipse cx="92" cy="42" rx="10" ry="12" fill={hair} />
              <ellipse cx="92" cy="42" rx="5" ry="6" fill={skin} />
            </g>
          )}
          <ellipse cx="70" cy="50" rx="27" ry="29" fill={skin} />
          <ChibiHair style={hairStyle} color={hair} />
          {/* face peek through hair */}
          <ellipse cx="70" cy="54" rx="23" ry="21" fill={skin} />
          {/* soft cheek/face shade */}
          <ellipse cx="70" cy="62" rx="16" ry="10" fill="#000" opacity="0.04" />

          {/* eyes — soft = slightly narrower for Jia Le */}
          <g className="pf-eyes">
            <ellipse
              cx="58"
              cy="52"
              rx={softEyes ? 5.5 : 5}
              ry={softEyes ? 4.2 : 5.8}
              fill="#0a0a0a"
            />
            <ellipse
              cx="82"
              cy="52"
              rx={softEyes ? 5.5 : 5}
              ry={softEyes ? 4.2 : 5.8}
              fill="#0a0a0a"
            />
            <circle cx="60" cy="50" r="1.9" fill="#fff" className="pf-eye-shine" />
            <circle cx="84" cy="50" r="1.9" fill="#fff" className="pf-eye-shine" />
            {/* blink lids */}
            <ellipse className="pf-lid" cx="58" cy="52" rx="6" ry="0.5" fill={skin} opacity="0" />
            <ellipse className="pf-lid" cx="82" cy="52" rx="6" ry="0.5" fill={skin} opacity="0" />
          </g>

          {/* cheeks */}
          <ellipse cx="48" cy="60" rx="5" ry="3" fill={t.cheek} opacity="0.48" />
          <ellipse cx="92" cy="60" rx="5" ry="3" fill={t.cheek} opacity="0.48" />

          {/* smile */}
          <path
            d="M60 66 Q70 74 80 66"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2"
            strokeLinecap="round"
            className="pf-smile"
          />

          {t.showBand && (
            <rect x="44" y="42" width="52" height="7" rx="2" fill="#0a0a0a" className="pf-band" />
          )}
          {t.showSpark && (
            <g className="pf-spark">
              <path
                d="M108 26 L110 34 L118 36 L110 38 L108 46 L106 38 L98 36 L106 34 Z"
                fill="#ff7e1f"
              />
            </g>
          )}
        </g>
      </g>
    </svg>
  )
}
