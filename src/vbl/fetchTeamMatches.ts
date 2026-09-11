/**
 * Client/server-safe VBL match fetcher.
 * Live: CORS * on vblcb.wisseq.eu → browser can call API directly.
 * Dev: optional `/api/vbl/*` Vite proxy.
 * Fallback: generated snapshot from `scripts/sync-vbl.mjs`.
 */
import type { TeamMatch, TeamMatchStatus, TeamMatchVenue } from '../data/teamMatches'
import {
  VBL_API_BASE,
  encodeVblTeamGuid,
  getVblTeam,
} from '../data/vblTeams'
import { vblMatchesBySlug as generatedMatches } from '../data/generated/vblMatchesBySlug'

export type VblRawMatch = {
  guid?: string
  wedID?: string
  tTGUID?: string
  tTNaam?: string
  tUGUID?: string
  tUNaam?: string
  datumString?: string
  beginTijd?: string
  accNaam?: string
  pouleNaam?: string
  uitslag?: string
  gespeeld?: string
}

const SESSION_TTL_MS = 15 * 60 * 1000
const SESSION_PREFIX = 'vbl-matches:'

function sessionGet(slug: string): TeamMatch[] | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + slug)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; matches: TeamMatch[] }
    if (Date.now() - parsed.at > SESSION_TTL_MS) return null
    return parsed.matches
  } catch {
    return null
  }
}

function sessionSet(slug: string, matches: TeamMatch[]): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      SESSION_PREFIX + slug,
      JSON.stringify({ at: Date.now(), matches }),
    )
  } catch {
    /* quota / private mode */
  }
}

/** dd-mm-yyyy → yyyy-mm-dd */
export function parseVblDate(datumString: string): string | null {
  const m = datumString.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** "09.00" → "09:00" */
export function parseVblTime(beginTijd: string): string {
  const t = (beginTijd ?? '').trim().replace('.', ':')
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t || '00:00'
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`
}

export function parseVblMatch(
  raw: VblRawMatch,
  ourGuid: string,
  teamSlug: string,
  idx: number,
): TeamMatch | null {
  const dateIso = parseVblDate(raw.datumString ?? '')
  if (!dateIso) return null

  const weAreHome = (raw.tTGUID ?? '') === ourGuid
  const weAreAway = (raw.tUGUID ?? '') === ourGuid
  let venue: TeamMatchVenue = 'unknown'
  let opponent = ''
  if (weAreHome) {
    venue = 'thuis'
    opponent = (raw.tUNaam ?? '').trim()
  } else if (weAreAway) {
    venue = 'uit'
    opponent = (raw.tTNaam ?? '').trim()
  } else {
    // Unexpected — still show something useful
    opponent =
      (raw.tTNaam ?? '').includes('Leuven')
        ? (raw.tUNaam ?? '').trim()
        : (raw.tTNaam ?? '').trim()
  }
  if (!opponent) return null

  const time = parseVblTime(raw.beginTijd ?? '')
  const score = (raw.uitslag ?? '').trim() || undefined
  const gespeeld = (raw.gespeeld ?? '').trim().toUpperCase()
  let status: TeamMatchStatus = 'upcoming'
  if (gespeeld === 'J' || Boolean(score)) status = 'played'

  const idBase = raw.wedID || raw.guid || `${dateIso}-${time.replace(':', '')}-${idx}`
  return {
    id: `vbl-${teamSlug}-${idBase}`,
    dateIso,
    time,
    opponent,
    venue,
    location: (raw.accNaam ?? '').trim(),
    competition: (raw.pouleNaam ?? '').trim() || undefined,
    score,
    status,
    source: 'vbl',
  }
}

export function parseVblMatches(
  rawList: VblRawMatch[],
  ourGuid: string,
  teamSlug: string,
): TeamMatch[] {
  const matches: TeamMatch[] = []
  let idx = 0
  for (const raw of rawList) {
    idx += 1
    const m = parseVblMatch(raw, ourGuid, teamSlug, idx)
    if (m) matches.push(m)
  }
  return matches.sort(
    (a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time),
  )
}

function liveApiUrl(encodedGuid: string): string {
  // Prefer Vite proxy in DEV so refreshes work even if CORS policy changes.
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return `/api/vbl/TeamMatchesByGuid?teamguid=${encodedGuid}`
  }
  return `${VBL_API_BASE}/TeamMatchesByGuid?teamguid=${encodedGuid}`
}

async function fetchLiveRaw(teamGuid: string): Promise<VblRawMatch[]> {
  const encoded = encodeVblTeamGuid(teamGuid)
  const url = liveApiUrl(encoded)
  const res = await fetch(url, { method: 'GET', credentials: 'omit' })
  if (!res.ok) throw new Error(`VBL HTTP ${res.status}`)
  const data = (await res.json()) as unknown
  if (!Array.isArray(data)) throw new Error('VBL response not an array')
  return data as VblRawMatch[]
}

/** Generated snapshot for a slug (empty if sync never ran / unmapped). */
export function getGeneratedVblMatches(slug: string): TeamMatch[] {
  return generatedMatches[slug] ?? []
}

/**
 * Fetch official matches for an academy slug.
 * Order: sessionStorage → live VBL → generated snapshot.
 * Returns [] when slug has no VBL mapping.
 */
export async function fetchTeamMatches(
  slug: string,
  opts?: { forceLive?: boolean },
): Promise<{ matches: TeamMatch[]; from: 'live' | 'cache' | 'generated' | 'none' }> {
  const mapping = getVblTeam(slug)
  if (!mapping) return { matches: [], from: 'none' }

  if (!opts?.forceLive) {
    const cached = sessionGet(slug)
    if (cached) return { matches: cached, from: 'cache' }
  }

  try {
    const raw = await fetchLiveRaw(mapping.teamGuid)
    const matches = parseVblMatches(raw, mapping.teamGuid, slug)
    sessionSet(slug, matches)
    return { matches, from: 'live' }
  } catch {
    const generated = getGeneratedVblMatches(slug)
    if (generated.length > 0) {
      return { matches: generated, from: 'generated' }
    }
    return { matches: [], from: 'none' }
  }
}

/** Merge official VBL matches with sheet extras (scrimmages, friendlies). */
export function mergeVblAndSheetExtras(
  vblMatches: TeamMatch[],
  sheetExtras: TeamMatch[],
): TeamMatch[] {
  const extras = sheetExtras.map((m) =>
    m.source ? m : { ...m, source: 'sheet' as const },
  )
  return [...vblMatches, ...extras].sort(
    (a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time),
  )
}
