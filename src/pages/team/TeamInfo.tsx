import { Link, useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { StaffCard } from '../../components/StaffCard'
import { club } from '../../data/club'
import { groupLabels } from '../../data/teams'
import { getVblTeam } from '../../data/vblTeams'
import { useTeamSheetData } from '../../sheet/TeamSheetProvider'

export function TeamInfo() {
  const { team } = useOutletContext<TeamOutletContext>()
  const {
    beheerUrl,
    aanwezigheidUrl,
    source,
    staff,
    infoItems,
    afspraken,
    herfststage,
    ploeg,
  } = useTeamSheetData()

  const tips = infoItems.filter((i) => i.kind === 'tip')
  const links = infoItems.filter((i) => i.kind === 'link')
  const hasAfspraken =
    afspraken.bullets.length > 0 || afspraken.draaischema.bullets.length > 0
  const hallName = ploeg.hallName ?? team.location ?? club.hall.name
  const hallAddress = ploeg.hallAddress ?? club.hall.address
  const season = ploeg.season ?? club.season
  const mapsQuery = encodeURIComponent(`${hallName}, ${hallAddress}`)
  const vbl = getVblTeam(team.slug)
  const rich = staff.length > 0 || infoItems.length > 0 || herfststage

  if (!rich) {
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
                  href={`mailto:${ploeg.contactEmail ?? club.contact.email}`}
                  className="font-semibold text-hoop-bright hover:underline"
                >
                  {ploeg.contactEmail ?? club.contact.email}
                </a>
              </li>
              <li>
                Thuiszaal: <span className="text-cream">{hallName}</span>
              </li>
              <li>
                Adres: <span className="text-cream">{hallAddress}</span>
              </li>
            </ul>
          </article>
          {(beheerUrl || aanwezigheidUrl) && (
            <article className="rounded-3xl border border-hoop/25 bg-hoop/10 p-6 sm:p-8 lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
                Google Sheets (ploeg)
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {beheerUrl && (
                  <li>
                    <a
                      href={beheerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-hoop-bright hover:underline"
                    >
                      Beheer-sheet openen →
                    </a>
                  </li>
                )}
                {aanwezigheidUrl && (
                  <li>
                    <a
                      href={aanwezigheidUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-hoop-bright hover:underline"
                    >
                      Aanwezigheid-sheet openen →
                    </a>
                  </li>
                )}
              </ul>
            </article>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-12 sm:px-6">
      <SectionHeader
        eyebrow="Praktisch"
        title="Info voor ouders"
        subtitle={`Alles voor Leuven Bears ${ploeg.name ?? team.name} — coaches, zaal en clubcontact. Seizoen ${season}.`}
      />

      {staff.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {staff.map((s, i) => (
            <StaffCard key={s.id} staff={s} index={i} />
          ))}
        </div>
      )}

      {herfststage && (
        <article className="mb-8 rounded-3xl border border-warm/35 bg-gradient-to-br from-warm/15 via-panel to-ink-soft p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm">
            Stage
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-cream">
            {herfststage.title}
          </h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
            {herfststage.tariff && (
              <div className="rounded-2xl border border-white/10 bg-ink/40 px-4 py-3">
                <dt className="text-muted">Tarief herfststage</dt>
                <dd className="mt-1 font-display text-xl font-bold text-cream">
                  {herfststage.tariff}
                </dd>
              </div>
            )}
            {herfststage.iban && (
              <div className="rounded-2xl border border-white/10 bg-ink/40 px-4 py-3">
                <dt className="text-muted">Overschrijven naar</dt>
                <dd className="mt-1 break-all font-semibold tracking-wide text-cream">
                  {herfststage.iban}
                </dd>
              </div>
            )}
            {herfststage.mededeling && (
              <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-ink/40 px-4 py-3">
                <dt className="text-muted">Mededeling / referentie</dt>
                <dd className="mt-1 break-words font-semibold text-hoop-bright">
                  {herfststage.mededeling}
                </dd>
              </div>
            )}
          </dl>
          {herfststage.notes.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-cream/90">
              {herfststage.notes.map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="text-warm" aria-hidden>
                    ●
                  </span>
                  {n}
                </li>
              ))}
            </ul>
          )}
          {herfststage.formUrl && (
            <a
              href={herfststage.formUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full bg-warm px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-110"
            >
              Inschrijfformulier openen →
            </a>
          )}
        </article>
      )}

      {aanwezigheidUrl && (
        <article className="mb-8 rounded-3xl border border-hoop/30 bg-gradient-to-br from-hoop/10 to-panel p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Praktisch
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-cream">
            Aanwezigheid (wedstrijden + trainingen)
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            De Google Spreadsheet is de bron voor aanwezigheid. Ouders en coaches
            duiden aan- of afwezigheid aan per wedstrijd en training.
            {source === 'live' ? ' Live verbonden met Beheer.' : ''}
          </p>
          <a
            href={aanwezigheidUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full border border-hoop/40 bg-hoop/15 px-5 py-2.5 text-sm font-bold text-hoop-bright transition hover:bg-hoop/25"
          >
            Open aanwezigheid spreadsheet →
          </a>
        </article>
      )}

      {hasAfspraken && (
        <article className="mb-8 rounded-3xl border border-white/10 bg-ink-soft p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Wedstrijden
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-cream">
            {afspraken.title}
          </h2>
          <ul className="mt-4 space-y-2">
            {afspraken.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm leading-relaxed text-cream/90">
                <span className="shrink-0 text-hoop-bright" aria-hidden>
                  ●
                </span>
                {b}
              </li>
            ))}
          </ul>
          {afspraken.draaischema.bullets.length > 0 && (
            <>
              <h3 className="mt-6 font-display text-lg font-bold text-warm">
                {afspraken.draaischema.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {afspraken.draaischema.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-3 text-sm leading-relaxed text-cream/90"
                  >
                    <span className="shrink-0 text-warm" aria-hidden>
                      →
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="card-lift rounded-3xl border border-hoop/30 bg-gradient-to-br from-hoop/15 to-panel p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Contact
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-cream">
            Clubsecretariaat
          </h2>
          <p className="text-sm text-muted">Leuven Bears</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Secretariaat</dt>
              <dd>
                <a
                  href={`mailto:${ploeg.contactEmail ?? club.contact.email}`}
                  className="break-all font-semibold text-cream hover:text-hoop-bright"
                >
                  {ploeg.contactEmail ?? club.contact.email}
                </a>
              </dd>
            </div>
            {staff.length > 0 && (
              <div>
                <dt className="text-muted">Teamcontact</dt>
                <dd className="font-semibold text-cream">
                  {staff.map((s) => s.name.split(' ')[0]).join(' · ')}
                </dd>
              </div>
            )}
          </dl>
        </article>

        <article className="card-lift rounded-3xl border border-white/10 bg-gradient-to-br from-bear/40 to-panel p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm">
            Thuiszaal
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-cream">
            {hallName}
          </h2>
          <p className="mt-3 text-cream">{hallAddress}</p>
          <a
            href={`https://maps.google.com/?q=${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full border border-hoop/40 bg-hoop/10 px-4 py-2 text-sm font-bold text-hoop-bright transition hover:bg-hoop/20"
          >
            Open in Maps →
          </a>
        </article>
      </div>

      {(links.length > 0 || beheerUrl || vbl) && (
        <section className="mt-8 rounded-3xl border border-white/10 bg-ink-soft p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-cream">
            Handige links
          </h2>
          <ul className="mt-4 flex flex-wrap gap-3 text-sm">
            {links.map((item) =>
              item.link ? (
                <li key={`${item.title}-${item.link}`}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-white/15 bg-panel px-4 py-2 font-semibold text-cream hover:border-hoop/40 hover:text-hoop-bright"
                  >
                    {item.title}
                  </a>
                </li>
              ) : null,
            )}
            <li>
              <Link
                to="/teams"
                className="inline-flex rounded-full border border-white/15 bg-panel px-4 py-2 font-semibold text-cream hover:border-hoop/40 hover:text-hoop-bright"
              >
                Alle Academy-teams
              </Link>
            </li>
          </ul>
        </section>
      )}

      {tips.length > 0 && (
        <section className="mt-8 rounded-3xl border border-white/10 bg-ink-soft p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-cream">
            Tips voor ouders
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {tips.map((tip) => (
              <li
                key={tip.text}
                className="rounded-2xl border border-white/8 bg-panel/60 px-4 py-3 text-sm leading-relaxed text-muted"
              >
                <span className="mr-2 text-hoop-bright" aria-hidden>
                  ●
                </span>
                {tip.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
