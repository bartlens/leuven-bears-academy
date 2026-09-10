import { NavLink, useParams } from 'react-router-dom'

const links = [
  { path: '', label: 'Home', end: true },
  { path: 'spelers', label: 'Spelers' },
  { path: 'trainingen', label: 'Trainingen' },
  { path: 'matchen', label: 'Matchen' },
  { path: 'kalender', label: 'Kalender' },
  { path: 'evenementen', label: 'Evenementen' },
  { path: 'info', label: 'Info' },
] as const

export function TeamSubNav() {
  const { slug } = useParams()
  const base = `/team/${slug}`

  return (
    <nav
      aria-label="Ploegnavigatie"
      className="sticky top-[3.6rem] z-40 border-b border-white/8 bg-ink/90 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => {
          const to = link.path ? `${base}/${link.path}` : base
          return (
            <li key={link.label} className="shrink-0">
              <NavLink
                to={to}
                end={"end" in link ? link.end : false}
                className={({ isActive }) =>
                  `inline-flex min-h-9 items-center rounded-full px-3.5 py-2 text-sm font-semibold transition-all touch-manipulation ${
                    isActive
                      ? 'bg-hoop text-white shadow-lg shadow-hoop/30'
                      : 'text-muted hover:bg-white/5 hover:text-cream'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
