import type { AcademyPlayer } from '../data/demoPlayers'
import type { TeamMatch } from '../data/teamMatches'
import type { TeamGroup } from '../data/teams'
import {
  beheerGvizCsvUrl,
  getTeamSheetConfig,
  type TeamSheetConfig,
} from '../data/teamSheets'
import { parseMatchenCsv } from './parseMatchen'
import { parseSpelersCsv } from './parseSpelers'

export type BeheerLiveData = {
  players: AcademyPlayer[]
  /** Sheet Matchen tab = extras only (scrimmages / friendlies). Official games come from VBL. */
  matches: TeamMatch[]
  config: TeamSheetConfig
  fetchedAt: string
}

async function fetchTabCsv(
  beheerId: string,
  tabName: string,
): Promise<string> {
  const url = beheerGvizCsvUrl(beheerId, tabName, true)
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
  })
  if (!res.ok) {
    throw new Error(`gviz ${tabName}: HTTP ${res.status}`)
  }
  const text = await res.text()
  const head = text.slice(0, 80).toLowerCase()
  if (
    head.includes('<!doctype') ||
    head.includes('<html') ||
    head.includes('google accounts')
  ) {
    throw new Error(`gviz ${tabName}: not CSV (sheet not public?)`)
  }
  return text
}

/**
 * Fetch Spelers + Matchen (extras) from Beheer via public gviz CSV.
 * Official competition matches are loaded from Basketbal Vlaanderen separately.
 */
export async function fetchBeheerLive(
  teamSlug: string,
  ageGroup: TeamGroup,
): Promise<BeheerLiveData> {
  const config = getTeamSheetConfig(teamSlug)
  if (!config?.beheerId) {
    throw new Error(`Geen Beheer-sheet voor ${teamSlug}`)
  }

  const spelersTab = config.tabs?.spelers ?? 'Spelers'
  const matchenTab = config.tabs?.matchen ?? 'Matchen'

  const [spelersCsv, matchenCsv] = await Promise.all([
    fetchTabCsv(config.beheerId, spelersTab),
    fetchTabCsv(config.beheerId, matchenTab),
  ])

  const players = parseSpelersCsv(spelersCsv, { teamSlug, ageGroup })
  // Parsed as sheet extras — coaches should not re-type official VBL games here.
  const matches = parseMatchenCsv(matchenCsv, teamSlug).map((m) => ({
    ...m,
    source: 'sheet' as const,
  }))

  if (players.length === 0 && matches.length === 0) {
    throw new Error('Beheer-sheet gaf geen spelers of matchen')
  }

  return {
    players,
    matches,
    config,
    fetchedAt: new Date().toISOString(),
  }
}
