import { Link, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { club } from '../data/club'

export function Footer() {
  const { pathname } = useLocation()
  const teamSlugMatch = pathname.match(/^\/team\/([^/]+)/)
  const onTeam = Boolean(teamSlugMatch)
  const teamInfoTo = teamSlugMatch ? `/team/${teamSlugMatch[1]}/info` : '/info'

  return (
    <footer className="mt-auto border-t border-white/8 bg-ink-soft">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
        <Logo size={96} />
        <div>
          <p className="font-display text-lg font-bold text-cream">{club.name}</p>
          <p className="mt-1 text-sm text-muted">Seizoen {club.season}</p>
          {onTeam && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-hoop-bright">
              Deze ploeg is deel van Leuven Bears Academy
            </p>
          )}
        </div>
        <p className="max-w-xl rounded-full border border-hoop/40 bg-hoop/10 px-5 py-2 text-sm font-semibold text-hoop-bright">
          #WEBEARS
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <a
            href={club.socials.club}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-cream underline-offset-4 hover:text-hoop-bright hover:underline"
          >
            leuvenbears.be
          </a>
          <a
            href={club.socials.instagram}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-cream underline-offset-4 hover:text-hoop-bright hover:underline"
          >
            Instagram
          </a>
          <a
            href={club.socials.facebook}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-cream underline-offset-4 hover:text-hoop-bright hover:underline"
          >
            Facebook
          </a>
          <Link
            to={teamInfoTo}
            className="font-semibold text-cream underline-offset-4 hover:text-hoop-bright hover:underline"
          >
            Contact
          </Link>
          {onTeam && (
            <Link
              to="/teams"
              className="font-semibold text-cream underline-offset-4 hover:text-hoop-bright hover:underline"
            >
              Alle teams
            </Link>
          )}
        </div>
        <p className="text-xs text-muted/70">
          {club.contact.address}, {club.contact.postalCode} {club.contact.city} ·{' '}
          {club.contact.vat}
        </p>
        <p className="text-xs text-muted/70">
          {teamSlugMatch?.[1] === 'u10-c'
            ? '© Blits BV (Bart, papa van Thomas)'
            : '© Blits BV — Leuven Bears Academy'}
        </p>
      </div>
    </footer>
  )
}
