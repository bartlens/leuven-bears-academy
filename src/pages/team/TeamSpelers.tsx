import { useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { PlayerCard } from '../../components/PlayerCard'
import { club } from '../../data/club'
import { u10cSiteSpelersUrl } from '../../data/u10cPlayers'
import { useTeamSheetData } from '../../sheet/TeamSheetProvider'

export function TeamSpelers() {
  const { team } = useOutletContext<TeamOutletContext>()
  const { players, source, loading } = useTeamSheetData()
  const isU10c = team.slug === 'u10-c'

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-12 sm:px-6">
      <SectionHeader
        eyebrow={`Selectie · Seizoen ${club.season}`}
        title="Onze spelers"
        subtitle={`De beren van ${team.name} — ${players.length} spelers met elk hun eigen vibe.`}
      />

      {isU10c && (
        <div className="mb-6 rounded-2xl border border-hoop/30 bg-hoop/10 px-5 py-4">
          <p className="text-sm text-cream/90">
            Officiële U10 C-selectiepagina staat ook op de eigen site.
          </p>
          <a
            href={u10cSiteSpelersUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm font-bold text-hoop-bright hover:underline"
          >
            Open spelers op leuvenbears-u10c.be →
          </a>
        </div>
      )}

      {loading && (
        <p className="mb-4 text-sm text-muted">Selectie laden uit Beheer…</p>
      )}

      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {players.map((p, i) => (
          <PlayerCard key={p.id} player={p} index={i} />
        ))}
      </div>

      <p className="text-center text-sm text-muted">
        {source === 'live'
          ? 'Live selectie uit Beheer-sheet · tik een kaart voor geluid · deel van '
          : 'Demo-selectie · tik een kaart voor geluid · deel van '}
        <span className="font-semibold text-cream">Leuven Bears Academy</span>
      </p>
    </div>
  )
}
