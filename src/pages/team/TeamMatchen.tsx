import { useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { WinBadge } from '../../components/WinBadge'
import { FormDots } from '../../components/FormDots'
import { club } from '../../data/club'
import { hasVblTeam } from '../../data/vblTeams'
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

export function TeamMatchen() {
  const { team } = useOutletContext<TeamOutletContext>()
  const {
    matches: sheetMatches,
    source,
    loading,
    vblMatchCount,
    sheetExtraCount,
  } = useTeamSheetData()
  const today = brusselsTodayIso()
  const matches = [...sheetMatches].sort(
    (a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time),
  )
  const upcoming = matches.filter(
    (m) => m.dateIso >= today && m.status !== 'played',
  )
  // Chronological (oldest → newest) for form strip; display newest-first
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

  const subtitle = usesVbl
    ? `Officiële wedstrijden via Basketbal Vlaanderen${
        sheetExtraCount > 0 ? ` · +${sheetExtraCount} extras uit Beheer` : ''
      } · seizoen ${club.season}.`
    : source === 'live'
      ? `Opkomende wedstrijden voor ${team.name} · seizoen ${club.season} · live uit Beheer.`
      : `Opkomende wedstrijden voor ${team.name} · seizoen ${club.season}.`

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-10 sm:px-6">
      <SectionHeader eyebrow="Game day" title="Matchen" subtitle={subtitle} />

      {loading && (
        <p className="mb-4 text-sm text-muted">
          {usesVbl ? 'Matchen laden (VBL + Beheer extras)…' : 'Matchen laden uit Beheer…'}
        </p>
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

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold text-cream">
            Gespeeld / eerdere data ({past.length})
          </h2>

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
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-ink-soft p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {resolved && <WinBadge result={resolved.result} />}
                      <span className="text-sm text-muted">
                        {formatDate(m.dateIso)} · {m.time} ·{' '}
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
                    {m.competition && (
                      <p className="mt-1 text-xs font-semibold text-warm">
                        {m.competition}
                      </p>
                    )}
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
        </section>
      )}
    </div>
  )
}
