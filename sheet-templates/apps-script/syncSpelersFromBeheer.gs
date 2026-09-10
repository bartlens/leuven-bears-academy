/**
 * Plak dit in de AANWEZIGHEID-spreadsheet:
 * Extensies → Apps Script → nieuw bestand → plak → opslaan.
 *
 * Eerste keer: vul in tab Uitleg het veld beheer_sheet_id (alleen het ID,
 * het stuk tussen /d/ en /edit in de Beheer-URL).
 * Run syncSpelersFromBeheer() eenmaal (rechten toestaan).
 * Optioneel: Trigger → bij openen of tijdgedreven elke 5–15 min.
 *
 * Effect:
 * - Tab Spelers_ref wordt herschreven vanuit Beheer!Spelers
 * - Tab Aanwezigheid (matrix) krijgt ontbrekende spelerskolommen erbij
 * - Tab Aanwezigheid_per_speler krijgt ontbrekende rijen (sessie × speler)
 */

function syncSpelersFromBeheer() {
  var ss = SpreadsheetApp.getActive();
  var uitleg = ss.getSheetByName('Uitleg');
  if (!uitleg) throw new Error('Tab "Uitleg" ontbreekt');

  var beheerId = lookupUitleg_(uitleg, 'beheer_sheet_id');
  if (!beheerId || beheerId.indexOf('BEHEER') === 0) {
    throw new Error('Zet een echte beheer_sheet_id in tab Uitleg');
  }

  var beheer = SpreadsheetApp.openById(beheerId);
  var spelersSheet = beheer.getSheetByName('Spelers');
  if (!spelersSheet) throw new Error('Beheer heeft geen tab "Spelers"');

  var data = spelersSheet.getDataRange().getValues();
  if (data.length < 2) return;

  var headers = data[0].map(String);
  var iNum = headers.indexOf('nummer');
  var iNaam = headers.indexOf('voornaam');
  var iVis = headers.indexOf('zichtbaar');
  if (iNum < 0 || iNaam < 0) throw new Error('Spelers mist kolommen nummer/voornaam');

  var players = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var num = row[iNum];
    var naam = String(row[iNaam] || '').trim();
    if (num === '' || num == null || !naam) continue;
    if (iVis >= 0 && String(row[iVis]).toLowerCase() === 'nee') continue;
    players.push({
      nummer: num,
      voornaam: naam,
      header: '#' + num + ' ' + naam,
    });
  }

  writeSpelersRef_(ss, players);
  ensureMatrixColumns_(ss, players);
  ensureTallRows_(ss, players);
}

function lookupUitleg_(sheet, key) {
  var values = sheet.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === key) return String(values[i][1] || '').trim();
  }
  return '';
}

function writeSpelersRef_(ss, players) {
  var sh = ss.getSheetByName('Spelers_ref') || ss.insertSheet('Spelers_ref');
  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['nummer', 'voornaam', 'kolom_header', 'actief']]);
  if (!players.length) return;
  var rows = players.map(function (p) {
    return [p.nummer, p.voornaam, p.header, 'ja'];
  });
  sh.getRange(2, 1, rows.length, 4).setValues(rows);
}

function ensureMatrixColumns_(ss, players) {
  var sh = ss.getSheetByName('Aanwezigheid');
  if (!sh) return;
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var lastRow = Math.max(sh.getLastRow(), 1);
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);

  // Fixed leading cols we keep
  var lead = ['sessie_id', 'datum', 'type', 'label'];
  players.forEach(function (p) {
    if (headers.indexOf(p.header) === -1) {
      var col = sh.getLastColumn() + 1;
      // If last col is notitie_coach, insert before it
      var noteIdx = headers.indexOf('notitie_coach');
      if (noteIdx >= 0) {
        sh.insertColumnBefore(noteIdx + 1);
        col = noteIdx + 1;
        headers.splice(noteIdx, 0, p.header);
      } else {
        headers.push(p.header);
      }
      sh.getRange(1, col).setValue(p.header);
    }
  });
}

function ensureTallRows_(ss, players) {
  var sessies = ss.getSheetByName('Sessies');
  var tall = ss.getSheetByName('Aanwezigheid_per_speler');
  if (!sessies || !tall) return;

  var sData = sessies.getDataRange().getValues();
  if (sData.length < 2) return;
  var sHeaders = sData[0].map(String);
  var iId = sHeaders.indexOf('sessie_id');
  var iDat = sHeaders.indexOf('datum');
  var iType = sHeaders.indexOf('type');
  var iLab = sHeaders.indexOf('label');
  var iVis = sHeaders.indexOf('zichtbaar');

  var existing = {};
  var tData = tall.getDataRange().getValues();
  if (tData.length && String(tData[0][0]) === 'sessie_id') {
    for (var i = 1; i < tData.length; i++) {
      existing[String(tData[i][0]) + '|' + String(tData[i][4])] = true;
    }
  } else {
    tall.clear();
    tall.getRange(1, 1, 1, 9).setValues([[
      'sessie_id', 'datum', 'type', 'label', 'nummer', 'voornaam', 'status', 'ingevuld_door', 'notitie'
    ]]);
  }

  var toAdd = [];
  for (var r = 1; r < sData.length; r++) {
    var row = sData[r];
    if (iVis >= 0 && String(row[iVis]).toLowerCase() === 'nee') continue;
    var sid = String(row[iId] || '');
    if (!sid) continue;
    players.forEach(function (p) {
      var key = sid + '|' + String(p.nummer);
      if (!existing[key]) {
        toAdd.push([
          sid,
          row[iDat],
          row[iType],
          row[iLab],
          p.nummer,
          p.voornaam,
          '',
          '',
          '',
        ]);
        existing[key] = true;
      }
    });
  }
  if (toAdd.length) {
    tall.getRange(tall.getLastRow() + 1, 1, toAdd.length, 9).setValues(toAdd);
  }
}

/** Optioneel: menu in de sheet */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Academy sync')
    .addItem('Spelers syncen vanuit Beheer', 'syncSpelersFromBeheer')
    .addToUi();
}
