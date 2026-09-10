import { useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { club } from '../../data/club'

export function TeamTrainingen() {
  const { team } = useOutletContext<TeamOutletContext>()
  const trainings = team.trainings ?? []
  const coaches = team.coaches ?? []

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow="Op de training"
        title="Trainingen"
        subtitle={`Trainingsinfo voor ${team.name}. Alleen wat op de oude Academy-site stond — we verzinnen geen uren.`}
      />

      {trainings.length > 0 ? (
        <div className="space-y-3">
          {trainings.map((t, i) => (
            <article
              key={`${t.day}-${t.time ?? ''}-${i}`}
              className="card-lift rounded-2xl border border-white/10 bg-panel p-5"
            >
              <p className="font-display text-lg font-bold text-cream">{t.day}</p>
              {t.time && <p className="mt-1 text-sm text-hoop-bright">{t.time}</p>}
              {t.location && <p className="text-sm text-muted">{t.location}</p>}
              {!t.day && t.raw && <p className="text-sm text-muted">{t.raw}</p>}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-white/15 bg-ink-soft px-5 py-8 text-sm text-muted">
          {team.trainingNote ?? 'Nog geen trainingsinfo op de oude site'}
        </p>
      )}

      {coaches.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold text-cream">Coaches & staf</h2>
          <ul className="space-y-2 rounded-2xl border border-white/10 bg-panel p-5 text-sm text-muted">
            {coaches.map((c) => (
              <li key={`${c.name}-${c.role ?? ''}`}>
                <span className="text-cream">{c.name}</span>
                {c.role ? ` — ${c.role}` : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-sm text-muted">
        Vragen over training?{' '}
        <a
          href={`mailto:${club.contact.email}`}
          className="font-semibold text-hoop-bright hover:underline"
        >
          {club.contact.email}
        </a>
      </p>
    </div>
  )
}
