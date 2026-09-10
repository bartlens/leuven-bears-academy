import { useOutletContext } from 'react-router-dom'
import type { TeamOutletContext } from './TeamLayout'
import { SectionHeader } from '../../components/SectionHeader'
import { u10cPlayers, u10cSiteSpelersUrl } from '../../data/u10cPlayers'
import { resolvePlayerEmoji } from '../../lib/playerEmoji'

export function TeamSpelers() {
  const { team } = useOutletContext<TeamOutletContext>()
  const isU10c = team.slug === 'u10-c'

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow="Selectie"
        title="Spelers"
        subtitle={
          isU10c
            ? 'Voornamen & nummers van de U10 C-ploeg (bron: leuvenbears-u10c.be). Emoji: random tot de sheet live is.'
            : `Spelerslijst voor ${team.name}. Zet emoji op "random" in de sheet voor een automatische keuze.`
        }
      />

      {isU10c ? (
        <>
          <div className="mb-6 rounded-2xl border border-hoop/30 bg-hoop/10 px-5 py-4">
            <p className="text-sm text-cream/90">
              Volledige selectiepagina met kaarten staat op de eigen U10 C-site.
            </p>
            <a
              href={u10cSiteSpelersUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-bold text-hoop-bright hover:underline"
            >
              Open spelers op leuvenbears-u10c.be →
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {u10cPlayers.map((p, i) => {
              const emoji = resolvePlayerEmoji('random', p.number)
              return (
                <article
                  key={p.number}
                  className="card-lift animate-in flex items-center gap-4 rounded-2xl border border-white/10 bg-panel p-4"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-hoop/20 text-2xl">
                    {emoji}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-hoop-bright">#{p.number}</p>
                    <p className="font-display text-lg font-bold text-cream">{p.firstName}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-white/15 bg-ink-soft px-5 py-8 text-sm text-muted">
          Spelerslijst komt spoedig / nog niet gepubliceerd op de oude site. In de sheet kun je bij emoji
          {' '}
          <code className="text-warm">random</code>
          {' '}
          kiezen — dan pikt de site een vaste emoji uit de pool.
        </p>
      )}
    </div>
  )
}
