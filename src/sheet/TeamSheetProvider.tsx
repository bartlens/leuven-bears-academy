import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getDemoPlayersForTeam,
  type AcademyPlayer,
} from '../data/demoPlayers'
import {
  getMatchesForTeam,
  getNextMatch as getNextDemoMatch,
  type TeamMatch,
} from '../data/teamMatches'
import { getTeamSheetConfig, hasTeamSheet } from '../data/teamSheets'
import type { Team } from '../data/teams'
import { hasVblTeam } from '../data/vblTeams'
import { brusselsTodayIso } from '../lib/calendarEvents'
import {
  fetchTeamMatches,
  getGeneratedVblMatches,
  mergeVblAndSheetExtras,
} from '../vbl/fetchTeamMatches'
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
import { fetchBeheerLive } from './fetchBeheer'

export type TeamSheetSource = 'live' | 'demo'

export type TeamSheetData = {
  team: Team
  players: AcademyPlayer[]
  matches: TeamMatch[]
  nextMatch: TeamMatch | undefined
  source: TeamSheetSource
  loading: boolean
  error: string | null
  beheerUrl: string | null
  aanwezigheidUrl: string | null
  fetchedAt: string | null
  vblMatchCount: number
  sheetExtraCount: number
  ploeg: PloegMeta
  staff: StaffMember[]
  weeklyTrainings: WeeklyTraining[]
  datedTrainings: DatedTraining[]
  events: TeamEventItem[]
  infoItems: InfoItem[]
  afspraken: MatchAfspraken
  herfststage: HerfststageInfo
}

const emptyAfspraken: MatchAfspraken = {
  title: 'Afspraken wedstrijden',
  bullets: [],
  draaischema: { title: 'Draaischema', bullets: [] },
}

const TeamSheetContext = createContext<TeamSheetData | null>(null)

function pickNext(matches: TeamMatch[]): TeamMatch | undefined {
  const today = brusselsTodayIso()
  return [...matches]
    .filter((m) => m.dateIso >= today && m.status !== 'played')
    .sort(
      (a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time),
    )[0]
}

function staticFallbackMatches(slug: string): TeamMatch[] {
  const generated = getGeneratedVblMatches(slug)
  if (generated.length > 0) return generated
  return getMatchesForTeam(slug).map((m) =>
    m.source ? m : { ...m, source: 'static' as const },
  )
}

function demoBundle(team: Team): Omit<TeamSheetData, 'loading' | 'error' | 'fetchedAt'> {
  const config = getTeamSheetConfig(team.slug)
  const matches = staticFallbackMatches(team.slug)
  return {
    team,
    players: getDemoPlayersForTeam(team.slug, team.group),
    matches,
    nextMatch: pickNext(matches) ?? getNextDemoMatch(team.slug),
    source: hasVblTeam(team.slug) ? 'live' : 'demo',
    beheerUrl: config?.beheerUrl ?? null,
    aanwezigheidUrl: config?.aanwezigheidUrl ?? null,
    vblMatchCount: getGeneratedVblMatches(team.slug).length,
    sheetExtraCount: 0,
    ploeg: {},
    staff: [],
    weeklyTrainings: [],
    datedTrainings: [],
    events: [],
    infoItems: [],
    afspraken: emptyAfspraken,
    herfststage: null,
  }
}

