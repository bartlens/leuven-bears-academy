import {
  type AcademyPlayer,
  type HairStyle,
  type PlayerMove,
} from '../data/demoPlayers'
import type { TeamGroup } from '../data/teams'
import { resolvePlayerAppearance } from '../lib/playerAppearance'
import { csvToObjects } from './csv'

function isVisible(raw: string | undefined): boolean {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return true
  return v === 'ja' || v === 'yes' || v === 'true' || v === '1'
}

function lookFromAppearance(appearance: ReturnType<typeof resolvePlayerAppearance>) {
  return {
    hair: appearance.hair,
    skin: appearance.skin,
    hairStyle: appearance.hairStyle as HairStyle,
  }
}

/** Parse Beheer tab Spelers CSV → AcademyPlayer[]. */
export function parseSpelersCsv(
  csvText: string,
  opts: { teamSlug: string; ageGroup: TeamGroup },
): AcademyPlayer[] {
  const rows = csvToObjects(csvText)
  const parsed: { player: AcademyPlayer; order: number }[] = []

  for (const row of rows) {
    const firstName = (row.voornaam ?? '').trim()
    const number = Number.parseInt(row.nummer ?? '', 10)
    if (!firstName || !Number.isFinite(number)) continue
    if (!isVisible(row.zichtbaar)) continue

    const id = `${opts.teamSlug}-${number}`
    const appearance = resolvePlayerAppearance(
      {
        label: row.label,
        emoji: row.emoji,
        accent: row.accent,
        move: row.move,
        hairStyle: row.haarstijl,
        hairColor: row.haarkleur,
        skinColor: row.huidskleur,
      },
      id,
    )

    const accent = (['orange', 'bear', 'warm'].includes(appearance.accent)
      ? appearance.accent
      : 'orange') as AcademyPlayer['accent']

    const orderRaw = Number.parseInt(row.volgorde ?? '', 10)
    const order = Number.isFinite(orderRaw) ? orderRaw : number

    parsed.push({
      order,
      player: {
        id,
        firstName,
        number,
        ageGroup: opts.ageGroup,
        teamSlug: opts.teamSlug,
        label: appearance.label,
        emoji: appearance.emoji,
        accent,
        move: appearance.move as PlayerMove,
        moveLabel: appearance.moveLabel,
        look: lookFromAppearance(appearance),
      },
    })
  }

  return parsed
    .sort((a, b) => a.order - b.order || a.player.number - b.player.number)
    .map((p) => p.player)
}
