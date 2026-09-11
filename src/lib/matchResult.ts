import type { TeamMatch } from '../data/teamMatches'

export type MatchResultLetter = 'W' | 'L' | 'D'

export type ParsedMatchScore = {
  home: number
  away: number
}

export type ResolvedMatchResult = {
  us: number
  them: number
  result: MatchResultLetter
}

/**
 * Parse VBL `uitslag` (or sheet `score_wij-score_zij`) into two integers.
 * Handles spacing and forfeit suffixes, e.g. `"77- 88"`, `"20-  0  BFOR"`.
 */
export function parseMatchScore(score: string): ParsedMatchScore | null {
  const nums = score.match(/\d+/g)
  if (!nums || nums.length < 2) return null
  const home = Number(nums[0])
  const away = Number(nums[1])
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null
  return { home, away }
}

function letter(us: number, them: number): MatchResultLetter {
  if (us > them) return 'W'
  if (us < them) return 'L'
  return 'D'
}

/**
 * Resolve OUR score vs THEIR score.
 *
 * VBL convention: score is home–away (thuisploeg – uitploeg).
 * Sheet extras store score already as wij–zij — skip venue swap when
 * `source === 'sheet'`.
 */
export function resolveMatchResult(
  match: Pick<TeamMatch, 'score' | 'venue'> &
    Partial<Pick<TeamMatch, 'source'>>,
): ResolvedMatchResult | null {
  if (!match.score) return null
  const parsed = parseMatchScore(match.score)
  if (!parsed) return null

  // Sheet extras: already us–them
  if (match.source === 'sheet') {
    const us = parsed.home
    const them = parsed.away
    return { us, them, result: letter(us, them) }
  }

  if (match.venue === 'thuis') {
    const us = parsed.home
    const them = parsed.away
    return { us, them, result: letter(us, them) }
  }

  if (match.venue === 'uit') {
    const us = parsed.away
    const them = parsed.home
    return { us, them, result: letter(us, them) }
  }

  // venue unknown — cannot map home/away to us/them reliably
  return null
}
