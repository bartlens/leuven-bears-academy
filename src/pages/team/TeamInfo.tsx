import { Link, useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { club } from '../../data/club'
import { groupLabels } from '../../data/teams'

export function TeamInfo() {
  const { team } = useOutletContext<TeamOutletContext>()

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow="Praktisch"
        title="Info"
        subtitle={`Contact en nuttige links voor ${team.name}.`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Ploeg
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Naam</dt>
              <dd className="font-semibold text-cream">{team.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Categorie</dt>
              <dd className="font-semibold text-cream">{team.category}</dd>
            </div>
            <div>
              <dt className="text-muted">Groep</dt>
              <dd className="font-semibold text-cream">{groupLabels[team.group]}</dd>
            </div>
            {team.note && (
              <div>
                <dt className="text-muted">Nota</dt>
                <dd className="text-cream/90">{team.note}</dd>
              </div>
            )}
          </dl>
        </article>

        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Contact & zaal
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              E-mail:{' '}
              <a
                href={`mailto:${club.contact.email}`}
                className="font-semibold text-hoop-bright hover:underline"
              >
                {club.contact.email}
              </a>
            </li>
            <li>
              Thuiszaal:{' '}
              <span className="text-cream">{team.location ?? club.hall.name}</span>
            </li>
            <li>
              Adres:{' '}
              <span className="text-cream">{club.hall.address}</span>
            </li>
            <li>
              Seizoen: <span className="text-cream">{club.season}</span>
            </li>
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Nuttige links
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/teams" className="font-semibold text-hoop-bright hover:underline">
                ← Alle Academy-teams
              </Link>
            </li>
            <li>
              <a
                href={club.socials.tickets}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-hoop-bright hover:underline"
              >
                Tickets A-ploeg (ordering.be) →
              </a>
            </li>
            <li>
              <a
                href={club.socials.club}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-hoop-bright hover:underline"
              >
                leuvenbears.be →
              </a>
            </li>
            <li>
              <a
                href={club.socials.vbl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-hoop-bright hover:underline"
              >
                Basketbal Vlaanderen →
              </a>
            </li>
            {team.slug === 'u10-c' && (
              <li>
                <a
                  href="https://www.leuvenbears-u10c.be/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-hoop-bright hover:underline"
                >
                  Eigen U10 C-site →
                </a>
              </li>
            )}
          </ul>
        </article>
      </div>
    </div>
  )
}
