import { Link, Outlet, useParams } from 'react-router-dom'
import { AudioUnlock } from '../../components/AudioUnlock'
import { IdleBallEasterEgg } from '../../components/IdleBallEasterEgg'
import { SectionHeader } from '../../components/SectionHeader'
import { getTeamBySlug, type Team } from '../../data/teams'
import { IdleFunProvider } from '../../fun/IdleFunContext'
import { TeamSheetProvider } from '../../sheet/TeamSheetProvider'

export type TeamOutletContext = {
  team: Team
}

/** Thin outlet wrapper — team chrome lives in TeamNavbar; home has its own hero. */
export function TeamLayout() {
  const { slug } = useParams()
  const team = slug ? getTeamBySlug(slug) : undefined

  if (!team) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader eyebrow="Teams" title="Ploeg niet gevonden" />
        <Link to="/teams" className="font-semibold text-hoop-bright hover:underline">
          ← Terug naar teams
        </Link>
      </div>
    )
  }

  return (
    <TeamSheetProvider team={team}>
      <IdleFunProvider>
        <AudioUnlock />
        <Outlet context={{ team } satisfies TeamOutletContext} />
        <IdleBallEasterEgg />
      </IdleFunProvider>
    </TeamSheetProvider>
  )
}
