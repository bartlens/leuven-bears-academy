# Google Sheets voor coaches (simpele handleiding)

Doel: **jij vult Beheer in**, ouders vullen alleen **Aanwezigheid**. De website leest Beheer automatisch.

## Wat heb je nodig?

1. **Beheer-map** (deze templates in `team-beheer/`) — alleen voor coaches + afgevaardigde  
2. **Aanwezigheid-map** (`team-aanwezigheid/`) — link voor de oudergroep  
3. Optioneel: Hub-register met beide URLs

## Beheer — zo begin je (10 min)

1. Open tab **Lees_mij** (of dit bestand) en lees de 10 stappen.  
2. Tab **Ploeg**: vul naam, seizoen, zaal, link naar aanwezigheid.  
3. Tab **Staff**: zet coaches + afgevaardigde (naam + rol is genoeg).  
4. Tab **Trainingen_week**: zet `actief=ja` op trainingsdagen + uur + locatie.  
5. Tab **Trainingen_data**: concrete data als `2026-09-14` (jaar-maand-dag).  
6. Tab **Spelers**: **nummer + voornaam**. Rest mag `random` blijven.  
7. Tab **Matchen**: **geen** competitiewedstrijden typen — die komen van Basketbal Vlaanderen. Alleen oefenwedstrijden / extras.  
8. Tab **Info**: afspraken, tips, links, stage-velden (soort kiezen uit de lijst).  
9. Tab **Evenementen**: tornooien / stages.  
10. Deel Beheer **niet** publiek met alle ouders.

### Spelers — tip
Nummer + voornaam volstaat. Dropdowns (look/emoji) staan klaar; `random` = de site kiest.

### Matchen — tip
Officiële VBL-matchen = automatisch. Sheet = alleen “Extra” (scrimmage / oefen).

## Aanwezigheid — voor ouders

1. Tab **Lees_mij** / **Uitleg**: plak `beheer_sheet_id`.  
2. Ouders zetten enkel **J / N / ?** bij hun kind.  
3. Spelers **niet** hier toevoegen — dat gebeurt in Beheer → Spelers (+ sync-script).

## Dropdowns (Beheer)

Extensies → Apps Script → plak `apps-script/setupSpelersDropdowns.gs` → run **setupSpelersDropdowns** eenmaal.

## Spelers sync naar Aanwezigheid

Plak `apps-script/syncSpelersFromBeheer.gs` in de Aanwezigheid-map → run **syncSpelersFromBeheer**.

## Regels (kort)

- Datums: `YYYY-MM-DD` · uren: `17:30`  
- `tonen` / `zichtbaar` = `ja` of `nee`  
- Verzin geen telefoonnummers of tarieven — zet alleen wat de club bevestigde  
- `Matchen` = extras only

## Live U10 C

- Beheer: `https://docs.google.com/spreadsheets/d/1Z9yOU8F7zR8Rr3jtdJ8Y_tH28DquUIZDbV8-WGIa62s/edit`  
- Aanwezigheid: zie Ploeg-tab `aanwezigheid_sheet_url` / Hub-register  

Na template-updates: inhoud uit `team-beheer/*.csv` overnemen in de live tabs (headers + rijen).
