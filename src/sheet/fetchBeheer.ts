import type { AcademyPlayer } from '../data/demoPlayers'
import type { TeamMatch } from '../data/teamMatches'
import type { TeamGroup } from '../data/teams'
import {
  beheerGvizCsvUrl,
  getTeamSheetConfig,
  type TeamSheetConfig,
} from '../data/teamSheets'
import type {
  DatedTraining,
  HerfststageInfo,
  InfoItem,
  MatchAfspraken,
  PloegMeta,
  StaffMember,
  TeamEventItem,
  WeeklyTraining,
} from './beheerTypes'
import {
  infoToAfspraken,
  infoToHerfststage,
  parseEvenementenCsv,
  parseInfoCsv,
  parsePloegCsv,
  parseStaffCsv,
  parseTrainingenDataCsv,
  parseTrainingenWeekCsv,
  weeklyToTeamTrainings,
} from './parseBeheerTabs'
import { parseMatchenCsv } from './parseMatchen'
import { parseSpelersCsv } from './parseSpelers'

export type BeheerLiveData = {
  players: AcademyPlayer[]
  /** Sheet Matchen tab = extras only (scrimmages / friendlies). Official games come from VBL. */
  matches: TeamMatch[]
  ploeg: PloegMeta
  staff: StaffMember[]
  weeklyTrainings: WeeklyTraining[]
  datedTrainings: DatedTraining[]
  events: TeamEventItem[]
  infoItems: InfoItem[]
  afspraken: MatchAfspraken
  herfststage: HerfststageInfo
  /** Convenience: active weekly slots as TeamTraining-like. */
  trainingsFromWeek: { day: string; time?: string; location?: string }[]
  config: TeamSheetConfig
  fetchedAt: string
}

async function fetchTabCsv(
  beheerId: string,
  tabName: string,
): Promise<string | null> {
  const url = beheerGvizCsvUrl(beheerId, tabName, true)
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
    })
    if (!res.ok) return null
    const text = await res.text()
    const head = text.slice(0, 80).toLowerCase()
    if (
      head.includes('<!doctype') ||
      head.includes('<html') ||
      head.includes('google accounts') ||
      head.includes('moved temporarily')
    ) {
      return null
    }
    return text
  } catch {
    return null
  }
}

/**
 * Fetch Beheer tabs via public gviz CSV.
 * Required: Spelers (and/or Matchen). Optional: Ploeg, Staff, Trainingen_*, Evenementen, Info.
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

  const [
    spelersCsv,
    matchenCsv,
    ploegCsv,
    staffCsv,
    weekCsv,
    datedCsv,
    eventsCsv,
    infoCsv,
  ] = await Promise.all([
    fetchTabCsv(config.beheerId, spelersTab),
    fetchTabCsv(config.beheerId, matchenTab),
    fetchTabCsv(config.beheerId, 'Ploeg'),
    fetchTabCsv(config.beheerId, 'Staff'),
    fetchTabCsv(config.beheerId, 'Trainingen_week'),
    fetchTabCsv(config.beheerId, 'Trainingen_data'),
    fetchTabCsv(config.beheerId, 'Evenementen'),
    fetchTabCsv(config.beheerId, 'Info'),
  ])

  const players = spelersCsv
    ? parseSpelersCsv(spelersCsv, { teamSlug, ageGroup })
    : []
  const matches = matchenCsv
    ? parseMatchenCsv(matchenCsv, teamSlug).map((m) => ({
        ...m,
        source: 'sheet' as const,
      }))
    : []

  const ploeg = ploegCsv ? parsePloegCsv(ploegCsv) : {}
  const staff = staffCsv ? parseStaffCsv(staffCsv) : []
  const weeklyTrainings = weekCsv ? parseTrainingenWeekCsv(weekCsv) : []
  const datedTrainings = datedCsv
    ? parseTrainingenDataCsv(datedCsv, weeklyTrainings).filter((t) => t.status === 'ja')
    : []
  const events = eventsCsv ? parseEvenementenCsv(eventsCsv) : []
  const infoItems = infoCsv ? parseInfoCsv(infoCsv) : []
  const afspraken = infoToAfspraken(infoItems)
  const herfststage = infoToHerfststage(infoItems)
  const trainingsFromWeek = weeklyToTeamTrainings(weeklyTrainings)

  if (
    players.length === 0 &&
    matches.length === 0 &&
    staff.length === 0 &&
    datedTrainings.length === 0 &&
    events.length === 0
  ) {
    throw new Error('Beheer-sheet gaf geen bruikbare data')
  }

  // Prefer aanwezigheid URL from Ploeg tab when set
  const mergedConfig: TeamSheetConfig = {
    ...config,
    aanwezigheidUrl: ploeg.aanwezigheidUrl || config.aanwezigheidUrl,
  }

  return {
    players,
    matches,
    ploeg,
    staff,
    weeklyTrainings,
    datedTrainings,
    events,
    infoItems,
    afspraken,
    herfststage,
    trainingsFromWeek,
    config: mergedConfig,
    fetchedAt: new Date().toISOString(),
  }
}
