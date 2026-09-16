import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { HeroTitlePeek } from '../components/HeroTitlePeek'
import { demoPlayers } from '../data/demoPlayers'
import { NewsCard } from '../components/NewsCard'
import { club } from '../data/club'
import { news } from '../data/news'

const quickLinks = [
  { to: '/teams', label: 'Teams', emoji: '🏀', desc: 'Alle Academy-ploegen' },
  { to: '/nieuws', label: 'Nieuws', emoji: '📰', desc: 'Clubberichten' },
  { to: '/events', label: 'Events', emoji: '🎉', desc: 'Fun & fundraisers' },
  { to: '/lbow', label: 'LBOW', emoji: '♿', desc: 'Rolstoelbasket' },
  { to: '/faq', label: 'FAQ', emoji: '❓', desc: 'Veelgestelde vragen' },
  { to: '/info', label: 'Info', emoji: '📍', desc: 'Contact & zalen' },
]

export function Home() {
  const latestNews = news.slice(0, 3)

  return (
    <div className="overflow-x-hidden">
      <section className="hero-cinematic overflow-x-hidden grain mesh-grid">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:py-16">
          <div className="min-w-0 animate-in">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-hoop/40 bg-hoop/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-hoop-bright">
              Seizoen {club.season}
            </span>
            <HeroTitlePeek name="Leuven Bears" category="Academy" players={demoPlayers} />
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {club.mission}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/teams"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-hoop px-6 py-3 text-sm font-bold text-white shadow-lg shadow-hoop/35 transition hover:bg-hoop-bright"
              >
                Bekijk teams
              </Link>
              <Link
                to="/info"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-cream transition hover:border-hoop/40 hover:bg-hoop/10"
              >
                Contact
              </Link>
            </div>
          </div>

          <div
            className="relative flex justify-center animate-in"
            style={{ animationDelay: '0.12s' }}
          >
            <div className="emblem-stage relative w-full max-w-sm rounded-[1.75rem] border border-white/12 bg-panel/85 p-5 shadow-[0_24px_80px_-20px_rgba(243,128,25,0.45)] backdrop-blur sm:p-6">
              <Logo size={200} className="relative z-10 mx-auto" />
              <p className="relative z-10 mt-3 text-center text-sm text-muted">
                {club.tagline}
              </p>
              <div className="relative z-10 mt-5 rounded-2xl border border-hoop/30 bg-hoop/10 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-hoop-bright">
                  Opkomende thuiswedstrijden
                </p>
                <p className="mt-1 font-semibold text-cream">
                  {club.upcomingHome.dateLabel} · {club.upcomingHome.time}
                </p>
                <p className="text-sm text-muted">{club.upcomingHome.venue}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="card-lift overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-panel to-ink-soft">
          <div className="flex h-full flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-hoop-bright">
                Thuis · Wilsele
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold text-cream sm:text-3xl">
                Zaterdag 12/09/2026 · 09:00
              </h2>
              <p className="mt-1.5 text-muted">{club.hall.name}</p>
            </div>
            <Link
              to="/events"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-hoop px-5 py-3 text-sm font-bold text-white transition hover:bg-hoop-bright"
            >
              Alle events →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-hoop-bright">
          Snel naar
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="card-lift flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-panel/60 p-4"
            >
              <span className="text-2xl" aria-hidden>
                {q.emoji}
              </span>
              <div>
                <p className="font-display font-bold text-cream">{q.label}</p>
                <p className="text-sm text-muted">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-hoop-bright">
              Nieuws
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-cream sm:text-3xl">
              Laatste berichten
            </h2>
          </div>
          <Link
            to="/nieuws"
            className="text-sm font-semibold text-warm hover:text-hoop-bright"
          >
            Alle nieuws →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latestNews.map((item) => (
            <NewsCard key={item.slug} item={item} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="rounded-[1.75rem] border border-hoop/30 bg-gradient-to-br from-hoop/20 via-panel to-ink-soft p-7 text-center sm:p-8">
          <h2 className="font-display text-2xl font-bold text-cream sm:text-3xl">
            Lid worden of vragen?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Mail {club.contact.email} of bekijk de FAQ voor aansluiting,
            trainingen en tickets.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:${club.contact.email}`}
              className="inline-flex min-h-11 items-center rounded-full bg-hoop px-6 py-3 text-sm font-bold text-white hover:bg-hoop-bright"
            >
              Mail Academy
            </a>
            <Link
              to="/faq"
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-cream hover:border-hoop/40"
            >
              FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
