import type { TeamMatch, TeamMatchVenue } from '../data/teamMatches'
import { csvToObjects } from './csv'

function parseVenue(raw: string): TeamMatchVenue {
  const v = raw.trim().toLowerCase()
  if (v === 'thuis' || v === 'home') return 'thuis'
  if (v === 'uit' || v === 'away') return 'uit'
  return 'unknown'
}

function normalizeDate(raw: string): string | null {
  const t = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function normalizeTime(raw: string): string {
  const t = raw.trim()
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t || '00:00'
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`
}

/** Parse Beheer tab Matchen CSV → TeamMatch[]. */
export function parseMatchenCsv(
  csvText: string,
  teamSlug: string,
): TeamMatch[] {
  const rows = csvToObjects(csvText)
  const matches: TeamMatch[] = []
  let idx = 0

  for (const row of rows) {
    const dateIso = normalizeDate(row.datum ?? '')
    const opponent = (row.tegenstander ?? '').trim()
    if (!dateIso || !opponent) continue

    const status = (row.status ?? '').trim().toLowerCase()
    if (status === 'geannuleerd' || status === 'cancelled' || status === 'afgelast') {
      continue
    }

    const time = normalizeTime(row.uur ?? '')
    const venue = parseVenue(row.thuis_uit ?? '')
    const location = (row.locatie ?? '').trim()
    const address = (row.adres ?? '').trim() || undefined
    const competition = (row.competitie ?? '').trim() || undefined
    idx += 1
    const timeKey = time.replace(':', '')
    matches.push({
      id: `${teamSlug}-${dateIso}-${timeKey}-${idx}`,
      dateIso,
      time,
      opponent,
      venue,
      location,
      address,
      competition,
    })
  }

  return matches.sort(
    (a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time),
  )
}
