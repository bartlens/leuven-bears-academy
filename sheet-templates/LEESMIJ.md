# Leuven Bears Academy — content via Google Sheets

Doel: coaches beheren de ploeg; ouders vullen alleen aanwezigheid. De website spiegelt Beheer (+ optioneel aanwezigheidsoverzicht).

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
| Matchen | Wedstrijden |
| Spelers | Selectie + uiterlijk (dropdowns) |
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
1. Kopieer **Beheer**-template → vul slug/naam/staff/trainingen/matchen/spelers.
2. Kopieer **Aanwezigheid**-template → zet `beheer_sheet_url` in Uitleg; vul Spelers_ref + kolommen in Aanwezigheid.
3. Optioneel: Sessies in Aanwezigheid vullen via `IMPORTRANGE` vanuit Beheer `Trainingen_data` + `Matchen` (geen dubbel werk).
4. Plak beide URLs in Hub → Register.
5. Deel Beheer met coaches; deel Aanwezigheid-link met ouders.

## Regels
- Datums `YYYY-MM-DD`, uren `17:30`.
- `zichtbaar=nee` verbergt op de site zonder te wissen.
- Emoji: vaste keuze of `random`.
- Aanwezigheid: alleen J / N / ? (of ✅ ❌ ❓).
