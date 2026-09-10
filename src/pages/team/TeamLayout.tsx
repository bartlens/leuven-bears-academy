import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { TeamSubNav } from '../../components/TeamSubNav'
import { SectionHeader } from '../../components/SectionHeader'
import { HeroTitlePeek } from '../../components/HeroTitlePeek'
import { getDemoPlayersForTeam } from '../../data/demoPlayers'
import { getTeamBySlug, groupLabels, type Team } from '../../data/teams'

export type TeamOutletContext = {
  team: Team
}

export function TeamLayout() {
  const { slug } = useParams()
  const location = useLocation()
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

  const teamPlayers = getDemoPlayersForTeam(team.slug, team.group)
  // Welcome party only on team hub home (`/team/:slug`), not on subpages
  const isTeamHome =
    location.pathname.replace(/\/$/, '') === `/team/${team.slug}`

  return (
    <div>
      <div className="border-b border-white/8 bg-ink-soft/80">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <Link
            to="/teams"
            className="mb-3 inline-flex text-sm font-semibold text-warm hover:text-hoop-bright"
          >
            ← Alle teams
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
                {groupLabels[team.group]}
              </p>
              <HeroTitlePeek
                key={team.slug}
                name={team.name}
                category={team.category}
                players={teamPlayers}
                autoWelcome={isTeamHome}
                className="hero-title-peek font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl"
              />
            </div>
          </div>
        </div>
      </div>
      <TeamSubNav />
      <Outlet context={{ team } satisfies TeamOutletContext} />
    </div>
  )
}
