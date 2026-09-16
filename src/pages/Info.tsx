import { SectionHeader } from '../components/SectionHeader'
import { club } from '../data/club'

const usefulLinks = [
  { href: club.socials.club, label: 'leuvenbears.be' },
  { href: club.socials.tickets, label: 'Tickets & shop A-ploeg' },
  { href: club.socials.facebook, label: 'Facebook Jeugd' },
  { href: club.socials.instagram, label: 'Instagram Academy' },
  { href: club.socials.vbl, label: 'Basketbal Vlaanderen' },
  { href: club.socials.aansluiten, label: 'Aansluiten (VBL eID)' },
  { href: club.socials.aansluitenInfo, label: 'Info aansluiten BVL' },
  { href: club.socials.damesLeuven, label: 'Basketclub Dames Leuven' },
]

export function Info() {
  const mapsQuery = encodeURIComponent(club.hall.address)

  return (
    <div className="page-shell">
      <SectionHeader
        eyebrow="Praktisch"
        title="Info & contact"
        subtitle={`Seizoen ${club.season} — bereikbaarheid, zaal en nuttige links. Geen telefoonnummers op deze pagina (niet verzonnen).`}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Contact
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">E-mail</dt>
              <dd>
                <a
                  href={`mailto:${club.contact.email}`}
                  className="font-semibold text-hoop-bright hover:underline"
                >
                  {club.contact.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Adres</dt>
              <dd className="font-semibold text-cream">
                {club.contact.address}
                <br />
                {club.contact.postalCode} {club.contact.city}
              </dd>
            </div>
            <div>
              <dt className="text-muted">BTW</dt>
              <dd className="font-semibold text-cream">{club.contact.vat}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
            Thuiszaal
          </p>
          <h2 className="mt-3 font-display text-xl font-bold text-cream">
            {club.hall.name}
          </h2>
          <p className="mt-2 text-sm text-muted">{club.hall.address}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-warm hover:text-hoop-bright"
          >
            Open in Google Maps →
          </a>
          <div className="mt-6 rounded-2xl border border-hoop/25 bg-hoop/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-hoop-bright">
              Volgende thuisnota
            </p>
            <p className="mt-1 font-semibold text-cream">
              {club.upcomingHome.dateLabel} · {club.upcomingHome.time}
            </p>
          </div>
        </article>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold text-cream">
        Nuttige links
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {usefulLinks.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="card-lift flex items-center justify-between rounded-3xl border border-white/10 bg-panel/60 px-5 py-4 text-sm font-semibold text-cream"
            >
              {l.label}
              <span className="text-hoop-bright" aria-hidden>
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-muted">
        Dames/meisjes: zie Basketclub Dames Leuven —{' '}
        <a
          href={`mailto:${club.socials.damesEmail}`}
          className="text-hoop-bright hover:underline"
        >
          {club.socials.damesEmail}
        </a>
        .
      </p>
    </div>
  )
}
