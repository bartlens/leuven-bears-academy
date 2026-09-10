/** Pool used when sheet emoji is "random" (or empty). */
export const PLAYER_EMOJI_POOL = [
  '⚡',
  '🐻',
  '🏀',
  '🙌',
  '⭐',
  '💪',
  '🎯',
  '😎',
  '✨',
  '🛡️',
  '👟',
  '🏆',
  '🔥',
  '🚀',
  '😄',
] as const

/** Stable pick from pool (same player → same emoji across renders). */
export function resolvePlayerEmoji(
  emoji: string | undefined | null,
  seed: string | number,
): string {
  const raw = (emoji ?? '').trim()
  if (raw && raw.toLowerCase() !== 'random') return raw

  const pool = PLAYER_EMOJI_POOL
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return pool[h % pool.length]!
}
