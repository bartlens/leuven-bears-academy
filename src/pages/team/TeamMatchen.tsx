import { useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { WinBadge } from '../../components/WinBadge'
import { FormDots } from '../../components/FormDots'
import { club } from '../../data/club'
import { hasVblTeam, getVblTeam, encodeVblTeamGuid } from '../../data/vblTeams'
import { brusselsTodayIso } from '../../lib/calendarEvents'
import {
  resolveMatchResult,
  type MatchResultLetter,
} from '../../lib/matchResult'
import { useTeamSheetData } from '../../sheet/TeamSheetProvider'

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('nl-BE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const scoreBoxByResult: Record<MatchResultLetter, string> = {
  W: 'border-hoop/40 bg-hoop/15',
  L: 'border-white/10 bg-panel',
  D: 'border-warm/30 bg-bear/40',
}

function vblCalendarUrl(slug: string, fromPloeg?: string): string | null {
  if (fromPloeg) return fromPloeg
  const vbl = getVblTeam(slug)
  if (!vbl) return null
  const guid = encodeVblTeamGuid(vbl.teamGuid).replace(/\+\+/g, '')
  // U10 C standalone used BVBL1125G10003 (spaces collapsed)
  const compact = vbl.teamGuid.replace(/ +/g, '')
  return `https://vblcal.wisseq.eu/vblcalsync/calsync.aspx?guid=${compact || guid}`
}

export function TeamMatchen() {
  const { team } = useOutletContext<TeamOutletContext>()
  const {
    matches: sheetMatches,
    source,
    loading,
    vblMatchCount,
    sheetExtraCount,
    aanwezigheidUrl,
    afspraken,
    ploeg,
  } = useTeamSheetData()
  const today = brusselsTodayIso()
  const matches = [...sheetMatches].sort(
    (a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time),
  )
  const upcoming = matches.filter(
    (m) => m.dateIso >= today && m.status !== 'played',
  )
  const pastChrono = matches.filter(
    (m) => m.dateIso < today || m.status === 'played',
  )
  const past = [...pastChrono].reverse()

  const formResults: MatchResultLetter[] = []
  for (const m of pastChrono) {
    const resolved = resolveMatchResult(m)
    if (resolved) formResults.push(resolved.result)
  }
  const lastForm = formResults.slice(-5)
  const formWins = lastForm.filter((r) => r === 'W').length
  const formLosses = lastForm.filter((r) => r === 'L').length
  const formDraws = lastForm.filter((r) => r === 'D').length

  const usesVbl = hasVblTeam(team.slug)
  const season = ploeg.season ?? club.season
  const vblUrl = vblCalendarUrl(team.slug, ploeg.vblCalendarUrl)
  const hasAfspraken =
    afspraken.bullets.length > 0 || afspraken.draaischema.bullets.length > 0

  const subtitle = usesVbl
    ? `Seizoen ${season}. Kom juichen — scores updaten we na elke speeldag.`
    : source === 'live'
      ? `Opkomende wedstrijden voor ${team.name} · seizoen ${season} · live uit Beheer.`
      : `Opkomende wedstrijden voor ${team.name} · seizoen ${season}.`

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-12 sm:px-6">
      <SectionHeader eyebrow="Game day" title="Matchen" subtitle={subtitle} />

      {loading && (
        <p className="mb-4 text-sm text-muted">
          {usesVbl ? 'Matchen laden (VBL + Beheer extras)…' : 'Matchen laden uit Beheer…'}
        </p>
      )}

      {(aanwezigheidUrl || vblUrl) && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {aanwezigheidUrl && (
            <a
              href={aanwezigheidUrl}
              target="_blank"
              rel="noreferrer"
              className="card-lift rounded-2xl border border-hoop/35 bg-hoop/10 px-5 py-4 transition hover:bg-hoop/20"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-hoop-bright">
                Aanwezigheid
              </p>
              <p className="mt-1 font-display text-lg font-bold text-cream">
                Spreadsheet openen →
              </p>
              <p className="mt-1 text-sm text-muted">
                Duid aan- of afwezigheid aan per wedstrijd en training.
              </p>
            </a>
          )}
          {vblUrl && (
            <a
              href={vblUrl}
              target="_blank"
              rel="noreferrer"
              className="card-lift rounded-2xl border border-warm/30 bg-warm/10 px-5 py-4 transition hover:bg-warm/20"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-warm">
                VBL
              </p>
              <p className="mt-1 font-display text-lg font-bold text-cream">
                Kalender synchroniseren (VBL) →
              </p>
              <p className="mt-1 text-sm text-muted">
                Importeer de officiële wedstrijdkalender in je eigen agenda.
              </p>
            </a>
          )}
        </div>
      )}

      {hasAfspraken && (
        <section className="mb-10 rounded-3xl border border-white/10 bg-ink-soft p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-cream">
            {afspraken.title}
          </h2>
          <ul className="mt-4 space-y-2">
            {afspraken.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm leading-relaxed text-cream/90">
                <span className="shrink-0 text-hoop-bright" aria-hidden>
                  ●
                </span>
                {b}
              </li>
            ))}
          </ul>
          {afspraken.draaischema.bullets.length > 0 && (
            <>
              <h3 className="mt-6 font-display text-lg font-bold text-warm">
                {afspraken.draaischema.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {afspraken.draaischema.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-3 text-sm leading-relaxed text-cream/90"
                  >
                    <span className="shrink-0 text-warm" aria-hidden>
                      →
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </>
          )}
          {aanwezigheidUrl && (
            <a
              href={aanwezigheidUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex text-sm font-bold text-hoop-bright hover:underline"
            >
              Aanwezigheid & afspraken in de spreadsheet →
            </a>
          )}
        </section>
      )}

      {usesVbl && !loading && (
        <p className="mb-6 text-xs text-muted">
          {vblMatchCount} officiële VBL-wedstrijden
          {sheetExtraCount > 0
            ? ` · ${sheetExtraCount} sheet-extra${sheetExtraCount === 1 ? '' : 's'}`
            : ' · Beheer Matchen = alleen oefenwedstrijden / extras'}
        </p>
      )}

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-bold text-cream">
          Aankomend ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-ink-soft px-5 py-8 text-sm text-muted">
            Geen opkomende wedstrijden voor deze ploeg.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((m, i) => (
              <article
                key={m.id}
                className="card-lift animate-in flex flex-col gap-4 rounded-2xl border border-white/10 bg-panel p-5 sm:flex-row sm:items-center sm:justify-between"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        m.venue === 'thuis'
                          ? 'bg-hoop/20 text-hoop-bright'
                          : m.venue === 'uit'
                            ? 'bg-bear/50 text-warm'
                            : 'bg-white/10 text-muted'
                      }`}
                    >
                      {m.venue === 'thuis' ? 'Thuis' : m.venue === 'uit' ? 'Uit' : '?'}
                    </span>
                    {m.source === 'sheet' && (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                        Extra
                      </span>
                    )}
                    <span className="text-sm text-muted">
                      {formatDate(m.dateIso)} · {m.time}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-cream">
                    vs {m.opponent}
                  </h3>
                  <p className="text-sm text-muted">{m.location}</p>
                  {m.address && (
                    <p className="text-xs text-muted/80">{m.address}</p>
                  )}
                  {m.competition && (
                    <p className="mt-1 text-xs font-semibold text-warm">{m.competition}</p>
                  )}
                </div>
                <span className="self-start rounded-xl border border-dashed border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:self-center">
                  Nog te spelen
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-cream">
          Gespeeld{past.length ? ` (${past.length})` : ''}
        </h2>

        {past.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-ink-soft px-5 py-8 text-sm text-muted">
            Nog geen gespeelde matchen in deze kalender.
          </p>
        ) : (
          <>
            {lastForm.length > 0 && (
              <div className="mb-4 rounded-2xl border border-white/10 bg-panel p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-hoop-bright">
                      Vorm (laatste {lastForm.length})
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {[
                        formWins > 0 ? `${formWins}W` : null,
                        formDraws > 0 ? `${formDraws}G` : null,
                        formLosses > 0 ? `${formLosses}V` : null,
                      ]
                        .filter(Boolean)
                        .join(' – ') || '—'}
                    </p>
                  </div>
                  <FormDots results={lastForm} />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {past.map((m) => {
                const resolved = resolveMatchResult(m)
                return (
                  <article
                    key={m.id}
                    className="card-lift flex flex-col gap-3 rounded-2xl border border-white/10 bg-ink-soft p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {resolved && <WinBadge result={resolved.result} />}
                        <span className="text-sm text-muted">
                          {formatDate(m.dateIso)} ·{' '}
                          {m.venue === 'thuis'
                            ? 'Thuis'
                            : m.venue === 'uit'
                              ? 'Uit'
                              : '?'}
                          {m.source === 'sheet' ? ' · Extra' : ''}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-bold text-cream">
                        vs {m.opponent}
                      </h3>
                      <p className="text-sm text-muted">{m.location}</p>
                    </div>
                    {resolved ? (
                      <div
                        className={`flex items-baseline gap-2 self-start rounded-xl border px-4 py-2 font-display sm:self-center ${scoreBoxByResult[resolved.result]}`}
                      >
                        <span className="text-2xl font-black text-cream sm:text-3xl">
                          {resolved.us}
                        </span>
                        <span className="text-muted">–</span>
                        <span className="text-2xl font-black text-muted sm:text-3xl">
                          {resolved.them}
                        </span>
                      </div>
                    ) : m.score ? (
                      <span className="self-start rounded-xl border border-white/15 bg-panel px-4 py-2 font-display text-lg font-bold text-muted sm:self-center">
                        {m.score}
                      </span>
                    ) : (
                      <span className="self-start rounded-xl border border-dashed border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:self-center">
                        Geen score
                      </span>
                    )}
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
