# Google Sheets voor coaches (simpele handleiding)

Doel: **jij vult Beheer in**, ouders vullen alleen **Aanwezigheid** (tabs **Trainingen** + **Wedstrijden** + korte **Uitleg**). Geen andere tabs nodig. De website leest Beheer automatisch. Sessies verschijnen **automatisch** na sync — je hoeft Sessies niet manueel bij te houden.

## Wat heb je nodig?

1. **Beheer-map** (deze templates in `team-beheer/`) — alleen voor coaches + afgevaardigde  
2. **Aanwezigheid-map** (`team-aanwezigheid/`) — link voor de oudergroep  
3. Optioneel: Hub-register met beide URLs

## Beheer — zo begin je (10 min)

1. Open tab **Lees_mij** (of dit bestand) en lees de stappen.  
2. Tab **Ploeg**: vul naam, seizoen, zaal, link naar aanwezigheid.  
3. Tab **Staff**: zet coaches + afgevaardigde (naam + rol is genoeg).  
4. Tab **Trainingen_week**: zet `actief=ja` op trainingsdagen + uur + locatie.  
5. Tab **Trainingen_data** (optioneel): concrete uitzonderingen — afgelast (`status=nee`), of andere zaal/uur. De sync maakt sowieso de komende 10 weken vanuit het weekschema.  
6. Tab **Spelers**: **nummer + voornaam**. Rest mag `random` blijven.  
7. Tab **Matchen**: wedstrijden waarvoor je **ouder-aanwezigheid** wil (ook een VBL-match mag als korte rij). Officiële VBL-uitslagen op de website komen apart; aanwezigheid = wat in Matchen staat.  
8. Tab **Info**: afspraken, tips, links, stage-velden (soort kiezen uit de lijst).  
9. Tab **Evenementen**: tornooien / stages.  
10. Deel Beheer **niet** publiek met alle ouders.

### Spelers — tip
Nummer + voornaam volstaat. Dropdowns (look/emoji) staan klaar; `random` = de site kiest.

### Trainingen + Matchen — tip (aanwezigheid)
- **Trainingen:** vul `Trainingen_week`. Sync maakt sessies voor ouders (10 weken vooruit). Uitzondering? Zet die dag in `Trainingen_data` (`status=nee` = afgelast, of ander uur/zaal).  
- **Wedstrijden:** officiële VBL-matchen komen **automatisch** binnen via `vbl_team_guid` in Uitleg (zie setup hieronder). Extra/tornooi? Zet een korte rij in Beheer → **Matchen**.  
- Coaches hoeven matchen **niet** manueel over te typen.

## Aanwezigheid — voor ouders

Layout zoals het oude U10 C-blad: **één rij per kind**, kolommen = trainingen/matchen.

1. Tab **Trainingen**: **Ja** / **Nee** bij jouw kind.  
2. Tab **Wedstrijden**: per match aanwezig / gespeeld.  
3. Spelers of matchen **niet** hier toevoegen.

## Installatie (1× door jou / Academy — vóór delen met coaches)

In de **Aanwezigheid**-spreadsheet:

1. Tab **Uitleg**: `beheer_sheet_id` + **`vbl_team_guid`** (VBL-ploegcode, bv. `BVBL1125G10  3` voor U10 C — spaties laten staan).  
2. Extensies → Apps Script → plak `apps-script/syncSpelersFromBeheer.gs` → opslaan.  
3. Menu **Academy sync → Eerste setup (auto matchen)** één keer (rechten toestaan).  
   → haalt alle VBL-matchen binnen, zet auto-trigger klaar.  
4. Deel daarna met coaches/ouders. **Coaches doen verder niks** voor de kalender.

### Menu Academy sync (onderhoud)
- **Eerste setup (auto matchen)** → `eersteSetupAutoMatchen()`  
- **Wedstrijden uit VBL verversen** → `syncWedstrijdenVanuitVbl()` (raakt Trainingen niet)  
- **Alles bijwerken vanuit Beheer** → `syncAllesVanuitBeheer()`  
- **Opruimen overbodige tabs** → alleen Trainingen/Wedstrijden/Uitleg

Bestaande vinkjes blijven staan; VBL-verversen wijzigt Trainingen niet.

### Optioneel: Trainingen_data vullen voor de website
In de Apps Script-editor: run **`genereerTrainingenUitWeekschema()`**.  
Dat schrijft ontbrekende data (10 weken) naar Beheer → Trainingen_data (handig voor de site-kalender), raakt `status=nee` niet aan, en doet daarna een volle sync. Aanwezigheid werkt ook zonder deze stap (sync leest het weekschema rechtstreeks).

## Dropdowns (Beheer)

Extensies → Apps Script → plak `apps-script/setupSpelersDropdowns.gs` → run **setupSpelersDropdowns** eenmaal.  
*(Niet aanpassen / niet verwarren met het aanwezigheid-syncscript.)*

## Regels (kort)

- Datums: `YYYY-MM-DD` · uren: `17:30`  
- `tonen` / `zichtbaar` / `actief` / `status` = `ja` of `nee`  
- Verzin geen telefoonnummers of tarieven — zet alleen wat de club bevestigde  
- **Aanwezigheid-sessies = Beheer Trainingen (week + data) + Beheer Matchen**

## Live U10 C

- Beheer: `https://docs.google.com/spreadsheets/d/1Z9yOU8F7zR8Rr3jtdJ8Y_tH28DquUIZDbV8-WGIa62s/edit`  
- Aanwezigheid: zie Ploeg-tab `aanwezigheid_sheet_url` / Hub-register  

Na template-updates: inhoud uit `team-beheer/*.csv` overnemen in de live tabs (headers + rijen). Plak daarna het bijgewerkte sync-script opnieuw in Apps Script en run **Alles bijwerken**.
