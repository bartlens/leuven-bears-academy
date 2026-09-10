import { Link, useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { club } from '../../data/club'
import { getNextMatch } from '../../data/teamMatches'

const sections = [
  { path: 'spelers', label: 'Spelers', emoji: '👥', desc: 'Selectie & nummers' },
  { path: 'trainingen', label: 'Trainingen', emoji: '⏱️', desc: 'Trainingsinfo' },
  { path: 'matchen', label: 'Matchen', emoji: '🏀', desc: 'Opkomende wedstrijden' },
  { path: 'kalender', label: 'Kalender', emoji: '📅', desc: 'Maandoverzicht' },
  { path: 'evenementen', label: 'Evenementen', emoji: '🎉', desc: 'Clubactiviteiten' },
  { path: 'info', label: 'Info', emoji: 'ℹ️', desc: 'Contact & nuttige links' },
]

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function TeamHome() {
  const { team } = useOutletContext<TeamOutletContext>()
  const next = getNextMatch(team.slug)
  const base = `/team/${team.slug}`

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-10 sm:px-6">
      <section className="mb-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Over {team.name}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {team.note ??
              `${team.name} maakt deel uit van de Leuven Bears Academy (${club.season}). Hier vind je wedstrijden, trainingsinfo en clubnieuws voor deze ploeg.`}
          </p>
        </article>

        <article className="rounded-3xl border border-hoop/30 bg-hoop/10 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Volgende match
          </p>
          {next ? (
            <>
              <p className="mt-2 font-display text-xl font-bold text-cream">
                vs {next.opponent}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatDate(next.dateIso)} · {next.time}
              </p>
              <p className="mt-1 text-sm text-cream/90">
                <span
                  className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                    next.venue === 'thuis'
                      ? 'bg-hoop/25 text-hoop-bright'
                      : 'bg-bear/60 text-warm'
                  }`}
                >
                  {next.venue === 'thuis' ? 'Thuis' : next.venue === 'uit' ? 'Uit' : '?'}
                </span>
                {next.location}
              </p>
              <Link
                to={`${base}/matchen`}
                className="mt-4 inline-flex text-sm font-bold text-hoop-bright hover:underline"
              >
                Alle matchen →
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Geen opkomende wedstrijden bekend op de oude Academy-site.
            </p>
          )}
        </article>
      </section>

      <h2 className="mb-4 font-display text-xl font-bold text-cream">Secties</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s, i) => (
          <Link
            key={s.path}
            to={`${base}/${s.path}`}
            className="card-lift animate-in rounded-2xl border border-white/10 bg-panel p-5"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <span className="text-2xl" aria-hidden>
              {s.emoji}
            </span>
            <p className="mt-2 font-display text-lg font-bold text-cream">{s.label}</p>
            <p className="text-sm text-muted">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
