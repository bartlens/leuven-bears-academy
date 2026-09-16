import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { StaffFigure } from '../../components/StaffFigure'
import { club } from '../../data/club'
import { getUpcomingDatedTrainings } from '../../lib/nextTraining'
import { playStaffClickSound, unlockAudio } from '../../audio/playerClickSound'
import { useTeamSheetData } from '../../sheet/TeamSheetProvider'

const WAVE_MS = 2200

function formatTrainingDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function TeamTrainingen() {
  const { team } = useOutletContext<TeamOutletContext>()
  const {
    weeklyTrainings,
    datedTrainings,
    staff,
    aanwezigheidUrl,
    ploeg,
    infoItems,
  } = useTeamSheetData()

  const activeWeek = weeklyTrainings.filter((w) => w.active)
  const fallbackTrainings = team.trainings ?? []
  const weekCards =
    activeWeek.length > 0
      ? activeWeek.map((w) => ({
          id: w.day,
          day: w.day,
          time: w.start && w.end ? `${w.start}–${w.end}` : w.start,
          location: w.location,
          focus: w.focus,
        }))
      : fallbackTrainings.map((t, i) => ({
          id: `${t.day}-${i}`,
          day: t.day,
          time: t.time ?? '',
          location: t.location ?? '',
          focus: '',
        }))

  const upcomingDated = getUpcomingDatedTrainings(new Date(), datedTrainings)
  const coaches = staff.filter((s) => s.outfit === 'coach')
  const [waving, setWaving] = useState(false)
  const waveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastWaveAt = useRef(0)

  useEffect(() => {
    return () => {
      if (waveTimer.current) clearTimeout(waveTimer.current)
    }
  }, [])

  const triggerCoachWave = useCallback(() => {
    if (coaches.length === 0) return
    const now = performance.now()
    if (now - lastWaveAt.current < 800) return
    lastWaveAt.current = now
    if (waveTimer.current) clearTimeout(waveTimer.current)
    setWaving(true)
    void unlockAudio()
    for (const coach of coaches) playStaffClickSound(coach)
    const dur = prefersReducedMotion() ? 500 : WAVE_MS
    waveTimer.current = setTimeout(() => setWaving(false), dur)
  }, [coaches])

  const onNextKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      triggerCoachWave()
    }
  }

  const whatToBring = infoItems
    .filter((i) => i.kind === 'meebrengen' || i.kind === 'bring')
    .map((i) => i.text)
  const defaultBring = [
    'Sportkledij + indoor basketschoenen',
    'Drinkbus met water',
    'Handdoekje',
    'Goeie goesting 😄',
  ]
  const bring = whatToBring.length > 0 ? whatToBring : defaultBring

  const coachNotes = infoItems
    .filter((i) => i.kind === 'coachnote' || i.kind === 'coach_note')
    .map((i) => i.text)
  const defaultNotes = [
    activeWeek.length > 0
      ? activeWeek
          .map((w) => `${w.day} ${w.start}–${w.end} in ${w.location}`)
          .join('; ') + '.'
      : null,
    'Datums tot de laatste Trainingen_data staan in Beheer; daarna geldt het vaste weekschema.',
    'Bij ziekte of afwezigheid: even de coach of ploegafgevaardigde een seintje geven.',
    'We spelen fair, juichen hard en lachen nog harder. #WEBEARS',
  ].filter(Boolean) as string[]
  const notes = coachNotes.length > 0 ? coachNotes : defaultNotes

  const season = ploeg.season ?? club.season
  const hall = ploeg.hallName ?? team.location ?? club.hall.name

  return (
    <div className="page-shell">
      <SectionHeader
        eyebrow="Schedule"
        title="Trainingen"
        subtitle={`Vaste planning · seizoen ${season}`}
      />

      {weekCards.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {weekCards.map((t, i) => (
            <div
              key={t.id}
              className={`rounded-2xl border px-5 py-4 ${
                i === 0
                  ? 'border-hoop/30 bg-hoop/10'
                  : 'border-white/10 bg-panel'
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-hoop-bright">
                {t.day}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-cream">
                {t.time || '—'}
              </p>
              <p className="mt-1 text-sm text-muted">{t.location}</p>
            </div>
          ))}
        </div>
      )}

      {aanwezigheidUrl && (
        <a
          href={aanwezigheidUrl}
          target="_blank"
          rel="noreferrer"
          className="card-lift mb-8 flex flex-col gap-2 rounded-2xl border border-hoop/35 bg-hoop/10 px-5 py-4 transition hover:bg-hoop/20 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-hoop-bright">
              Aanwezigheid
            </p>
            <p className="mt-1 font-display text-lg font-bold text-cream">
              Spreadsheet wedstrijden + trainingen
            </p>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Ouders en coaches duiden aan- of afwezigheid aan per wedstrijd en
              training.
            </p>
          </div>
          <span className="shrink-0 self-start rounded-full bg-hoop px-4 py-2 text-sm font-bold text-white sm:self-center">
            Openen →
          </span>
        </a>
      )}

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-bold text-cream">
          Aankomende trainingen ({upcomingDated.length})
        </h2>
        {upcomingDated.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-ink-soft px-5 py-6 text-sm text-muted">
            Geen gedateerde trainingen meer in Beheer — daarna geldt het vaste
            weekschema{weekCards.length ? ' hierboven' : ''}.
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingDated.map((t, i) => {
              const isNext = i === 0 && coaches.length > 0
              if (isNext) {
                return (
                  <article
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Eerstvolgende training ${formatTrainingDate(t.dateIso)}. Tik om de coaches te laten zwaaien.`}
                    onClick={triggerCoachWave}
                    onKeyDown={onNextKeyDown}
                    className={`training-next card-lift animate-in relative flex cursor-pointer flex-col gap-2 overflow-hidden rounded-2xl border border-hoop/40 bg-hoop/10 px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-hoop focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:flex-row sm:items-center sm:justify-between ${
                      waving ? 'is-waving' : ''
                    }`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <span className="training-next__glow" aria-hidden="true">
                      <span className="training-next__border-swoosh" />
                    </span>
                    {waving && (
                      <div
                        className="training-coach-pop pointer-events-none absolute inset-0 z-[5] flex items-center justify-center gap-3 overflow-hidden rounded-2xl"
                        aria-hidden="true"
                      >
                        {coaches.map((coach, ci) => (
                          <span
                            key={`${coach.id}-${waving}`}
                            className={`training-coach-pop__fig is-waving ${
                              ci === 0 ? 'from-left' : 'from-right'
                            }`}
                            style={{ animationDelay: `${ci * 0.08}s` }}
                          >
                            <StaffFigure
                              staff={coach}
                              className="training-coach-pop__svg"
                            />
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="relative z-10">
                      <p className="training-next__badge text-[10px] font-bold uppercase tracking-wider text-hoop-bright">
                        Eerstvolgende
                      </p>
                      <p className="mt-0.5 font-display text-lg font-bold text-cream">
                        {formatTrainingDate(t.dateIso)}
                      </p>
                      <p className="text-sm text-muted">
                        {t.time} · {t.location}
                      </p>
                    </div>
                    <span className="relative z-10 self-start rounded-full bg-hoop/25 px-3 py-1 text-xs font-bold uppercase tracking-wide text-hoop-bright sm:self-center">
                      {t.day}
                    </span>
                  </article>
                )
              }
              return (
                <article
                  key={t.id}
                  className="card-lift animate-in flex flex-col gap-2 rounded-2xl border border-white/10 bg-panel px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div>
                    <p className="font-display text-lg font-bold text-cream">
                      {formatTrainingDate(t.dateIso)}
                    </p>
                    <p className="text-sm text-muted">
                      {t.time} · {t.location}
                    </p>
                  </div>
                  <span className="self-start rounded-full bg-hoop/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-hoop-bright sm:self-center">
                    {t.day}
                  </span>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {weekCards.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {weekCards.map((t, i) => (
            <article
              key={`card-${t.id}`}
              className="card-lift animate-in rounded-3xl border border-white/10 bg-panel p-6"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-bold text-cream">{t.day}</h2>
                <span className="rounded-full bg-hoop/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-hoop-bright">
                  Wekelijks
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold text-hoop-bright">{t.time}</p>
              <p className="mt-1 text-muted">{t.location}</p>
              {t.focus && (
                <p className="mt-4 rounded-xl bg-ink/50 px-4 py-3 text-sm text-cream/90">
                  Focus: {t.focus}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-hoop/25 bg-hoop/5 p-6">
          <h3 className="font-display text-lg font-bold text-hoop-bright">
            Wat meebrengen?
          </h3>
          <ul className="mt-4 space-y-2">
            {bring.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-cream/90">
                <span className="text-hoop-bright" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-bear/30 p-6">
          <h3 className="font-display text-lg font-bold text-warm">Coach notes</h3>
          <ul className="mt-4 space-y-3">
            {notes.map((note) => (
              <li key={note} className="text-sm leading-relaxed text-cream/90">
                → {note}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted">Thuiszaal: {hall}</p>
        </section>
      </div>
    </div>
  )
}
