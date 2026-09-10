import { Link } from 'react-router-dom'
import type { Team } from '../data/teams'

type Props = { team: Team }

export function TeamCard({ team }: Props) {
  return (
    <Link
      to={`/team/${team.slug}`}
      className="card-lift block rounded-3xl border border-white/10 bg-panel/80 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hoop"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-hoop-bright">
        {team.category}
      </p>
      <h3 className="mt-2 font-display text-xl font-bold text-cream">
        {team.name}
      </h3>
      {team.note && (
        <p className="mt-2 line-clamp-2 text-sm text-muted">{team.note}</p>
      )}
      <p className="mt-4 text-sm font-semibold text-warm">Bekijk ploeg →</p>
    </Link>
  )
}
