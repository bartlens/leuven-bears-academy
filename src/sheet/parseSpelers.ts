import {
  type AcademyPlayer,
  type HairStyle,
  type PlayerMove,
} from '../data/demoPlayers'
import type { TeamGroup } from '../data/teams'
import { resolvePlayerAppearance } from '../lib/playerAppearance'
import { csvToObjects } from './csv'


function lookFromAppearance(
  appearance: ReturnType<typeof resolvePlayerAppearance>,
  firstName: string,
) {
  const look: {
    hair: string
    skin: string
    hairStyle: HairStyle
    eyeStyle?: 'soft'
    cheek?: string
  } = {
    hair: appearance.hair,
    skin: appearance.skin,
    hairStyle: appearance.hairStyle as HairStyle,
  }
  if (/jia\s*le/i.test(firstName)) {
    look.eyeStyle = 'soft'
    look.cheek = '#e8a090'
  }
  return look
}

/** Parse Beheer tab Spelers CSV → AcademyPlayer[]. */
export function parseSpelersCsv(
  csvText: string,
  opts: { teamSlug: string; ageGroup: TeamGroup },
): AcademyPlayer[] {
  const rows = csvToObjects(csvText)
  const players: AcademyPlayer[] = []

  for (const row of rows) {
    const firstName = (row.voornaam ?? '').trim()
    const number = Number.parseInt(row.nummer ?? '', 10)
    if (!firstName || !Number.isFinite(number)) continue

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

    players.push({
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
      look: lookFromAppearance(appearance, firstName),
    })
  }

  // Order = jersey number (no separate volgorde column)
  return players.sort((a, b) => a.number - b.number)
}
