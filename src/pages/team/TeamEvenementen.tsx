import { Link, useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { events } from '../../data/events'

const kindLabel: Record<string, string> = {
  season: 'Seizoen',
  tournament: 'Toernooi',
  fundraiser: 'Fundraiser',
  fan: 'Fans',
  match: 'Match',
}

export function TeamEvenementen() {
  const { team } = useOutletContext<TeamOutletContext>()
  const needle = team.name.toLowerCase()
  const teamHits = events.filter(
    (e) =>
      e.title.toLowerCase().includes(needle) ||
      e.description.toLowerCase().includes(needle) ||
      e.description.toLowerCase().includes(team.slug),
  )
  const list = teamHits.length > 0 ? teamHits : events

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow="Club"
        title="Evenementen"
        subtitle={
          teamHits.length > 0
            ? `Evenementen die ${team.name} vermelden.`
            : 'Academy-brede evenementen (gedeeld voor alle ploegen).'
        }
      />

      {teamHits.length === 0 && (
        <p className="mb-6 rounded-2xl border border-white/10 bg-ink-soft px-4 py-3 text-sm text-muted">
          Geen ploeg-specifieke events gevonden — hieronder de clubkalender die voor de hele
          Academy geldt.{' '}
          <Link to="/events" className="font-semibold text-hoop-bright hover:underline">
            Alle events →
          </Link>
        </p>
      )}

      <div className="space-y-3">
        {list.map((e, i) => (
          <article
            key={e.id}
            className="card-lift animate-in rounded-2xl border border-white/10 bg-panel p-5"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-hoop/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-hoop-bright">
                {kindLabel[e.kind] ?? e.kind}
              </span>
              <span className="text-sm text-muted">{e.dateLabel}</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-cream">{e.title}</h3>
            {e.location && <p className="text-sm text-muted">{e.location}</p>}
            <p className="mt-2 text-sm leading-relaxed text-muted">{e.description}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
