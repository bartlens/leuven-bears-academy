#!/usr/bin/env node
/**
 * Sync official Basketbal Vlaanderen matches → src/data/generated/vblMatchesBySlug.ts
 *
 * Usage: node scripts/sync-vbl.mjs
 * Cron tip: run before deploy / weekly so Vercel static stays fresh.
 *
 * Encoding: team GUID spaces collapse to "++"
 *   BVBL1125G10  3 → BVBL1125G10++3
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outPath = join(root, 'src/data/generated/vblMatchesBySlug.ts')

const VBL_API_BASE = 'https://vblcb.wisseq.eu/VBLCB_WebService/data'

/** Keep in sync with src/data/vblTeams.ts */
const vblTeamsBySlug = {
  'u08-a': { teamGuid: 'BVBL1125G08  1', vblName: 'AB InBev Leuven Bears G08 A' },
  'u08-b': { teamGuid: 'BVBL1125G08  2', vblName: 'AB InBev Leuven Bears G08 B' },
  'u10-a': { teamGuid: 'BVBL1125G10  1', vblName: 'AB InBev Leuven Bears G10 A' },
  'u10-b': { teamGuid: 'BVBL1125G10  2', vblName: 'AB InBev Leuven Bears G10 B' },
  'u10-c': { teamGuid: 'BVBL1125G10  3', vblName: 'AB InBev Leuven Bears G10 C' },
  'u10-d': { teamGuid: 'BVBL1125G10  4', vblName: 'AB InBev Leuven Bears G10 D' },
  'u12-a': { teamGuid: 'BVBL1125G12  1', vblName: 'AB InBev Leuven Bears G12 A' },
  'u12-b': { teamGuid: 'BVBL1125G12  2', vblName: 'AB InBev Leuven Bears G12 B' },
  'u12-c': { teamGuid: 'BVBL1125G12  3', vblName: 'AB InBev Leuven Bears G12 C' },
  'u12-d': { teamGuid: 'BVBL1125G12  4', vblName: 'AB InBev Leuven Bears G12 D' },
  'u14-a': { teamGuid: 'BVBL1125G14  1', vblName: 'AB InBev Leuven Bears G14 A' },
  'u14-b': { teamGuid: 'BVBL1125G14  2', vblName: 'AB InBev Leuven Bears G14 B' },
  'u14-c': { teamGuid: 'BVBL1125G14  3', vblName: 'AB InBev Leuven Bears G14 C' },
  'u14-d': { teamGuid: 'BVBL1125G14  4', vblName: 'AB InBev Leuven Bears G14 D' },
  'u16-a': { teamGuid: 'BVBL1125J16  1', vblName: 'AB InBev Leuven Bears J16 A' },
  'u16-b': { teamGuid: 'BVBL1125J16  2', vblName: 'AB InBev Leuven Bears J16 B' },
  'u16-c': { teamGuid: 'BVBL1125J16  3', vblName: 'AB InBev Leuven Bears J16 C' },
  'u16-d': { teamGuid: 'BVBL1125J16  4', vblName: 'AB InBev Leuven Bears J16 D' },
  'u18-a': { teamGuid: 'BVBL1125J18  1', vblName: 'AB InBev Leuven Bears J18 A' },
  'u18-b': { teamGuid: 'BVBL1125J18  2', vblName: 'AB InBev Leuven Bears J18 B' },
  'u18-c': { teamGuid: 'BVBL1125J18  3', vblName: 'AB InBev Leuven Bears J18 C' },
  'u18-d': { teamGuid: 'BVBL1125J18  4', vblName: 'AB InBev Leuven Bears J18 D' },
  'u21-a': { teamGuid: 'BVBL1125J21  1', vblName: 'AB InBev Leuven Bears J21 A' },
  'u21-b': { teamGuid: 'BVBL1125J21  2', vblName: 'AB InBev Leuven Bears J21 B' },
  'hse-a': { teamGuid: 'BVBL1125HSE  1', vblName: 'AB InBev Leuven Bears HSE A' },
  'hse-b': { teamGuid: 'BVBL1125HSE  2', vblName: 'AB InBev Leuven Bears HSE B' },
  'hse-c': { teamGuid: 'BVBL1125HSE  3', vblName: 'AB InBev Leuven Bears HSE C' },
  'hse-d': { teamGuid: 'BVBL1125HSE  4', vblName: 'AB InBev Leuven Bears HSE D' },
  'hse-e': { teamGuid: 'BVBL1125HSE  5', vblName: 'AB InBev Leuven Bears HSE E' },
  'dse-a': { teamGuid: 'BVBL1125DSE  1', vblName: 'AB InBev Leuven Bears DSE A' },
  'm19-a': { teamGuid: 'BVBL1125M19  1', vblName: 'AB InBev Leuven Bears M19 A' },
  'lbow-a': { teamGuid: 'BVBL1125ROL  1', vblName: 'AB Inbev Leuven Bears ROL A' },
  'lbow-b': { teamGuid: 'BVBL1125ROL  2', vblName: 'AB Inbev Leuven Bears ROL B' },
}

