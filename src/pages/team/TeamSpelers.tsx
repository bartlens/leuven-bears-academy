import { useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { PlayerCard } from '../../components/PlayerCard'
import { StaffCard } from '../../components/StaffCard'
import { club } from '../../data/club'
import { useTeamSheetData } from '../../sheet/TeamSheetProvider'

export function TeamSpelers() {
  const { team } = useOutletContext<TeamOutletContext>()
  const { players, staff, source, loading, ploeg } = useTeamSheetData()
  const season = ploeg.season ?? club.season

  return (
    <div className="page-shell">
      <SectionHeader
        eyebrow={`Team · Seizoen ${season}`}
        title="Onze spelers"
        subtitle={`De beren van ${ploeg.name ?? team.name} · seizoen ${season} — ${players.length} spelers met elk hun eigen vibe.`}
      />

      {loading && (
        <p className="mb-4 text-sm text-muted">Selectie laden uit Beheer…</p>
      )}

      <div className="mb-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {players.map((p, i) => (
          <PlayerCard key={p.id} player={p} index={i} />
        ))}
      </div>

      {staff.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-ink-soft p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-cream">Staff</h2>
          <p className="mt-1 text-sm text-muted">
            De coaches en afgevaardigde houden de beren scherp (en op tijd). Tik of
            focus voor hun go-to move!
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {staff.map((s, i) => (
              <StaffCard key={s.id} staff={s} index={i} compact />
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        {source === 'live'
          ? 'Live selectie uit Beheer-sheet · tik een kaart voor geluid · deel van '
          : 'Demo-selectie · tik een kaart voor geluid · deel van '}
        <span className="font-semibold text-cream">Leuven Bears Academy</span>
      </p>
    </div>
  )
}
