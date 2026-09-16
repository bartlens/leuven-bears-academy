import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { MuteButton } from './MuteButton'
import { getTeamBySlug } from '../data/teams'

const sectionLinks = [
  { path: '', label: 'Home', end: true },
  { path: 'spelers', label: 'Spelers' },
  { path: 'trainingen', label: 'Trainingen' },
  { path: 'matchen', label: 'Matchen' },
  { path: 'kalender', label: 'Kalender' },
  { path: 'evenementen', label: 'Evenementen' },
  { path: 'info', label: 'Info' },
] as const

function useTeamSlugFromPath(): string | undefined {
  const { pathname } = useLocation()
  const m = pathname.match(/^\/team\/([^/]+)/)
  return m?.[1]
}

export function TeamNavbar() {
  const [open, setOpen] = useState(false)
  const slug = useTeamSlugFromPath()
  const team = slug ? getTeamBySlug(slug) : undefined
  const base = slug ? `/team/${slug}` : '/teams'

  const links = sectionLinks.map((link) => ({
    to: link.path ? `${base}/${link.path}` : base,
    label: link.label,
    end: 'end' in link ? Boolean(link.end) : false,
  }))

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-ink/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <NavLink
            to={base}
            className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
            onClick={() => setOpen(false)}
          >
            <Logo size={64} className="shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-sm font-bold tracking-wide text-cream sm:text-base">
                Leuven Bears
              </p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-hoop">
                {team?.name ?? 'Academy'}
              </p>
            </div>
          </NavLink>
          <NavLink
            to="/teams"
            onClick={() => setOpen(false)}
            className="ml-1 hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted transition hover:border-hoop/40 hover:text-hoop-bright sm:inline-flex"
            title="Terug naar alle Academy-teams"
          >
            Academy
          </NavLink>
        </div>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-hoop text-white shadow-lg shadow-hoop/30'
                      : 'text-muted hover:bg-white/5 hover:text-cream'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className="ml-1">
            <MuteButton />
          </li>
        </ul>

        <div className="flex items-center gap-2 lg:hidden">
          <MuteButton />
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-panel text-cream touch-manipulation"
            aria-label={open ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-lg" aria-hidden>
              {open ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <ul className="max-h-[min(70vh,28rem)] overflow-y-auto border-t border-white/8 bg-ink-soft px-3 py-2 lg:hidden">
          <li>
            <NavLink
              to="/teams"
              onClick={() => setOpen(false)}
              className="mb-1 block rounded-xl px-4 py-3.5 text-sm font-semibold text-hoop-bright touch-manipulation"
            >
              ← Alle teams (Academy)
            </NavLink>
          </li>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `mb-1 block rounded-xl px-4 py-3.5 text-sm font-semibold touch-manipulation ${
                    isActive
                      ? 'bg-hoop text-white'
                      : 'text-muted active:bg-white/5 active:text-cream'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
