import { SectionHeader } from '../components/SectionHeader'
import { TeamCard } from '../components/TeamCard'
import { groupLabels, groupOrder, teamsByGroup } from '../data/teams'

export function Teams() {
  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-12 sm:px-6">
      <SectionHeader
        eyebrow="Ploegen"
        title="Academy-teams"
        subtitle="Van Future Bears tot seniors, rolstoelbasket en BB4FUN — alle Academy-ploegen behalve de professionele A-ploeg."
      />

      <div className="space-y-12">
        {groupOrder.map((group) => {
          const list = teamsByGroup(group)
          if (!list.length) return null
          return (
            <section key={group} id={group}>
              <h2 className="mb-4 font-display text-xl font-bold text-cream sm:text-2xl">
                {groupLabels[group]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((team) => (
                  <TeamCard key={team.slug} team={team} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
