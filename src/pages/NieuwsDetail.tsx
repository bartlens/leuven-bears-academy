import { Link, useParams } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { formatNewsDate, getNewsBySlug } from '../data/news'

export function NieuwsDetail() {
  const { slug } = useParams()
  const item = slug ? getNewsBySlug(slug) : undefined

  if (!item) {
    return (
      <div className="page-shell">
        <SectionHeader eyebrow="Nieuws" title="Artikel niet gevonden" />
        <Link to="/nieuws" className="font-semibold text-hoop-bright hover:underline">
          ← Terug naar nieuws
        </Link>
      </div>
    )
  }

  return (
    <div className="page-shell-narrow">
      <Link
        to="/nieuws"
        className="mb-6 inline-flex text-sm font-semibold text-warm hover:text-hoop-bright"
      >
        ← Alle nieuws
      </Link>
      <SectionHeader
        eyebrow={formatNewsDate(item.date)}
        title={item.title}
        subtitle={item.excerpt}
      />
      {item.placeholder && (
        <p className="mb-6 rounded-2xl border border-warm/30 bg-warm/10 px-4 py-3 text-sm text-warm">
          Excerpt / placeholder — volledige artikeltekst nog niet overgenomen van
          de live site.
        </p>
      )}
      <article className="rounded-3xl border border-white/10 bg-panel/80 p-6 sm:p-8">
        {item.body.split('\n\n').map((para, i) => (
          <p key={i} className="mb-4 text-base leading-relaxed text-muted last:mb-0">
            {para}
          </p>
        ))}
      </article>
    </div>
  )
}
