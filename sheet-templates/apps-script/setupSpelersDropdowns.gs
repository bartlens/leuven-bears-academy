/**
 * Plak dit in de BEHEER-spreadsheet (niet Aanwezigheid):
 * Extensies → Apps Script → nieuw bestand → plak → opslaan.
 *
 * Eerste keer:
 * 1. Run setupSpelersDropdowns() eenmaal (rechten toestaan).
 * 2. Optioneel: Triggers → onEditSpelersDefaults als installable onEdit
 *    (of laat simple trigger onEdit staan — werkt voor de eigenaar).
 *
 * Effect:
 * - DataValidation dropdowns op Spelers-kolommen label,emoji,accent,move,
 *   haarstijl,haarkleur,huidskleur (rijen 2–200) vanuit tab Keuzelijsten.
 * - Bij nieuwe rij (nummer of voornaam ingevuld): lege appearance-cellen → "random".
 */

var SPELERS_APPEARANCE_COLS = [
  'label',
  'emoji',
  'accent',
  'move',
  'haarstijl',
  'haarkleur',
  'huidskleur',
];
var SPELERS_ROW_START = 2;
var SPELERS_ROW_END = 200;

function setupSpelersDropdowns() {
  var ss = SpreadsheetApp.getActive();
  var spelers = ss.getSheetByName('Spelers');
  var keuzes = ss.getSheetByName('Keuzelijsten');
  if (!spelers) throw new Error('Tab "Spelers" ontbreekt');
  if (!keuzes) throw new Error('Tab "Keuzelijsten" ontbreekt');

  var lists = readKeuzelijsten_(keuzes);
  var headers = spelers
    .getRange(1, 1, 1, spelers.getLastColumn())
    .getValues()[0]
    .map(String);

  SPELERS_APPEARANCE_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) {
      Logger.log('Kolom ontbreekt: ' + colName);
      return;
    }
    var values = lists[colName];
    if (!values || !values.length) {
      Logger.log('Geen keuzes voor lijst: ' + colName);
      return;
    }
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)
      .setAllowInvalid(false)
      .setHelpText('Kies uit Keuzelijsten · tip: random')
      .build();
    spelers
      .getRange(SPELERS_ROW_START, colIdx + 1, SPELERS_ROW_END, colIdx + 1)
      .setDataValidation(rule);
  });

  fillEmptyAppearanceWithRandom_(spelers, headers);
  SpreadsheetApp.getUi().alert(
    'Spelers-dropdowns gezet (rijen ' +
      SPELERS_ROW_START +
      '–' +
      SPELERS_ROW_END +
      '). Lege appearance → random waar nummer/voornaam al stond.',
  );
}

/** Simple trigger: fires for the sheet owner when editing Spelers. */
function onEdit(e) {
  onEditSpelersDefaults(e);
}

/** Installable-safe entry (same logic). */
function onEditSpelersDefaults(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Spelers') return;

  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(String);
  var row = e.range.getRow();
  if (row < SPELERS_ROW_START || row > SPELERS_ROW_END) return;

  var iNum = headers.indexOf('nummer');
  var iNaam = headers.indexOf('voornaam');
  if (iNum < 0 || iNaam < 0) return;

  var num = sheet.getRange(row, iNum + 1).getValue();
  var naam = String(sheet.getRange(row, iNaam + 1).getValue() || '').trim();
  if ((num === '' || num == null) && !naam) return;

  // Ensure validations stay present (cheap re-apply on edited columns is optional;
  // full setup is via menu).
  SPELERS_APPEARANCE_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) return;
    var cell = sheet.getRange(row, colIdx + 1);
    var val = String(cell.getValue() || '').trim();
    if (!val) cell.setValue('random');
  });
}

function fillEmptyAppearanceWithRandom_(sheet, headers) {
  var last = Math.min(Math.max(sheet.getLastRow(), SPELERS_ROW_START), SPELERS_ROW_END);
  var iNum = headers.indexOf('nummer');
  var iNaam = headers.indexOf('voornaam');
  if (iNum < 0 || iNaam < 0) return;

  for (var row = SPELERS_ROW_START; row <= last; row++) {
    var num = sheet.getRange(row, iNum + 1).getValue();
    var naam = String(sheet.getRange(row, iNaam + 1).getValue() || '').trim();
    if ((num === '' || num == null) && !naam) continue;
    SPELERS_APPEARANCE_COLS.forEach(function (colName) {
      var colIdx = headers.indexOf(colName);
      if (colIdx < 0) return;
      var cell = sheet.getRange(row, colIdx + 1);
      if (!String(cell.getValue() || '').trim()) cell.setValue('random');
    });
  }
}

function readKeuzelijsten_(sheet) {
  var data = sheet.getDataRange().getValues();
  var map = {};
  for (var r = 1; r < data.length; r++) {
    var lijst = String(data[r][0] || '').trim();
    var waarde = String(data[r][1] || '').trim();
    if (!lijst || !waarde) continue;
    if (!map[lijst]) map[lijst] = [];
    if (map[lijst].indexOf(waarde) === -1) map[lijst].push(waarde);
  }
  return map;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Academy Beheer')
    .addItem('Spelers-dropdowns zetten', 'setupSpelersDropdowns')
    .addToUi();
}
