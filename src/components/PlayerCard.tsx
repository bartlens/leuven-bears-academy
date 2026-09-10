import type { AcademyPlayer } from '../data/demoPlayers'
import { playPlayerClickSound } from '../audio/playerClickSound'
import { PlayerFigure } from './PlayerFigure'

type PlayerCardProps = {
  player: AcademyPlayer
  index?: number
}

const accentRing: Record<AcademyPlayer['accent'], string> = {
  orange: 'from-hoop/30 via-panel/80 to-ink-soft border-hoop/40',
  bear: 'from-bear/40 via-panel/80 to-ink-soft border-white/12',
  warm: 'from-warm/20 via-panel/80 to-ink-soft border-warm/35',
}

export function PlayerCard({ player, index = 0 }: PlayerCardProps) {
  const onTap = () => {
    playPlayerClickSound(player)
  }

  return (
    <article
      tabIndex={0}
      data-move={player.move}
      className={`player-card group card-lift animate-in relative min-w-0 overflow-hidden rounded-3xl border bg-gradient-to-br p-3 touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-hoop focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:p-4 ${accentRing[player.accent]}`}
      style={{ animationDelay: `${index * 0.045}s` }}
      aria-label={`${player.firstName}, rugnummer ${player.number}, ${player.label}`}
      onPointerDown={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap()
        }
      }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-hoop/10 blur-2xl transition duration-500 group-hover:bg-hoop/30 group-focus-within:bg-hoop/30 group-active:bg-hoop/30" />
      <div className="player-card-glow pointer-events-none absolute inset-x-4 bottom-16 h-16 rounded-full bg-hoop/0 blur-xl transition duration-500 group-hover:bg-hoop/20 group-focus-within:bg-hoop/20 group-active:bg-hoop/20" />

      <svg
        className="player-court-lines pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100"
        viewBox="0 0 200 240"
        aria-hidden
        preserveAspectRatio="none"
      >
        <ellipse
          cx="100"
          cy="168"
          rx="58"
          ry="14"
          fill="none"
          stroke="rgba(243,128,25,0.22)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path d="M42 168 H158" stroke="rgba(243,128,25,0.14)" strokeWidth="1" />
        <path d="M100 154 V182" stroke="rgba(243,128,25,0.12)" strokeWidth="1" />
      </svg>

      <div className="relative flex items-start justify-between gap-2">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink/50 text-lg transition duration-300 group-hover:scale-110 group-hover:border-hoop/40"
          aria-hidden
          title={player.emoji}
        >
          {player.emoji}
        </span>
        <span className="rounded-full bg-ink/70 px-3 py-1 font-display text-sm font-black text-hoop-bright shadow-inner transition duration-300 group-hover:bg-hoop/20">
          #{player.number}
        </span>
      </div>

      <div className="player-card-stage relative mx-auto mt-1 flex h-[152px] w-full max-w-[160px] items-end justify-center sm:h-[168px]">
        <PlayerFigure player={player} className="h-full w-full drop-shadow-lg" />
      </div>

      <div className="relative mt-1 text-center">
        <h2 className="truncate font-display text-xl font-bold tracking-tight text-cream">
          {player.firstName}
        </h2>
        <p className="mt-0.5 truncate text-sm font-medium text-muted">
          {player.moveLabel || player.label}
        </p>
      </div>
    </article>
  )
}
