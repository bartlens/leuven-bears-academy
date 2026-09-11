import type { StaffMember } from '../sheet/beheerTypes'
import { playStaffClickSound } from '../audio/playerClickSound'
import { StaffFigure } from './StaffFigure'

type StaffCardProps = {
  staff: StaffMember
  index?: number
  /** Compact = Spelers staff strip; default suits Info top cards too */
  compact?: boolean
}

const outfitRing: Record<StaffMember['outfit'], string> = {
  coach: 'from-hoop/30 via-panel/80 to-ink-soft border-hoop/40',
  volunteer: 'from-warm/25 via-panel/80 to-ink-soft border-warm/35',
}

const roleColor: Record<StaffMember['outfit'], string> = {
  coach: 'text-hoop-bright',
  volunteer: 'text-warm',
}

export function StaffCard({ staff, index = 0, compact = false }: StaffCardProps) {
  const ariaNote = staff.note ? `, ${staff.note}` : ''
  const onTap = () => {
    playStaffClickSound(staff)
  }

  return (
    <article
      tabIndex={0}
      data-move={staff.move}
      className={`staff-card player-card group card-lift animate-in relative min-w-0 overflow-hidden rounded-3xl border bg-gradient-to-br touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-hoop focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${outfitRing[staff.outfit]} ${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      aria-label={`${staff.name}, ${staff.role}${ariaNote}`}
      onPointerDown={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap()
        }
      }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-hoop/10 blur-2xl transition duration-500 group-hover:bg-hoop/25 group-focus-within:bg-hoop/25 group-active:bg-hoop/25" />

      <div className="relative flex items-start justify-between gap-2">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink/50 text-lg transition duration-300 group-hover:scale-110 group-hover:border-hoop/40"
          aria-hidden
        >
          {staff.emoji}
        </span>
        <span
          className={`max-w-[60%] truncate rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${roleColor[staff.outfit]}`}
        >
          {staff.role}
        </span>
      </div>

      <div
        className={`player-card-stage relative mx-auto flex w-full items-end justify-center ${compact ? 'mt-1 h-[132px] max-w-[140px] sm:h-[148px]' : 'mt-2 h-[144px] max-w-[150px] sm:h-[160px]'}`}
      >
        <StaffFigure staff={staff} className="h-full w-full drop-shadow-lg" />
      </div>

      <div className="relative mt-1 text-center">
        <h2 className={`truncate font-display font-bold tracking-tight text-cream ${compact ? 'text-lg' : 'text-xl'}`}>
          {staff.name}
        </h2>
        {staff.note ? (
          <p className="mt-0.5 truncate text-sm font-medium text-muted">{staff.note}</p>
        ) : (
          <p className="mt-0.5 truncate text-sm font-medium text-muted">{staff.role}</p>
        )}

      </div>
    </article>
  )
}
