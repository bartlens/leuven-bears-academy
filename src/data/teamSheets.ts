/** Per-team Google Sheet config (public Viewer links → gviz CSV). */

export type TeamSheetConfig = {
  /** Beheer spreadsheet ID (coaches). */
  beheerId: string
  /** Edit URL for Beheer (Info links). */
  beheerUrl: string
  /** Aanwezigheid spreadsheet edit URL (Info link only for now). */
  aanwezigheidUrl: string
  /** Optional tab name overrides if xlsx import renamed sheets. */
  tabs?: {
    spelers?: string
    matchen?: string
  }
}

/**
 * Teams with a live Beheer sheet. Add an entry when a new ploeg sheet is ready.
 * Tab names default to Spelers / Matchen (Dutch templates).
 */
export const teamSheets: Record<string, TeamSheetConfig> = {
  'u10-c': {
    beheerId: '1Z9yOU8F7zR8Rr3jtdJ8Y_tH28DquUIZDbV8-WGIa62s',
    beheerUrl:
      'https://docs.google.com/spreadsheets/d/1Z9yOU8F7zR8Rr3jtdJ8Y_tH28DquUIZDbV8-WGIa62s/edit',
    aanwezigheidUrl:
      'https://docs.google.com/spreadsheets/d/1nL3LnDroXfrfj4oq4a12edCDV-ZVAtjLO2_XyxMo-1w/edit',
  },
}

export function getTeamSheetConfig(slug: string): TeamSheetConfig | undefined {
  return teamSheets[slug]
}

export function hasTeamSheet(slug: string): boolean {
  return Boolean(teamSheets[slug]?.beheerId)
}

export function beheerGvizCsvUrl(
  beheerId: string,
  tabName: string,
  cacheBust = true,
): string {
  const base = `https://docs.google.com/spreadsheets/d/${beheerId}/gviz/tq`
  const params = new URLSearchParams({
    tqx: 'out:csv',
    sheet: tabName,
  })
  if (cacheBust) params.set('_', String(Date.now()))
  return `${base}?${params.toString()}`
}
