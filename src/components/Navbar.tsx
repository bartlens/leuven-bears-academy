import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { club } from '../data/club'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/teams', label: 'Teams' },
  { to: '/nieuws', label: 'Nieuws' },
  { to: '/events', label: 'Events' },
  { to: '/lbow', label: 'LBOW' },
  { to: '/faq', label: 'FAQ' },
  { to: '/info', label: 'Info' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-ink/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <NavLink
          to="/"
          className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
          onClick={() => setOpen(false)}
        >
          <Logo size={64} className="shrink-0" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-sm font-bold tracking-wide text-cream sm:text-base">
              {club.name}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hoop">
              Seizoen {club.season}
            </p>
          </div>
        </NavLink>

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
        </ul>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-panel text-cream touch-manipulation lg:hidden"
          aria-label={open ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-lg" aria-hidden>
            {open ? '✕' : '☰'}
          </span>
        </button>
      </nav>

      {open && (
        <ul className="max-h-[min(70vh,28rem)] overflow-y-auto border-t border-white/8 bg-ink-soft px-3 py-2 lg:hidden">
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
