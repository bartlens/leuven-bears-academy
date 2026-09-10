import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { getMatchesForTeam } from '../../data/teamMatches'
import { club } from '../../data/club'
import {
  brusselsTodayIso,
  buildTeamCalendarEvents,
  monthGrid,
  monthLabel,
  type CalEvent,
} from '../../lib/calendarEvents'

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

function dayNum(iso: string) {
  return Number(iso.slice(8, 10))
}

function formatDayHeading(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function TeamKalender() {
  const { team } = useOutletContext<TeamOutletContext>()
  const matches = getMatchesForTeam(team.slug)
  const trainings = team.trainings ?? []
  const todayIso = brusselsTodayIso()
  const [y, m] = todayIso.split('-').map(Number)
  const [cursor, setCursor] = useState({ year: y!, month: m! - 1 })
  const [selected, setSelected] = useState<string | null>(todayIso)
  const base = `/team/${team.slug}`

  const events = useMemo(
    () => buildTeamCalendarEvents(matches, trainings),
    [matches, trainings],
  )

  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>()
    for (const e of events) {
      const list = map.get(e.dateIso) ?? []
      list.push(e)
      map.set(e.dateIso, list)
    }
    return map
  }, [events])

  const cells = useMemo(
    () => monthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )

  const selectedEvents = selected ? (byDate.get(selected) ?? []) : []

  const monthEvents = useMemo(() => {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`
    return events.filter((e) => e.dateIso.startsWith(prefix))
  }, [events, cursor.year, cursor.month])

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(Date.UTC(c.year, c.month + delta, 1))
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
    })
  }

  const goToday = () => {
    setCursor({ year: y!, month: m! - 1 })
    setSelected(todayIso)
  }

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow="Overzicht"
        title="Kalender"
        subtitle={`Matchen${trainings.length ? ' en trainingen' : ''} van ${team.name} · seizoen ${club.season}.`}
      />

      {events.length === 0 && (
        <p className="mb-6 rounded-2xl border border-dashed border-white/15 bg-ink-soft px-5 py-6 text-sm text-muted">
          Nog geen wedstrijden of trainingsdata voor deze ploeg. Check later opnieuw of kijk bij{' '}
          <Link to={`${base}/matchen`} className="font-semibold text-hoop-bright hover:underline">
            Matchen
          </Link>
          .
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-panel text-cream touch-manipulation hover:bg-white/5"
            aria-label="Vorige maand"
          >
            ‹
          </button>
          <h2 className="min-w-[10rem] text-center font-display text-xl font-bold capitalize text-cream sm:min-w-[12rem] sm:text-2xl">
            {monthLabel(cursor.year, cursor.month)}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-panel text-cream touch-manipulation hover:bg-white/5"
            aria-label="Volgende maand"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="rounded-full border border-hoop/40 bg-hoop/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-hoop-bright touch-manipulation hover:bg-hoop/25"
        >
          Vandaag
        </button>
        <div className="ml-auto flex flex-wrap gap-3 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warm" aria-hidden />
            Training
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-hoop" aria-hidden />
            Match
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-soft">
        <div className="grid grid-cols-7 border-b border-white/8 bg-ink/60">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted sm:text-xs"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((iso, idx) => {
            if (!iso) {
              return (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[4.25rem] border-b border-r border-white/5 bg-ink/20 sm:min-h-[5.5rem]"
                />
              )
            }
            const dayEvents = byDate.get(iso) ?? []
            const isToday = iso === todayIso
            const isSelected = iso === selected
            const hasTraining = dayEvents.some((e) => e.kind === 'training')
            const hasMatch = dayEvents.some((e) => e.kind === 'match')

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={`relative flex min-h-[4.25rem] flex-col items-stretch gap-1 border-b border-r border-white/5 px-1 py-1.5 text-left touch-manipulation transition sm:min-h-[5.5rem] sm:px-1.5 sm:py-2 ${
                  isSelected
                    ? 'bg-hoop/20 ring-1 ring-inset ring-hoop/50'
                    : 'hover:bg-white/5'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold sm:h-7 sm:w-7 sm:text-sm ${
                    isToday ? 'bg-hoop text-white' : 'text-cream/90'
                  }`}
                >
                  {dayNum(iso)}
                </span>
                <div className="mt-auto flex flex-wrap gap-0.5">
                  {hasTraining && (
                    <span className="h-1.5 w-1.5 rounded-full bg-warm sm:h-2 sm:w-2" />
                  )}
                  {hasMatch && (
                    <span className="h-1.5 w-1.5 rounded-full bg-hoop sm:h-2 sm:w-2" />
                  )}
                </div>
                <div className="hidden space-y-0.5 sm:block">
                  {dayEvents.slice(0, 2).map((e) => (
                    <p
                      key={e.id}
                      className={`truncate text-[10px] font-semibold leading-tight ${
                        e.kind === 'match' ? 'text-hoop-bright' : 'text-warm'
                      }`}
                    >
                      {e.kind === 'match' ? '🏀' : '⏱️'} {e.time.slice(0, 5)}
                    </p>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-muted">+{dayEvents.length - 2}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-ink-soft p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold capitalize text-cream">
          {selected ? formatDayHeading(selected) : 'Kies een dag'}
        </h3>
        {selectedEvents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Geen training of match op deze dag.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {selectedEvents.map((e) => (
              <li
                key={e.id}
                className={`rounded-2xl border px-4 py-3 ${
                  e.kind === 'match'
                    ? 'border-hoop/35 bg-hoop/10'
                    : 'border-warm/30 bg-warm/10'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-base font-bold text-cream">{e.title}</p>
                  <p
                    className={`text-sm font-bold ${
                      e.kind === 'match' ? 'text-hoop-bright' : 'text-warm'
                    }`}
                  >
                    {e.time}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">{e.location}</p>
                {e.meta && <p className="mt-1 text-sm text-cream/80">{e.meta}</p>}
                <p className="mt-2">
                  <Link
                    to={e.kind === 'match' ? `${base}/matchen` : `${base}/trainingen`}
                    className="text-xs font-bold uppercase tracking-wider text-hoop-bright hover:underline"
                  >
                    Meer op {e.kind === 'match' ? 'Matchen' : 'Trainingen'} →
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h3 className="font-display text-lg font-bold text-cream">
          Deze maand · {monthEvents.length} items
        </h3>
        {monthEvents.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Niets gepland in deze maand.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {monthEvents.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelected(e.dateIso)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-white/8 bg-panel/60 px-4 py-3 text-left touch-manipulation transition hover:bg-white/5"
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      e.kind === 'match' ? 'bg-hoop' : 'bg-warm'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                      {formatDayHeading(e.dateIso)} · {e.time}
                    </span>
                    <span className="mt-0.5 block font-semibold text-cream">{e.title}</span>
                    <span className="block truncate text-sm text-muted">{e.location}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
