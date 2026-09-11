/**
 * Academy slug → Basketbal Vlaanderen (VBL) team GUID.
 * Club: AB InBev Leuven Bears (BVBL1125).
 * GUIDs contain TWO spaces before the letter index, e.g. "BVBL1125G10  3".
 * Encode for TeamMatchesByGuid by collapsing space runs to "++".
 */

export const VBL_CLUB_GUID = 'BVBL1125'
export const VBL_API_BASE =
  'https://vblcb.wisseq.eu/VBLCB_WebService/data'

export type VblTeamMapping = {
  teamGuid: string
  vblName: string
}

/** Encode VBL team GUID for TeamMatchesByGuid query (spaces → ++). */
export function encodeVblTeamGuid(teamGuid: string): string {
  return teamGuid.replace(/ +/g, '++')
}

/**
 * Only academy slugs that exist as VBL competition teams.
 * Teams without a mapping keep sheet/static matches only.
 */
export const vblTeamsBySlug: Record<string, VblTeamMapping> = {
  'u08-a': { teamGuid: 'BVBL1125G08  1', vblName: 'AB InBev Leuven Bears G08 A' },
  'u08-b': { teamGuid: 'BVBL1125G08  2', vblName: 'AB InBev Leuven Bears G08 B' },
  'u10-a': { teamGuid: 'BVBL1125G10  1', vblName: 'AB InBev Leuven Bears G10 A' },
  'u10-b': { teamGuid: 'BVBL1125G10  2', vblName: 'AB InBev Leuven Bears G10 B' },
  'u10-c': { teamGuid: 'BVBL1125G10  3', vblName: 'AB InBev Leuven Bears G10 C' },
  'u10-d': { teamGuid: 'BVBL1125G10  4', vblName: 'AB InBev Leuven Bears G10 D' },
  'u12-a': { teamGuid: 'BVBL1125G12  1', vblName: 'AB InBev Leuven Bears G12 A' },
  'u12-b': { teamGuid: 'BVBL1125G12  2', vblName: 'AB InBev Leuven Bears G12 B' },
  'u12-c': { teamGuid: 'BVBL1125G12  3', vblName: 'AB InBev Leuven Bears G12 C' },
  'u12-d': { teamGuid: 'BVBL1125G12  4', vblName: 'AB InBev Leuven Bears G12 D' },
  'u14-a': { teamGuid: 'BVBL1125G14  1', vblName: 'AB InBev Leuven Bears G14 A' },
  'u14-b': { teamGuid: 'BVBL1125G14  2', vblName: 'AB InBev Leuven Bears G14 B' },
  'u14-c': { teamGuid: 'BVBL1125G14  3', vblName: 'AB InBev Leuven Bears G14 C' },
  'u14-d': { teamGuid: 'BVBL1125G14  4', vblName: 'AB InBev Leuven Bears G14 D' },
  'u16-a': { teamGuid: 'BVBL1125J16  1', vblName: 'AB InBev Leuven Bears J16 A' },
  'u16-b': { teamGuid: 'BVBL1125J16  2', vblName: 'AB InBev Leuven Bears J16 B' },
  'u16-c': { teamGuid: 'BVBL1125J16  3', vblName: 'AB InBev Leuven Bears J16 C' },
  'u16-d': { teamGuid: 'BVBL1125J16  4', vblName: 'AB InBev Leuven Bears J16 D' },
  'u18-a': { teamGuid: 'BVBL1125J18  1', vblName: 'AB InBev Leuven Bears J18 A' },
  'u18-b': { teamGuid: 'BVBL1125J18  2', vblName: 'AB InBev Leuven Bears J18 B' },
  'u18-c': { teamGuid: 'BVBL1125J18  3', vblName: 'AB InBev Leuven Bears J18 C' },
  'u18-d': { teamGuid: 'BVBL1125J18  4', vblName: 'AB InBev Leuven Bears J18 D' },
  'u21-a': { teamGuid: 'BVBL1125J21  1', vblName: 'AB InBev Leuven Bears J21 A' },
  'u21-b': { teamGuid: 'BVBL1125J21  2', vblName: 'AB InBev Leuven Bears J21 B' },
  'hse-a': { teamGuid: 'BVBL1125HSE  1', vblName: 'AB InBev Leuven Bears HSE A' },
  'hse-b': { teamGuid: 'BVBL1125HSE  2', vblName: 'AB InBev Leuven Bears HSE B' },
  'hse-c': { teamGuid: 'BVBL1125HSE  3', vblName: 'AB InBev Leuven Bears HSE C' },
  'hse-d': { teamGuid: 'BVBL1125HSE  4', vblName: 'AB InBev Leuven Bears HSE D' },
  'hse-e': { teamGuid: 'BVBL1125HSE  5', vblName: 'AB InBev Leuven Bears HSE E' },
  'dse-a': { teamGuid: 'BVBL1125DSE  1', vblName: 'AB InBev Leuven Bears DSE A' },
  'm19-a': { teamGuid: 'BVBL1125M19  1', vblName: 'AB InBev Leuven Bears M19 A' },
  'lbow-a': { teamGuid: 'BVBL1125ROL  1', vblName: 'AB Inbev Leuven Bears ROL A' },
  'lbow-b': { teamGuid: 'BVBL1125ROL  2', vblName: 'AB Inbev Leuven Bears ROL B' },
}

export function getVblTeam(slug: string): VblTeamMapping | undefined {
  return vblTeamsBySlug[slug]
}

export function hasVblTeam(slug: string): boolean {
  return Boolean(vblTeamsBySlug[slug])
}

export function mappedVblSlugs(): string[] {
  return Object.keys(vblTeamsBySlug)
}
