import type { TeamMatch } from '../data/teamMatches'
import type { TeamTraining } from '../data/teams'
import type { DatedTraining } from '../sheet/beheerTypes'

export type CalKind = 'training' | 'match'

export type CalEvent = {
  id: string
  kind: CalKind
  dateIso: string
  time: string
  title: string
  location: string
  meta?: string
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function brusselsTodayIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(Date.UTC(year, monthIndex, 15)).toLocaleDateString('nl-BE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Monday-first grid cells for a month (null = empty pad). */
export function monthGrid(year: number, monthIndex: number): (string | null)[] {
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const sun = first.getUTCDay()
  const monFirstOffset = (sun + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < monFirstOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${pad2(monthIndex + 1)}-${pad2(d)}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const DAY_TO_WD: Record<string, number> = {
  zondag: 0,
  maandag: 1,
  dinsdag: 2,
  woensdag: 3,
  donderdag: 4,
  vrijdag: 5,
  zaterdag: 6,
}

function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * Expand real weekly training slots onto concrete dates between fromIso..untilIso.
 * Only used when trainings have a known day (+ optional time) — never invents schedules.
 */
export function expandWeeklyTrainings(
  trainings: TeamTraining[],
  fromIso: string,
  untilIso: string,
): CalEvent[] {
  const slots = trainings
    .map((t, i) => {
      const key = (t.day || '').toLowerCase().trim()
      const wd = DAY_TO_WD[key]
      if (wd === undefined) return null
      return {
        index: i,
        wd,
        time: t.time ?? '',
        location: t.location ?? '',
        day: t.day,
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)

  if (slots.length === 0) return []

  const events: CalEvent[] = []
  let cursor = fromIso
  let n = 0
  while (cursor <= untilIso) {
    const wd = new Date(`${cursor}T12:00:00`).getDay()
    for (const slot of slots) {
      if (slot.wd !== wd) continue
      events.push({
        id: `tr-${slot.index}-${cursor}-${++n}`,
        kind: 'training',
        dateIso: cursor,
        time: slot.time || '—',
        title: `Training · ${slot.day}`,
        location: slot.location,
        meta: 'Wekelijks trainingsmoment',
      })
    }
    cursor = addDaysIso(cursor, 1)
  }
  return events
}

export function buildTeamCalendarEvents(
  matches: TeamMatch[],
  trainings: TeamTraining[] = [],
): CalEvent[] {
  const matchEvents: CalEvent[] = matches.map((m) => ({
    id: m.id,
    kind: 'match' as const,
    dateIso: m.dateIso,
    time: m.time,
    title:
      m.venue === 'thuis'
        ? `Thuis vs ${m.opponent}`
        : m.venue === 'uit'
          ? `Uit vs ${m.opponent}`
          : `vs ${m.opponent}`,
    location: m.location,
    meta:
      m.competition ??
      (m.venue === 'thuis'
        ? 'Thuiswedstrijd'
        : m.venue === 'uit'
          ? 'Uitwedstrijd'
          : undefined),
  }))

  let trainingEvents: CalEvent[] = []
  if (trainings.length > 0 && matches.length > 0) {
    const sorted = [...matches].sort((a, b) => a.dateIso.localeCompare(b.dateIso))
    const from = sorted[0]!.dateIso
    const until = sorted[sorted.length - 1]!.dateIso
    trainingEvents = expandWeeklyTrainings(trainings, from, until)
  }

  return [...trainingEvents, ...matchEvents].sort((a, b) => {
    const d = a.dateIso.localeCompare(b.dateIso)
    if (d !== 0) return d
    return a.time.localeCompare(b.time)
  })
}


/** Prefer concrete Beheer Trainingen_data dates; fall back to weekly expansion. */
export function buildTeamCalendarEventsFromSheet(
  matches: TeamMatch[],
  datedTrainings: DatedTraining[] = [],
  weeklyTrainings: TeamTraining[] = [],
): CalEvent[] {
  const matchEvents: CalEvent[] = matches.map((m) => ({
    id: m.id,
    kind: 'match' as const,
    dateIso: m.dateIso,
    time: m.time,
    title:
      m.venue === 'thuis'
        ? `Thuis vs ${m.opponent}`
        : m.venue === 'uit'
          ? `Uit vs ${m.opponent}`
          : `vs ${m.opponent}`,
    location: m.location,
    meta:
      m.competition ??
      (m.venue === 'thuis'
        ? 'Thuiswedstrijd'
        : m.venue === 'uit'
          ? 'Uitwedstrijd'
          : undefined),
  }))

  let trainingEvents: CalEvent[] = datedTrainings
    .filter((t) => t.status === 'ja')
    .map((t) => ({
      id: t.id,
      kind: 'training' as const,
      dateIso: t.dateIso,
      time: t.time,
      title: `Training · ${t.day}`,
      location: t.location,
      meta: t.focus || t.note,
    }))

  if (trainingEvents.length === 0 && weeklyTrainings.length > 0 && matches.length > 0) {
    const sorted = [...matches].sort((a, b) => a.dateIso.localeCompare(b.dateIso))
    trainingEvents = expandWeeklyTrainings(
      weeklyTrainings,
      sorted[0]!.dateIso,
      sorted[sorted.length - 1]!.dateIso,
    )
  }

  return [...trainingEvents, ...matchEvents].sort((a, b) => {
    const d = a.dateIso.localeCompare(b.dateIso)
    if (d !== 0) return d
    return a.time.localeCompare(b.time)
  })
}
