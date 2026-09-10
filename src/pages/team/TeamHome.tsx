import { Link, useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { Logo } from '../../components/Logo'
import { HeroTitlePeek } from '../../components/HeroTitlePeek'
import { club } from '../../data/club'
import { useTeamSheetData } from '../../sheet/TeamSheetProvider'

const quickLinks = [
  { path: 'spelers', label: 'Spelers', emoji: '👕', desc: 'Selectie & nummers' },
  { path: 'trainingen', label: 'Trainingen', emoji: '⏱️', desc: 'Trainingsinfo' },
  { path: 'kalender', label: 'Kalender', emoji: '📅', desc: 'Maandoverzicht' },
  { path: 'matchen', label: 'Matchen', emoji: '🏀', desc: 'Uitslagen & agenda' },
  { path: 'evenementen', label: 'Evenementen', emoji: '🎉', desc: 'Extra fun' },
]

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function venueLabel(venue: 'thuis' | 'uit' | 'unknown') {
  if (venue === 'thuis') return 'Thuis'
  if (venue === 'uit') return 'Uit'
  return '?'
}

export function TeamHome() {
  const { team } = useOutletContext<TeamOutletContext>()
  const { players, nextMatch: next } = useTeamSheetData()
  const base = `/team/${team.slug}`
  const fullName = `Leuven Bears ${team.name}`
  const tagline =
    team.note ??
    `#WEBEARS · Deel van de Leuven Bears Academy · Seizoen ${club.season}`

  const highlight = next
    ? {
        title: 'Volgende match',
        when: `${formatDate(next.dateIso)} · ${next.time} · ${venueLabel(next.venue)}`,
        where: `vs ${next.opponent}`,
      }
    : {
        title: 'Seizoen',
        when: club.season,
        where: team.trainingNote ?? 'Wedstrijdkalender vindt bij Matchen',
      }

  return (
    <div className="overflow-x-hidden">
      <section className="relative overflow-x-hidden grain mesh-grid">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div className="min-w-0 animate-in">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-hoop/40 bg-hoop/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-hoop-bright">
              Seizoen {club.season}
            </span>
            <HeroTitlePeek
              key={team.slug}
              name={team.name}
              category={team.category}
              players={players}
              autoWelcome
            />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {team.note ??
                `Jeugdbasket van de Leuven Bears Academy: dribbels, dunk-dromen en high-fives voor ${team.name}. #WEBEARS`}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={`${base}/matchen`}
                className="animate-glow inline-flex min-h-11 items-center justify-center rounded-full bg-hoop px-6 py-3 text-sm font-bold text-white transition hover:bg-hoop-bright active:bg-hoop-bright"
              >
                Matchkalender
              </Link>
              <Link
                to={`${base}/info`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-cream transition hover:border-hoop/40 hover:bg-hoop/10 active:bg-hoop/10"
              >
                Info & contact
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center animate-in" style={{ animationDelay: '0.12s' }}>
            <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-panel/80 p-6 shadow-2xl shadow-hoop/20 backdrop-blur sm:p-8">
              <Logo size={120} className="mx-auto animate-float" />
              <p className="mt-4 text-center font-display text-xl font-bold text-cream">
                {fullName}
              </p>
              <p className="mt-1 text-center text-sm text-muted">{tagline}</p>
              <div className="mt-6 rounded-2xl border border-hoop/25 bg-hoop/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-hoop-bright">
                  {highlight.title}
                </p>
                <p className="mt-1 font-semibold text-cream">{highlight.when}</p>
                <p className="text-sm text-muted">{highlight.where}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {next && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="card-lift overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-panel to-ink-soft">
            <div className="flex h-full flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
                  Volgende match
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-cream break-words sm:text-3xl">
                  vs {next.opponent}
                </h2>
                <p className="mt-2 text-muted">
                  {formatDate(next.dateIso)} · {next.time} ·{' '}
                  <span className="font-semibold text-warm">{venueLabel(next.venue)}</span>
                </p>
                <p className="mt-1 text-sm text-muted break-words">{next.location}</p>
              </div>
              <Link
                to={`${base}/matchen`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-hoop px-5 py-3 text-sm font-bold text-white transition hover:bg-hoop-bright active:bg-hoop-bright"
              >
                Alle matchen →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="mb-6 font-display text-xl font-bold text-cream">Snel naar…</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickLinks.map((item, i) => (
            <Link
              key={item.path}
              to={`${base}/${item.path}`}
              className="card-lift group animate-in rounded-2xl border border-white/10 bg-panel p-5"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <span className="inline-block text-2xl transition-transform group-hover:scale-125 group-active:scale-125 group-focus-within:scale-125">
                {item.emoji}
              </span>
              <p className="mt-3 font-display text-lg font-bold text-cream">{item.label}</p>
              <p className="text-sm text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="rounded-full bg-white/5 px-3 py-1">Seizoen {club.season}</span>
          <span className="rounded-full bg-white/5 px-3 py-1">{team.category}</span>
          <span className="rounded-full bg-white/5 px-3 py-1">#WEBEARS</span>
          <Link
            to="/teams"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-hoop-bright transition hover:border-hoop/40"
          >
            Deel van Leuven Bears Academy →
          </Link>
        </div>
      </section>
    </div>
  )
}
