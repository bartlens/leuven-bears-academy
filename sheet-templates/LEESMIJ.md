# Leuven Bears Academy — content via Google Sheets

Doel: coaches beheren de ploeg; ouders vullen alleen aanwezigheid. De website spiegelt Beheer (+ optioneel aanwezigheidsoverzicht).

**Officiële competitiewedstrijden** komen van Basketbal Vlaanderen (VBL API) — coaches typen die **niet** opnieuw in Beheer.

## Drie soorten werkmappen

### A) `Academy Hub` (1×, secretariaat)
| Tabblad | Inhoud |
|---------|--------|
| Register | Ploegen + **2 sheet-links** (`beheer_sheet_url`, `aanwezigheid_sheet_url`) |
| Club | Contact, zaal, socials |
| Nieuws / Events / FAQ / LBOW | Clubbrede site-pagina’s |

CSV’s: `academy-hub/`.

### B) `Ploeg — Beheer` (1× per ploeg, alleen coaches + afgevaardigde)
Delen: **beperkt** (uitnodigen op e-mail, geen “iedereen met link mag bewerken” tenzij je dat bewust wilt).

| Tabblad | Site |
|---------|------|
| Ploeg | Home + meta (+ link naar aanwezigheid-sheet) |
| Staff | Coaches / afgevaardigde |
| Trainingen_week | Vaste Ma–Zo |
| Trainingen_data | Losse data (kalender) |
| **Matchen** | **Alleen extras** (oefenwedstrijden, scrimmages, toernooien). Officiële VBL-matchen komen automatisch. |
| Spelers | Selectie + uiterlijk (dropdowns → default `random`) |
| Evenementen | Ploeg-events |
| Info | Afspraken & links |
| Keuzelijsten | Bron voor dropdowns |

CSV’s: `team-beheer/`.

### C) `Ploeg — Aanwezigheid` (1× per ploeg, ouders/spelers/coaches)
Delen: link voor de oudergroep (WhatsApp). Geen gevoelige beheer-info hier.

| Tabblad | Inhoud |
|---------|--------|
| Uitleg | Korte instructie |
| Sessies | Lijst trainingen/matchen (mag via IMPORTRANGE uit Beheer) |
| Aanwezigheid | Matrix: rijen = sessies, kolommen = spelers (`J` / `N` / `?`) |
| Spelers_ref | Welke kolommen horen bij welk kind |
| Keuzes_aanwezig | Betekenis van J/N/? |

CSV’s: `team-aanwezigheid/`.

## Waarom 2 sheets?
Google kan tabs **tegen bewerken** beschermen, maar ouders met toegang tot het bestand **zien** die tabs meestal nog. Apart bestand = duidelijke grens.

## Workflow coach
1. Kopieer **Beheer**-template → vul slug/naam/staff/trainingen/**extras**/spelers.
2. Kopieer **Aanwezigheid**-template → zet `beheer_sheet_url` in Uitleg; vul Spelers_ref + kolommen in Aanwezigheid.
3. Optioneel: Sessies in Aanwezigheid vullen via `IMPORTRANGE` vanuit Beheer `Trainingen_data` + `Matchen` (geen dubbel werk).
4. Plak beide URLs in Hub → Register.
5. Deel Beheer met coaches; deel Aanwezigheid-link met ouders.
6. Run **Spelers-dropdowns** Apps Script één keer op Beheer (zie hieronder).

## Regels
- Datums `YYYY-MM-DD`, uren `17:30`.
- `zichtbaar=nee` verbergt op de site zonder te wissen.
- Emoji / uiterlijk: vaste keuze of `random` (default voor nieuwe rijen).
- Aanwezigheid: alleen J / N / ? (of ✅ ❌ ❓).
- **Matchen-tab = extras only.** Geen competitie-kalender van VBL opnieuw intypen.

## Matchen (extras) vs Basketbal Vlaanderen

| Bron | Wat |
|------|-----|
| VBL API (`TeamMatchesByGuid`) | Officiële competitie- & bekerwedstrijden → site kalender / matchen / home |
| Beheer tab `Matchen` | Scrimmages, oefenwedstrijden, toernooien → gemerged als “Extra” |

Site-merge: `matches = vblMatches + sheetExtras`.

Live Beheer U10 C: wis de oude competitie-rijen in tab Matchen (laat header + eventuele scrimmage). gviz is read-only — dit moet manueel in Google Sheets.

VBL-cache vernieuwen (dev/deploy): `npm run sync:vbl` → schrijft `src/data/generated/vblMatchesBySlug.ts`. Lokaal: Vite proxy `/api/vbl/*`. Productie: VBL stuurt `Access-Control-Allow-Origin: *` dus live browser-fetch werkt; gegenereerde JSON blijft fallback.

## Spelers-dropdowns + default `random` (Beheer)

Voeg toe in de **Beheer**-spreadsheet:

1. Extensies → Apps Script.
2. Plak `sheet-templates/apps-script/setupSpelersDropdowns.gs`.
3. Opslaan → run **`setupSpelersDropdowns`** eenmaal (rechten toestaan).
4. Menu *Academy Beheer* → “Spelers-dropdowns zetten” blijft beschikbaar.
5. Optioneel: Triggers → `onEditSpelersDefaults` als installable onEdit (voor andere editors).

Gedrag:
- Dropdowns op `label`, `emoji`, `accent`, `move`, `haarstijl`, `haarkleur`, `huidskleur` (rijen 2–200) vanuit `Keuzelijsten`.
- Nieuwe rij met nummer/voornaam → lege appearance-cellen worden `random`.

## Spelers sync (Beheer → Aanwezigheid)

Voeg spelers **alleen** toe in Beheer → tab `Spelers`.

Automatisch overnemen in Aanwezigheid:

1. Zet in Aanwezigheid → `Uitleg` het veld `beheer_sheet_id` (ID uit de Beheer-URL).
2. Extensies → Apps Script → plak `sheet-templates/apps-script/syncSpelersFromBeheer.gs`.
3. Run **Spelers syncen vanuit Beheer** (menu *Academy sync*, of de functie `syncSpelersFromBeheer`).
4. Resultaat:
   - `Spelers_ref` wordt bijgewerkt
   - matrix-tab `Aanwezigheid` krijgt nieuwe kolommen (`#nummer Naam`)
   - `Aanwezigheid_per_speler` krijgt ontbrekende rijen (sessie × speler)

Optioneel: trigger “bij openen” of elke 15 minuten, zodat coaches niet manueel hoeven te syncen.

> Zonder script kan `Spelers_ref` ook met `IMPORTRANGE` — maar **nieuwe matrix-kolommen** vragen wél het script (of het lange formaat `Aanwezigheid_per_speler`).

- Spelers: kies uit de keuzelijsten. `random` mag bij emoji, label, accent, move, haarstijl, haarkleur, huidskleur.
- Kleuren: gewone namen (`blond-goud`, `bruin`, `zwart`, `licht`, …) — geen hex-codes in de sheet.

- Spelers: geen `volgorde` of `zichtbaar` (volgorde = `nummer`). Dropdowns alleen op gevulde rijen vanaf rij 2.
