import { Link } from 'react-router-dom'
import { formatNewsDate, type NewsItem } from '../data/news'

type Props = { item: NewsItem }

export function NewsCard({ item }: Props) {
  return (
    <Link
      to={`/nieuws/${item.slug}`}
      className="card-lift flex h-full flex-col rounded-3xl border border-white/10 bg-panel/80 p-5 sm:p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hoop"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-hoop-bright">
        {formatNewsDate(item.date)}
      </p>
      <h3 className="mt-2 font-display text-lg font-bold text-cream sm:text-xl">
        {item.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {item.excerpt}
      </p>
      <p className="mt-4 text-sm font-semibold text-warm">Lees meer →</p>
    </Link>
  )
}
