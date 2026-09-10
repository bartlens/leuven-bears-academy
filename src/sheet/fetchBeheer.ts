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
    // Browser: no custom UA; redirect follows by default
    credentials: 'omit',
  })
  if (!res.ok) {
    throw new Error(`gviz ${tabName}: HTTP ${res.status}`)
  }
  const text = await res.text()
  // Google sometimes returns HTML error / login page instead of CSV
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

/** Fetch Spelers + Matchen from Beheer via public gviz CSV. */
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
  const matches = parseMatchenCsv(matchenCsv, teamSlug)

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
