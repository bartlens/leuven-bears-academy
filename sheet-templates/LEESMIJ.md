# Google Sheets voor coaches (simpele handleiding)

Doel: **jij vult Beheer in**, ouders vullen alleen **Aanwezigheid**. De website leest Beheer automatisch. Sessies voor aanwezigheid verschijnen **automatisch** na sync — je hoeft Sessies niet manueel bij te houden.

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
- **Wedstrijden waarvoor je aanwezigheid wil:** zet ze in Beheer → **Matchen** (ook als het een VBL-wedstrijd is, mag een korte rij). Daarna sync.  
- Officiële VBL-kalender op de site ≠ automatisch aanwezigheidsrij. Wil je J/N/? voor een VBL-match → korte rij in Matchen + sync.

## Aanwezigheid — voor ouders

1. Tab **Lees_mij** / **Uitleg**: plak `beheer_sheet_id`.  
2. Ouders zetten enkel een **vinkje** (checkbox) bij hun kind: aan = komt, uit = komt niet.  
3. Spelers **niet** hier toevoegen — dat gebeurt in Beheer → Spelers.  
4. Sessies **niet** manueel in Sessies typen — menu **Academy sync → Alles bijwerken**.

## Installatie sync (1× door coach / beheerder)

In de **Aanwezigheid**-spreadsheet:

1. Vul in tab **Uitleg** het veld `beheer_sheet_id` (stuk tussen `/d/` en `/edit` in de Beheer-URL).  
2. Extensies → Apps Script → plak `apps-script/syncSpelersFromBeheer.gs` → opslaan.  
3. Run **`syncAllesVanuitBeheer`** eenmaal (rechten toestaan: Beheer mag gelezen worden).  
4. Herlaad de sheet → menu **Academy sync** verschijnt.

### Menu Academy sync
- **Alles bijwerken vanuit Beheer (spelers + trainingen + matchen)** → `syncAllesVanuitBeheer()`  
- **Alleen spelers syncen** → `syncSpelersFromBeheer()`

Bestaande J/N/?-antwoorden blijven staan; alleen nieuwe sessies/spelers komen erbij.

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
