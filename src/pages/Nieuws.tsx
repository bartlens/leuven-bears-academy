import { SectionHeader } from '../components/SectionHeader'
import { NewsCard } from '../components/NewsCard'
import { news } from '../data/news'

export function Nieuws() {
  return (
    <div className="page-shell">
      <SectionHeader
        eyebrow="Club"
        title="Nieuws"
        subtitle="Berichten van Leuven Bears Academy. Korte samenvattingen; volledige teksten kunnen later worden aangevuld."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <NewsCard key={item.slug} item={item} />
        ))}
      </div>
    </div>
  )
}