function encodeGuid(g) {
  return g.replace(/ +/g, '++')
}

function parseDate(datumString) {
  const m = String(datumString ?? '')
    .trim()
    .match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function parseTime(beginTijd) {
  const t = String(beginTijd ?? '')
    .trim()
    .replace('.', ':')
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t || '00:00'
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`
}

function parseMatch(raw, ourGuid, teamSlug, idx) {
  const dateIso = parseDate(raw.datumString)
  if (!dateIso) return null
  const weAreHome = raw.tTGUID === ourGuid
  const weAreAway = raw.tUGUID === ourGuid
  let venue = 'unknown'
  let opponent = ''
  if (weAreHome) {
    venue = 'thuis'
    opponent = String(raw.tUNaam ?? '').trim()
  } else if (weAreAway) {
    venue = 'uit'
    opponent = String(raw.tTNaam ?? '').trim()
  } else {
    opponent = String(raw.tTNaam ?? '').includes('Leuven')
      ? String(raw.tUNaam ?? '').trim()
      : String(raw.tTNaam ?? '').trim()
  }
  if (!opponent) return null
  const time = parseTime(raw.beginTijd)
  const score = String(raw.uitslag ?? '').trim() || undefined
  const gespeeld = String(raw.gespeeld ?? '').trim().toUpperCase()
  const status = gespeeld === 'J' || Boolean(score) ? 'played' : 'upcoming'
  const idBase = raw.wedID || raw.guid || `${dateIso}-${time.replace(':', '')}-${idx}`
  return {
    id: `vbl-${teamSlug}-${idBase}`,
    dateIso,
    time,
    opponent,
    venue,
    location: String(raw.accNaam ?? '').trim(),
    competition: String(raw.pouleNaam ?? '').trim() || undefined,
    score,
    status,
    source: 'vbl',
  }
}

async function fetchTeam(teamGuid) {
  const url = `${VBL_API_BASE}/TeamMatchesByGuid?teamguid=${encodeGuid(teamGuid)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${teamGuid}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error(`Not array for ${teamGuid}`)
  return data
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const bySlug = {}
  const counts = {}
  const errors = {}

  for (const [slug, { teamGuid }] of Object.entries(vblTeamsBySlug)) {
    try {
      const raw = await fetchTeam(teamGuid)
      const matches = []
      let idx = 0
      for (const row of raw) {
        idx += 1
        const m = parseMatch(row, teamGuid, slug, idx)
        if (m) matches.push(m)
      }
      matches.sort(
        (a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time),
      )
      bySlug[slug] = matches
      counts[slug] = matches.length
      console.log(`${slug}: ${matches.length} matches`)
    } catch (err) {
      bySlug[slug] = []
      counts[slug] = 0
      errors[slug] = String(err?.message ?? err)
      console.error(`${slug}: ERROR ${errors[slug]}`)
    }
    await sleep(120)
  }

  const syncedAt = new Date().toISOString()
  const body = `/* AUTO-GENERATED by scripts/sync-vbl.mjs — do not edit by hand */
/* syncedAt: ${syncedAt} */
import type { TeamMatch } from '../teamMatches'

export const vblMatchesSyncedAt = ${JSON.stringify(syncedAt)}

export const vblMatchCounts: Record<string, number> = ${JSON.stringify(counts, null, 2)}

export const vblMatchesBySlug: Record<string, TeamMatch[]> = ${JSON.stringify(bySlug, null, 2)}
`

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, body, 'utf8')
  console.log(`\nWrote ${outPath}`)
  console.log('Counts:', counts)
  if (Object.keys(errors).length) console.log('Errors:', errors)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
