# Leuven Bears Academy — content via Google Sheets

Doel: coaches en secretariaat vullen sheets; de website spiegelt die data. Geen deploy nodig voor tekst/kalender/spelers.

## Twee werkmappen

### A) `Academy Hub` (1× voor heel de club)
Beheerd door secretariaat / sitebeheerder.

| Tabblad | Site |
|---------|------|
| Register | Welke ploegen bestaan + link naar hun sheet |
| Club | Contact, zaal, socials, seizoen |
| Nieuws | `/nieuws` |
| Events | `/events` (clubbreed) |
| FAQ | `/faq` |
| LBOW | `/lbow` secties |

CSV-voorbeelden: map `academy-hub/`.

### B) `Ploeg-template` (kopie per ploeg)
Coach / ploegafgevaardigde krijgt een **kopie** van de template (niet het origineel).

| Tabblad | Site (team-hub) |
|---------|-----------------|
| Ploeg | Home + meta |
| Staff | Info / coaches |
| Trainingen_week | Vaste Ma–Zo uren & locatie |
| Trainingen_data | Losse data (kalender aan/uit) |
| Matchen | Matchen + kalender |
| Spelers | Spelers + chibi-uiterlijk (dropdowns) |
| Evenementen | Ploeg-events |
| Info | Afspraken & links |
| Keuzelijsten | Bron voor dropdowns (niet manueel vullen op site) |

CSV-voorbeelden: map `team-template/`.

## Workflow
1. Hub-sheet aanmaken in Google Drive (tabs = CSV-namen zonder nummer).
2. Template-sheet aanmaken; in Google Sheets **Data → Data validation** koppelen aan `Keuzelijsten`.
3. Per ploeg: **Bestand → Kopie maken**, slug zetten in tab Ploeg, link plakken in Hub → Register.
4. Sheet **publiceren als CSV** of via bestaande export-API (zelfde aanpak als U10 C `/api/team-data`).
5. Site leest Hub + ploeg-sheets op page load (cache).

## Regels voor invullers
- Datums als `YYYY-MM-DD` (of `dd/mm/yyyy` consequent — sync normaliseert).
- Uren als `17:30`.
- `zichtbaar=nee` verbergt zonder te wissen.
- Geen telefoonnummers verzinnen; leeg laten mag.
- Spelers: kies `haarstijl` / `haarkleur` / `huidskleur` / `emoji` uit de lijst.
- Emoji: kies een vaste emoji óf `random` — dan kiest de site stabiel één uit de pool.

## Mapping naar site-routes
- `/` ← Club + Events teaser + Nieuws teaser + Register
- `/teams` ← Register (actief=ja)
- `/team/{slug}/*` ← die ploeg-sheet
- `/nieuws` ← Nieuws
- `/events` ← Events
- `/faq` ← FAQ
- `/lbow` ← LBOW
- `/info` ← Club
