import { resolvePlayerEmoji } from './playerEmoji'

export const HAIR_COLOR_HEX: Record<string, string> = {
  'blond-goud': '#d4b45a',
  'blond-warm': '#e6c870',
  'blond-licht': '#f0d078',
  'blond-bleek': '#ffe8a8',
  'blond-brons': '#c9a84a',
  'blond-zacht': '#edd98a',
  'blond-creme': '#fff1c2',
  'blond-honing': '#dcc06e',
  platina: '#e8e4d4',
  asblond: '#c4b896',
  bruin: '#5c3d24',
  kastanje: '#6b3a2a',
  donkerbruin: '#1f1410',
  zwart: '#1a1a1a',
  roodbruin: '#8b4513',
  rood: '#c23b22',
  grijs: '#9aa3ab',
  wit: '#f2f0ea',
}

export const SKIN_COLOR_HEX: Record<string, string> = {
  'zeer-licht': '#f8d4b8',
  licht: '#f5c7a1',
  'warm-licht': '#e8c4a0',
  'warm-medium': '#e8b48a',
  perzik: '#efc09a',
  'licht-perzik': '#f2c9a8',
  zand: '#e0b088',
  abrikoos: '#f0c4a0',
  creme: '#fadcc4',
  'perzik-warm': '#ebc09a',
  'blush-licht': '#f6d0b0',
  honinghuid: '#eec4a2',
  medium: '#d2a679',
  olijf: '#c4a882',
  goudbruin: '#c68642',
  bruin: '#a06a3a',
  'diep-bruin': '#6b3f2a',
  donker: '#8d5524',
  'zeer-donker': '#3b2214',
}

export const HAIR_STYLES = ['short', 'spiky', 'bowl', 'side', 'curly', 'fluffy', 'long', 'buzz', 'afro'] as const
export const LABELS = ['Guard', 'Forward', 'Center'] as const
export const ACCENTS = ['orange', 'bear', 'warm'] as const
export const MOVES = [
  'arm-roll',
  'finger-spin',
  'between-legs',
  'behind-back',
  'crossover',
  'dunk',
  'rebound',
  'step-back',
  'waist-wrap',
  'shoulder-roll',
  'layup',
  'behind-head',
  'spin-move',
] as const

export const MOVE_LABELS: Record<(typeof MOVES)[number], string> = {
  'arm-roll': 'Arm-roll',
  'finger-spin': 'Vingerspin',
  'between-legs': 'Tussenbenen',
  'behind-back': 'Achterlangs',
  crossover: 'Crossover',
  dunk: 'Dunk',
  rebound: 'Rebound',
  'step-back': 'Step-back',
  'waist-wrap': 'Taille-wrap',
  'shoulder-roll': 'Schouder-roll',
  layup: 'Lay-up',
  'behind-head': 'No-look',
  'spin-move': 'Spin-move',
}

function isRandom(v: string | undefined | null) {
  return !v || v.trim() === '' || v.trim().toLowerCase() === 'random'
}

function stableIndex(seed: string | number, modulo: number) {
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % modulo
}

function pick<T extends string>(pool: readonly T[], seed: string | number, salt: string): T {
  return pool[stableIndex(`${seed}:${salt}`, pool.length)]!
}

export type SheetPlayerLook = {
  label: string
  emoji: string
  accent: string
  move: string
  moveLabel: string
  hairStyle: string
  hair: string
  skin: string
}

/** Resolve sheet values (names / random) → concrete look for the site. */
export function resolvePlayerAppearance(
  input: {
    label?: string
    emoji?: string
    accent?: string
    move?: string
    hairStyle?: string
    hairColor?: string
    skinColor?: string
  },
  seed: string | number,
): SheetPlayerLook {
  const label = isRandom(input.label) ? pick(LABELS, seed, 'label') : String(input.label)
  const accent = isRandom(input.accent) ? pick(ACCENTS, seed, 'accent') : String(input.accent)
  const move = isRandom(input.move)
    ? pick(MOVES, seed, 'move')
    : (String(input.move) as (typeof MOVES)[number])
  const moveLabel =
    MOVE_LABELS[move as (typeof MOVES)[number]] ?? String(move)
  const hairStyle = isRandom(input.hairStyle)
    ? pick(HAIR_STYLES, seed, 'hairStyle')
    : String(input.hairStyle)

  let hairKey = String(input.hairColor ?? '').trim().toLowerCase()
  if (isRandom(hairKey)) hairKey = pick(Object.keys(HAIR_COLOR_HEX), seed, 'hair')
  const hair = HAIR_COLOR_HEX[hairKey] ?? (hairKey.startsWith('#') ? hairKey : '#d4b45a')

  let skinKey = String(input.skinColor ?? '').trim().toLowerCase()
  if (isRandom(skinKey)) skinKey = pick(Object.keys(SKIN_COLOR_HEX), seed, 'skin')
  const skin = SKIN_COLOR_HEX[skinKey] ?? (skinKey.startsWith('#') ? skinKey : '#e8b48a')

  return {
    label,
    emoji: resolvePlayerEmoji(input.emoji, seed),
    accent,
    move,
    moveLabel,
    hairStyle,
    hair,
    skin,
  }
}
