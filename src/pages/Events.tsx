import { SectionHeader } from '../components/SectionHeader'
import { events } from '../data/events'

const kindLabel: Record<string, string> = {
  match: 'Wedstrijd',
  tournament: 'Toernooi',
  fundraiser: 'Actie',
  fan: 'Fans',
  season: 'Seizoen',
}

export function Events() {
  const sorted = [...events].sort((a, b) =>
    (b.start ?? '').localeCompare(a.start ?? ''),
  )

  return (
    <div className="page-shell">
      <SectionHeader
        eyebrow="Kalender"
        title="Events"
        subtitle="Clubacties, toernooien en thuiswedstrijden. Data volgens de Academy-aankondigingen 2026."
      />
      <ul className="space-y-4">
        {sorted.map((ev) => (
          <li
            key={ev.id}
            className="card-lift rounded-3xl border border-white/10 bg-panel/80 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-hoop/40 bg-hoop/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-hoop-bright">
                {kindLabel[ev.kind] ?? ev.kind}
              </span>
              <span className="text-sm text-muted">{ev.dateLabel}</span>
            </div>
            <h2 className="mt-3 font-display text-xl font-bold text-cream sm:text-2xl">
              {ev.title}
            </h2>
            {ev.location && (
              <p className="mt-1 text-sm font-semibold text-warm">{ev.location}</p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {ev.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
