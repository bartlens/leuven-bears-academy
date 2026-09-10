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
import { brusselsTodayIso } from '../lib/calendarEvents'
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
}

const TeamSheetContext = createContext<TeamSheetData | null>(null)

function demoBundle(team: Team): Omit<
  TeamSheetData,
  'loading' | 'error' | 'fetchedAt'
> {
  const config = getTeamSheetConfig(team.slug)
  const matches = getMatchesForTeam(team.slug)
  return {
    team,
    players: getDemoPlayersForTeam(team.slug, team.group),
    matches,
    nextMatch: getNextDemoMatch(team.slug),
    source: 'demo',
    beheerUrl: config?.beheerUrl ?? null,
    aanwezigheidUrl: config?.aanwezigheidUrl ?? null,
  }
}

function pickNext(matches: TeamMatch[]): TeamMatch | undefined {
  const today = brusselsTodayIso()
  return [...matches]
    .filter((m) => m.dateIso >= today)
    .sort(
      (a, b) => a.dateIso.localeCompare(b.dateIso) || a.time.localeCompare(b.time),
    )[0]
}

export function TeamSheetProvider({
  team,
  children,
}: {
  team: Team
  children: ReactNode
}) {
  const demo = useMemo(() => demoBundle(team), [team])
  const [state, setState] = useState<TeamSheetData>(() => ({
    ...demo,
    loading: hasTeamSheet(team.slug),
    error: null,
    fetchedAt: null,
  }))

  useEffect(() => {
    const fallback = demoBundle(team)
    if (!hasTeamSheet(team.slug)) {
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
      // Keep previous live data briefly while reloading same team
      players: prev.team.slug === team.slug && prev.source === 'live' ? prev.players : fallback.players,
      matches: prev.team.slug === team.slug && prev.source === 'live' ? prev.matches : fallback.matches,
      nextMatch:
        prev.team.slug === team.slug && prev.source === 'live'
          ? prev.nextMatch
          : fallback.nextMatch,
      source: prev.team.slug === team.slug && prev.source === 'live' ? 'live' : 'demo',
      loading: true,
      error: null,
      fetchedAt: prev.team.slug === team.slug ? prev.fetchedAt : null,
    }))

    ;(async () => {
      try {
        const live = await fetchBeheerLive(team.slug, team.group)
        if (cancelled) return
        const players =
          live.players.length > 0 ? live.players : fallback.players
        const matches =
          live.matches.length > 0 ? live.matches : fallback.matches
        setState({
          team,
          players,
          matches,
          nextMatch: pickNext(matches),
          source: live.players.length > 0 || live.matches.length > 0 ? 'live' : 'demo',
          loading: false,
          error: null,
          beheerUrl: live.config.beheerUrl,
          aanwezigheidUrl: live.config.aanwezigheidUrl,
          fetchedAt: live.fetchedAt,
        })
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Beheer-sheet laden mislukt'
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

/** Safe hook when layout may not wrap (tests / stray pages). */
export function useTeamSheetDataOptional(): TeamSheetData | null {
  return useContext(TeamSheetContext)
}
