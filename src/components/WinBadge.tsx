type WinBadgeProps = {
  result: 'W' | 'L' | 'D'
}

const styles = {
  W: 'bg-hoop text-white',
  L: 'bg-panel text-muted border border-white/10',
  D: 'bg-bear/60 text-warm border border-bear',
} as const

const labels = {
  W: 'Winst',
  L: 'Verlies',
  D: 'Gelijk',
} as const

export function WinBadge({ result }: WinBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles[result]}`}
    >
      {labels[result]}
    </span>
  )
}
