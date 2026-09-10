# Leuven Bears Academy

Modern Academy site (U10 C look) — teams, nieuws, events, LBOW, FAQ + per-ploeg hub.

## Sheet-model (2 sheets per ploeg)

1. **Academy Hub** — clubbreed (`sheet-templates/academy-hub/`)
2. **Ploeg Beheer** — coaches/afgevaardigde (`sheet-templates/team-beheer/`)
3. **Ploeg Aanwezigheid** — ouders/spelers (`sheet-templates/team-aanwezigheid/`)

Zie `sheet-templates/LEESMIJ.md`. Preview na deploy: `/sheets-preview.html`.

## Live Beheer (U10 C)

Config: `src/data/teamSheets.ts`.

- Beheer ID: `1Z9yOU8F7zR8Rr3jtdJ8Y_tH28DquUIZDbV8-WGIa62s`
- Aanwezigheid (Info-link): `1nL3LnDroXfrfj4oq4a12edCDV-ZVAtjLO2_XyxMo-1w`

De site haalt publieke gviz CSV’s (Anyone with the link → Viewer):

`https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Spelers`

Tabs in gebruik: **Spelers**, **Matchen**. Bij fetch-fout valt de hub terug op demo-data.