export function TeamSheetProvider({
  team,
  children,
}: {
  team: Team
  children: ReactNode
}) {
  const demo = useMemo(() => demoBundle(team), [team])
  const needsFetch = hasTeamSheet(team.slug) || hasVblTeam(team.slug)
  const [state, setState] = useState<TeamSheetData>(() => ({
    ...demo,
    loading: needsFetch,
    error: null,
    fetchedAt: null,
  }))

  useEffect(() => {
    const fallback = demoBundle(team)
    const loadSheet = hasTeamSheet(team.slug)
    const loadVbl = hasVblTeam(team.slug)

    if (!loadSheet && !loadVbl) {
      setState({
        ...fallback,
        loading: false,
        error: null,
        fetchedAt: null,
      })
      return
    }

    let cancelled = false
    setState((prev) => ({
      ...fallback,
      players:
        prev.team.slug === team.slug && prev.source === 'live'
          ? prev.players
          : fallback.players,
      matches:
        prev.team.slug === team.slug && prev.matches.length > 0
          ? prev.matches
          : fallback.matches,
      nextMatch:
        prev.team.slug === team.slug && prev.nextMatch
          ? prev.nextMatch
          : fallback.nextMatch,
      staff: prev.team.slug === team.slug ? prev.staff : [],
      datedTrainings:
        prev.team.slug === team.slug ? prev.datedTrainings : [],
      events: prev.team.slug === team.slug ? prev.events : [],
      infoItems: prev.team.slug === team.slug ? prev.infoItems : [],
      afspraken: prev.team.slug === team.slug ? prev.afspraken : emptyAfspraken,
      herfststage: prev.team.slug === team.slug ? prev.herfststage : null,
      ploeg: prev.team.slug === team.slug ? prev.ploeg : {},
      weeklyTrainings:
        prev.team.slug === team.slug ? prev.weeklyTrainings : [],
      source:
        prev.team.slug === team.slug && prev.source === 'live'
          ? 'live'
          : fallback.source,
      loading: true,
      error: null,
      fetchedAt: prev.team.slug === team.slug ? prev.fetchedAt : null,
      vblMatchCount:
        prev.team.slug === team.slug ? prev.vblMatchCount : fallback.vblMatchCount,
      sheetExtraCount:
        prev.team.slug === team.slug ? prev.sheetExtraCount : 0,
    }))

    ;(async () => {
      try {
        const [vblResult, sheetResult] = await Promise.all([
          loadVbl
            ? fetchTeamMatches(team.slug)
            : Promise.resolve({
                matches: [] as TeamMatch[],
                from: 'none' as const,
              }),
          loadSheet
            ? fetchBeheerLive(team.slug, team.group)
                .then((live) => ({ ok: true as const, live }))
                .catch((err: unknown) => ({
                  ok: false as const,
                  error:
                    err instanceof Error
                      ? err.message
                      : 'Beheer-sheet laden mislukt',
                }))
            : Promise.resolve({ ok: false as const }),
        ])

        if (cancelled) return

        const vblMatches =
          vblResult.matches.length > 0
            ? vblResult.matches
            : getGeneratedVblMatches(team.slug)

        let players = fallback.players
        let sheetExtras: TeamMatch[] = []
        let beheerUrl = fallback.beheerUrl
        let aanwezigheidUrl = fallback.aanwezigheidUrl
        let fetchedAt: string | null = null
        let sheetError: string | null =
          !sheetResult.ok && 'error' in sheetResult ? sheetResult.error : null
        let ploeg: PloegMeta = {}
        let staff: StaffMember[] = []
        let weeklyTrainings: WeeklyTraining[] = []
        let datedTrainings: DatedTraining[] = []
        let events: TeamEventItem[] = []
        let infoItems: InfoItem[] = []
        let afspraken: MatchAfspraken = emptyAfspraken
        let herfststage: HerfststageInfo = null

        if (sheetResult.ok) {
          const live = sheetResult.live
          players = live.players.length > 0 ? live.players : fallback.players
          sheetExtras = live.matches.map((m) => ({
            ...m,
            source: 'sheet' as const,
          }))
          beheerUrl = live.config.beheerUrl
          aanwezigheidUrl = live.config.aanwezigheidUrl
          fetchedAt = live.fetchedAt
          ploeg = live.ploeg
          staff = live.staff
          weeklyTrainings = live.weeklyTrainings
          datedTrainings = live.datedTrainings
          events = live.events
          infoItems = live.infoItems
          afspraken = live.afspraken
          herfststage = live.herfststage
        }

        const matches =
          vblMatches.length > 0 || sheetExtras.length > 0
            ? mergeVblAndSheetExtras(vblMatches, sheetExtras)
            : fallback.matches

        const hasLiveContent =
          vblMatches.length > 0 ||
          (sheetResult.ok &&
            (sheetResult.live.players.length > 0 ||
              sheetExtras.length > 0 ||
              sheetResult.live.staff.length > 0 ||
              sheetResult.live.datedTrainings.length > 0))

        setState({
          team,
          players,
          matches,
          nextMatch: pickNext(matches),
          source: hasLiveContent ? 'live' : 'demo',
          loading: false,
          error: sheetError,
          beheerUrl,
          aanwezigheidUrl,
          fetchedAt,
          vblMatchCount: vblMatches.length,
          sheetExtraCount: sheetExtras.length,
          ploeg,
          staff,
          weeklyTrainings,
          datedTrainings,
          events,
          infoItems,
          afspraken,
          herfststage,
        })
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Wedstrijden laden mislukt'
        setState({
          ...fallback,
          loading: false,
          error: message,
          fetchedAt: null,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [team])

  return (
    <TeamSheetContext.Provider value={state}>{children}</TeamSheetContext.Provider>
  )
}

export function useTeamSheetData(): TeamSheetData {
  const ctx = useContext(TeamSheetContext)
  if (!ctx) {
    throw new Error('useTeamSheetData moet binnen TeamSheetProvider')
  }
  return ctx
}

export function useTeamSheetDataOptional(): TeamSheetData | null {
  return useContext(TeamSheetContext)
}
