# Leuven Bears Academy

Modern Academy site (U10 C look) — teams, nieuws, events, LBOW, FAQ + per-ploeg hub.

## Sheet-model (2 sheets per ploeg)

1. **Academy Hub** — clubbreed (`sheet-templates/academy-hub/`)
2. **Ploeg Beheer** — coaches/afgevaardigde (`sheet-templates/team-beheer/`)
3. **Ploeg Aanwezigheid** — ouders/spelers (`sheet-templates/team-aanwezigheid/`)

Zie `sheet-templates/LEESMIJ.md`. Preview na deploy: `/sheets-preview.html`.

## Wedstrijden = Basketbal Vlaanderen + sheet extras

- Mapping: `src/data/vblTeams.ts` (academy slug → VBL `teamGuid`)
- Fetcher: `src/vbl/fetchTeamMatches.ts` (live + sessionStorage TTL + generated fallback)
- Snapshot: `npm run sync:vbl` → `src/data/generated/vblMatchesBySlug.ts`
- Dev proxy: `/api/vbl/*` → `vblcb.wisseq.eu` (zie `vite.config.ts`)
- Beheer tab **Matchen** = alleen extras (scrimmages). Site: `vbl + sheetExtras`.

CORS: VBL stuurt `Access-Control-Allow-Origin: *` → live client fetch werkt op Vercel static; generated file blijft offline/fallback.

## Live Beheer (U10 C)

Config: `src/data/teamSheets.ts`.

- Beheer ID: `1Z9yOU8F7zR8Rr3jtdJ8Y_tH28DquUIZDbV8-WGIa62s`
- Aanwezigheid (Info-link): `1nL3LnDroXfrfj4oq4a12edCDV-ZVAtjLO2_XyxMo-1w`

De site haalt publieke gviz CSV’s (Anyone with the link → Viewer):

`https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Spelers`

Tabs: **Spelers**, **Matchen** (extras). Officiële games: VBL.

## Scripts

```bash
npm run sync:vbl   # refresh VBL snapshot
npm run build
```
