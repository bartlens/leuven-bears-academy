import { u10cPlayers } from './u10cPlayers'
import type { TeamGroup } from './teams'
import {
  resolvePlayerAppearance,
  type SheetPlayerLook,
} from '../lib/playerAppearance'

export type HairStyle =
  | 'spiky'
  | 'bowl'
  | 'side'
  | 'curly'
  | 'short'
  | 'fluffy'
  | 'long'

export type PlayerMove =
  | 'arm-roll'
  | 'finger-spin'
  | 'between-legs'
  | 'behind-back'
  | 'crossover'
  | 'dunk'
  | 'rebound'
  | 'step-back'
  | 'waist-wrap'
  | 'shoulder-roll'
  | 'layup'
  | 'behind-head'
  | 'spin-move'

export type PlayerLook = {
  hair: string
  skin: string
  hairStyle: HairStyle
  cheek?: string
  eyeStyle?: 'round' | 'soft'
}

/** Sheet-ready player shape (demo until Google Sheets sync). */
export type AcademyPlayer = {
  id: string
  firstName: string
  number: number
  ageGroup: TeamGroup
  teamSlug: string
  label: string
  emoji: string
  accent: 'orange' | 'bear' | 'warm'
  move: PlayerMove
  moveLabel: string
  look: PlayerLook
}

/** Chibi scale by age category (still chibi overall). */
export const AGE_SCALE: Record<TeamGroup, number> = {
  future: 0.72,
  u10: 0.82,
  u12: 0.9,
  u14: 0.98,
  u16: 1.05,
  u18: 1.12,
  u21: 1.18,
  seniors: 1.22,
  wheelchair: 0.95,
  fun: 0.95,
}

export function isTinyKid(ageGroup: TeamGroup): boolean {
  return ageGroup === 'future'
}

function lookFromSheet(appearance: SheetPlayerLook): PlayerLook {
  return {
    hair: appearance.hair,
    skin: appearance.skin,
    hairStyle: appearance.hairStyle as HairStyle,
  }
}

function makePlayer(opts: {
  id: string
  firstName: string
  number: number
  ageGroup: TeamGroup
  teamSlug: string
}): AcademyPlayer {
  const appearance = resolvePlayerAppearance(
    {
      label: 'random',
      emoji: 'random',
      accent: 'random',
      move: 'random',
      hairStyle: 'random',
      hairColor: 'random',
      skinColor: 'random',
    },
    opts.id,
  )
  const accent = (['orange', 'bear', 'warm'].includes(appearance.accent)
    ? appearance.accent
    : 'orange') as AcademyPlayer['accent']
  return {
    id: opts.id,
    firstName: opts.firstName,
    number: opts.number,
    ageGroup: opts.ageGroup,
    teamSlug: opts.teamSlug,
    label: appearance.label,
    emoji: appearance.emoji,
    accent,
    move: appearance.move as PlayerMove,
    moveLabel: appearance.moveLabel,
    look: lookFromSheet(appearance),
  }
}

const OTHER_DEMO: { firstName: string; number: number; ageGroup: TeamGroup; teamSlug: string }[] = [
  // Future / U06–U08 (tiny — can tumble)
  { firstName: 'Milo', number: 3, ageGroup: 'future', teamSlug: 'u06' },
  { firstName: 'Noor', number: 5, ageGroup: 'future', teamSlug: 'u07-a' },
  { firstName: 'Finn', number: 7, ageGroup: 'future', teamSlug: 'u07-b' },
  { firstName: 'Lina', number: 2, ageGroup: 'future', teamSlug: 'u08-a' },
  { firstName: 'Bo', number: 9, ageGroup: 'future', teamSlug: 'u08-b' },
  // U10 (extra beyond C)
  { firstName: 'Lars', number: 4, ageGroup: 'u10', teamSlug: 'u10-a' },
  { firstName: 'Mila', number: 8, ageGroup: 'u10', teamSlug: 'u10-b' },
  // U12
  { firstName: 'Noah', number: 10, ageGroup: 'u12', teamSlug: 'u12-a' },
  { firstName: 'Emma', number: 6, ageGroup: 'u12', teamSlug: 'u12-b' },
  { firstName: 'Vic', number: 14, ageGroup: 'u12', teamSlug: 'u12-c' },
  // U14
  { firstName: 'Jules', number: 11, ageGroup: 'u14', teamSlug: 'u14-a' },
  { firstName: 'Sara', number: 15, ageGroup: 'u14', teamSlug: 'u14-b' },
  { firstName: 'Mats', number: 7, ageGroup: 'u14', teamSlug: 'u14-c' },
  // U16
  { firstName: 'Daan', number: 12, ageGroup: 'u16', teamSlug: 'u16-a' },
  { firstName: 'Lotte', number: 5, ageGroup: 'u16', teamSlug: 'u16-b' },
  // U18
  { firstName: 'Sem', number: 8, ageGroup: 'u18', teamSlug: 'u18-a' },
  { firstName: 'Jade', number: 21, ageGroup: 'u18', teamSlug: 'u18-b' },
  // U21
  { firstName: 'Robin', number: 4, ageGroup: 'u21', teamSlug: 'u21-a' },
  // Seniors
  { firstName: 'Tom', number: 33, ageGroup: 'seniors', teamSlug: 'hse-a' },
  { firstName: 'Anke', number: 9, ageGroup: 'seniors', teamSlug: 'dse-a' },
  // Wheelchair / fun (mid-size)
  { firstName: 'Kobe', number: 1, ageGroup: 'wheelchair', teamSlug: 'lbow-a' },
  { firstName: 'Yara', number: 6, ageGroup: 'wheelchair', teamSlug: 'jbow' },
  { firstName: 'Pim', number: 17, ageGroup: 'fun', teamSlug: 'bb4fun-14' },
]

const u10cDemo: AcademyPlayer[] = u10cPlayers.map((p) =>
  makePlayer({
    id: `u10c-${p.number}`,
    firstName: p.firstName,
    number: p.number,
    ageGroup: 'u10',
    teamSlug: 'u10-c',
  }),
)

const otherDemo: AcademyPlayer[] = OTHER_DEMO.map((p) =>
  makePlayer({
    id: `${p.teamSlug}-${p.number}-${p.firstName.toLowerCase()}`,
    firstName: p.firstName,
    number: p.number,
    ageGroup: p.ageGroup,
    teamSlug: p.teamSlug,
  }),
)

/** Curated academy-wide demo roster (~35). Sheets can replace later. */
export const demoPlayers: AcademyPlayer[] = [...u10cDemo, ...otherDemo]

const FILLER_NAMES = [
  'Alex',
  'Ben',
  'Cato',
  'Dirk',
  'Els',
  'Fien',
  'Gijs',
  'Hanne',
  'Iben',
  'Jef',
]

/** Players for one team hub (demo roster, or generated fillers). */
export function getDemoPlayersForTeam(
  teamSlug: string,
  ageGroup: TeamGroup,
): AcademyPlayer[] {
  const named = demoPlayers.filter((p) => p.teamSlug === teamSlug)
  if (named.length > 0) return named

  const count = ageGroup === 'future' ? 6 : 5
  return Array.from({ length: count }, (_, i) =>
    makePlayer({
      id: `fill-${teamSlug}-${i + 1}`,
      firstName: FILLER_NAMES[i % FILLER_NAMES.length]!,
      number: i + 1,
      ageGroup,
      teamSlug,
    }),
  )
}
