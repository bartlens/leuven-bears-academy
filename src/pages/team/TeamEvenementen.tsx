import { useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { events as academyEvents } from '../../data/events'
import { brusselsTodayIso } from '../../lib/calendarEvents'
import { useTeamSheetData } from '../../sheet/TeamSheetProvider'

function formatEventDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function TeamEvenementen() {
  const { team } = useOutletContext<TeamOutletContext>()
  const { events, herfststage, aanwezigheidUrl } = useTeamSheetData()
  const todayIso = brusselsTodayIso()

  if (events.length > 0 || herfststage) {
    const upcoming = events.filter((e) => e.date >= todayIso)
    const past = events.filter((e) => e.date < todayIso)
    return (
      <div className="page-shell">
        <SectionHeader
          eyebrow="Off-court"
          title="Evenementen"
          subtitle="Tornooien en stages uit Beheer. Aanwezigheid via de team-spreadsheet."
        />

        {herfststage && (
          <article className="mb-10 rounded-3xl border border-warm/35 bg-gradient-to-br from-warm/15 via-panel to-ink-soft p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span className="text-4xl" aria-hidden>
                🏕️
              </span>
              {herfststage.formUrl && (
                <span className="rounded-full border border-warm/40 bg-warm/15 px-3 py-1 text-xs font-semibold text-warm">
                  Inschrijving open
                </span>
              )}
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-cream">
              {herfststage.title}
            </h2>
            {herfststage.tariff && (
              <p className="mt-2 text-sm font-medium text-warm">
                Tarief {herfststage.tariff}
              </p>
            )}
            {herfststage.iban && (
              <p className="mt-1 break-all text-sm font-medium text-warm">
                IBAN {herfststage.iban}
              </p>
            )}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {herfststage.formUrl
                ? 'Schrijf je in via het formulier. '
                : ''}
              {herfststage.mededeling ? (
                <>
                  Gebruik als mededeling:{' '}
                  <span className="break-words font-semibold text-cream">
                    {herfststage.mededeling}
                  </span>
                  .{' '}
                </>
              ) : null}
              {herfststage.notes.join(' ')}
            </p>
            {herfststage.formUrl && (
              <a
                href={herfststage.formUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-warm px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-110"
              >
                Inschrijfformulier →
              </a>
            )}
          </article>
        )}

        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-cream">
              Tornooien ({upcoming.length} aankomend)
            </h2>
            {aanwezigheidUrl && (
              <a
                href={aanwezigheidUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-hoop-bright hover:underline"
              >
                Aanwezigheid spreadsheet →
              </a>
            )}
          </div>
          {upcoming.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-ink-soft px-5 py-6 text-sm text-muted">
              Geen aankomende tornooien in Beheer.
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((e, i) => (
                <article
                  key={e.id}
                  className="card-lift animate-in rounded-2xl border border-white/10 bg-panel p-5"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="text-2xl" aria-hidden>
                      {e.emoji}
                    </span>
                    {e.rsvpOpen && (
                      <span className="rounded-full bg-hoop/15 px-3 py-1 text-xs font-semibold text-hoop-bright">
                        Check spreadsheet
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-cream">
                    {e.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {formatEventDate(e.date)}
                    {e.time ? ` · ${e.time}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-cream/85">{e.place}</p>
                  {e.description && (
                    <p className="mt-2 text-xs text-muted">{e.description}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl font-bold text-cream">
              Voorbij ({past.length})
            </h2>
            <div className="space-y-2 opacity-80">
              {past.map((e) => (
                <article
                  key={e.id}
                  className="rounded-2xl border border-white/8 bg-ink-soft px-5 py-4"
                >
                  <h3 className="font-display font-bold text-cream">{e.title}</h3>
                  <p className="text-sm text-muted">
                    {formatEventDate(e.date)}
                    {e.time ? ` · ${e.time}` : ''} · {e.place}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // Generic academy fallback for teams without Beheer events
  const needle = team.name.toLowerCase()
  const teamHits = academyEvents.filter(
    (e) =>
      e.title.toLowerCase().includes(needle) ||
      e.description.toLowerCase().includes(needle) ||
      e.description.toLowerCase().includes(team.slug),
  )
  const list = teamHits.length > 0 ? teamHits : academyEvents

  return (
    <div className="page-shell">
      <SectionHeader
        eyebrow="Club"
        title="Evenementen"
        subtitle="Academy-brede evenementen (gedeeld voor alle ploegen)."
      />
      <div className="space-y-3">
        {list.map((e, i) => (
          <article
            key={e.id}
            className="card-lift animate-in rounded-2xl border border-white/10 bg-panel p-5"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <h3 className="font-display text-lg font-bold text-cream">{e.title}</h3>
            <p className="text-sm text-muted">{e.dateLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{e.description}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
