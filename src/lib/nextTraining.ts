import type { DatedTraining, WeeklyTraining } from '../sheet/beheerTypes'

const BRUSSELS = 'Europe/Brussels'

export type NextTraining = {
  day: string
  time: string
  location: string
  focus: string
  dateIso: string
  whenLabel: string
  isToday: boolean
  isOngoing: boolean
}

function brusselsParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: BRUSSELS,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute),
    weekday: weekdayMap[parts.weekday] ?? 0,
  }
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function whenLabelFor(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function parseStartMin(time: string): number {
  const m = time.match(/(\d{1,2}):(\d{2})/)
  if (!m) return 17 * 60 + 30
  return Number(m[1]) * 60 + Number(m[2])
}

function parseEndMin(time: string): number {
  // prefer end after en-dash
  const parts = time.split(/[–-]/)
  if (parts.length >= 2) {
    const end = parts[1]!.match(/(\d{1,2}):(\d{2})/)
    if (end) return Number(end[1]) * 60 + Number(end[2])
  }
  return parseStartMin(time) + 90
}

function addDays(y: number, m: number, d: number, n: number) {
  const utc = new Date(Date.UTC(y, m - 1, d + n))
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    weekday: utc.getUTCDay(),
  }
}

function weeklyNext(now: Date, week: WeeklyTraining[]): NextTraining | null {
  const active = week.filter((w) => w.active && w.start)
  if (active.length === 0) return null
  const byWd: Record<number, WeeklyTraining> = {}
  const map: Record<string, number> = {
    zondag: 0, maandag: 1, dinsdag: 2, woensdag: 3,
    donderdag: 4, vrijdag: 5, zaterdag: 6,
  }
  for (const w of active) {
    const wd = map[w.day.toLowerCase()]
    if (wd !== undefined) byWd[wd] = w
  }
  const here = brusselsParts(now)
  const nowMin = here.hour * 60 + here.minute
  for (let offset = 0; offset < 8; offset++) {
    const cal =
      offset === 0
        ? { year: here.year, month: here.month, day: here.day, weekday: here.weekday }
        : addDays(here.year, here.month, here.day, offset)
    const slot = byWd[cal.weekday]
    if (!slot) continue
    const endMin = slot.end
      ? parseStartMin(slot.end)
      : parseStartMin(slot.start) + 90
    if (offset === 0 && nowMin >= endMin) continue
    const dateIso = `${cal.year}-${pad2(cal.month)}-${pad2(cal.day)}`
    const time = slot.end ? `${slot.start}–${slot.end}` : slot.start
    return {
      day: slot.day,
      time,
      location: slot.location,
      focus: slot.focus,
      dateIso,
      whenLabel: whenLabelFor(dateIso),
      isToday: offset === 0,
      isOngoing:
        offset === 0 &&
        nowMin >= parseStartMin(slot.start) &&
        nowMin < endMin,
    }
  }
  return null
}

export function getNextTraining(
  now = new Date(),
  dated: DatedTraining[] = [],
  week: WeeklyTraining[] = [],
): NextTraining | null {
  const here = brusselsParts(now)
  const todayIso = `${here.year}-${pad2(here.month)}-${pad2(here.day)}`
  const nowMin = here.hour * 60 + here.minute
  const activeDated = dated.filter((d) => d.status === 'ja')

  if (activeDated.length > 0) {
    const lastDate = activeDated.reduce((a, b) =>
      a.dateIso > b.dateIso ? a : b,
    ).dateIso
    if (todayIso <= lastDate) {
      for (const dt of activeDated) {
        if (dt.dateIso < todayIso) continue
        const endMin = parseEndMin(dt.time)
        if (dt.dateIso === todayIso && nowMin >= endMin) continue
        const isToday = dt.dateIso === todayIso
        return {
          day: dt.day,
          time: dt.time,
          location: dt.location,
          focus: dt.focus,
          dateIso: dt.dateIso,
          whenLabel: whenLabelFor(dt.dateIso),
          isToday,
          isOngoing:
            isToday &&
            nowMin >= parseStartMin(dt.time) &&
            nowMin < endMin,
        }
      }
    }
  }

  return weeklyNext(now, week)
}

export function getUpcomingDatedTrainings(
  now = new Date(),
  dated: DatedTraining[] = [],
): DatedTraining[] {
  const here = brusselsParts(now)
  const todayIso = `${here.year}-${pad2(here.month)}-${pad2(here.day)}`
  const nowMin = here.hour * 60 + here.minute
  return dated.filter((dt) => {
    if (dt.status !== 'ja') return false
    if (dt.dateIso > todayIso) return true
    if (dt.dateIso === todayIso && nowMin < parseEndMin(dt.time)) return true
    return false
  })
}
