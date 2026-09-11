import type { MatchResultLetter } from '../lib/matchResult'

type FormDotsProps = {
  results: MatchResultLetter[]
  /** Show W / V / G legend next to the strip (default true). */
  showLegend?: boolean
}

const dotStyles: Record<MatchResultLetter, string> = {
  W: 'bg-hoop shadow-[0_0_8px_rgba(243,128,25,0.45)]',
  L: 'bg-muted/50 border border-white/15',
  D: 'bg-warm/80',
}

const labels: Record<MatchResultLetter, string> = {
  W: 'Winst',
  L: 'Verlies',
  D: 'Gelijk',
}

export function FormDots({ results, showLegend = true }: FormDotsProps) {
  if (results.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="flex items-center gap-1.5"
        role="list"
        aria-label="Recente vorm"
      >
        {results.map((r, i) => (
          <span
            key={`${r}-${i}`}
            role="listitem"
            title={labels[r]}
            aria-label={labels[r]}
            className={`inline-block h-3 w-3 rounded-full ${dotStyles[r]}`}
          />
        ))}
      </div>
      {showLegend && (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span className="text-hoop-bright">W</span>
          {' / '}
          <span className="text-muted">V</span>
          {' / '}
          <span className="text-warm">G</span>
        </p>
      )}
    </div>
  )
}
