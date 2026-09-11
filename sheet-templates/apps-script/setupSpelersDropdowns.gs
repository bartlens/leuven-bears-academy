/**
 * BEHEER-spreadsheet (gedeeld met coaches):
 * Extensies → Apps Script → plak dit bestand → opslaan.
 *
 * Eerste keer (als EIGENAAR / Bart):
 * 1. Run installSpelersTriggers() eenmaal → Google-rechten toestaan.
 *    Installable onEdit loopt als JOUW account, ook als een andere coach typt.
 * 2. Run setupSpelersDropdowns() eenmaal (huidige rijen netjes zetten).
 *
 * Andere coaches: niks installeren; nummer + voornaam invullen volstaat.
 *
 * - Geen kolommen volgorde / zichtbaar.
 * - Dropdowns alleen op rijen met nummer en/of voornaam.
 * - Nieuwe rij → random + dropdowns; rij leeg → dropdowns weg.
 */

var SPELERS_DROPDOWN_COLS = [
  'label', 'emoji', 'accent', 'move', 'haarstijl', 'haarkleur', 'huidskleur',
];
var SPELERS_ROW_START = 2;
var SPELERS_ROW_END = 200;

/** Run once as sheet owner — authorizes + installable onEdit for all editors. */
function installSpelersTriggers() {
  var ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onEditSpelersDefaults') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('onEditSpelersDefaults')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  SpreadsheetApp.getUi().alert(
    'Installable onEdit gezet. Andere coaches krijgen nu ook automatisch dropdowns bij een nieuwe speler.',
  );
}

function setupSpelersDropdowns() {
  var ss = SpreadsheetApp.getActive();
  var spelers = ss.getSheetByName('Spelers');
  var keuzes = ss.getSheetByName('Keuzelijsten');
  if (!spelers) throw new Error('Tab "Spelers" ontbreekt');
  if (!keuzes) throw new Error('Tab "Keuzelijsten" ontbreekt');

  deleteColumnIfPresent_(spelers, 'volgorde');
  deleteColumnIfPresent_(spelers, 'zichtbaar');

  var lists = readKeuzelijsten_(keuzes);
  var headers = getHeaders_(spelers);
  var rules = buildRules_(lists, headers);

  clearDropdownValidations_(spelers, headers);

  var filled = 0;
  for (var row = SPELERS_ROW_START; row <= SPELERS_ROW_END; row++) {
    if (!rowHasPlayer_(spelers, headers, row)) continue;
    applyDropdownsToRow_(spelers, headers, rules, row);
    fillEmptyAppearanceWithRandomOnRow_(spelers, headers, row);
    filled++;
  }

  SpreadsheetApp.getUi().alert(
    'Spelers-dropdowns gezet op ' + filled +
      ' gevulde rij(en). Lege rijen zonder dropdowns.',
  );
}

/** Installable handler — runs as the owner who installed the trigger. */
function onEditSpelersDefaults(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Spelers') return;
  var row = e.range.getRow();
  if (row < SPELERS_ROW_START || row > SPELERS_ROW_END) return;

  var keuzes = SpreadsheetApp.getActive().getSheetByName('Keuzelijsten');
  if (!keuzes) return;
  var headers = getHeaders_(sheet);
  var rules = buildRules_(readKeuzelijsten_(keuzes), headers);

  if (!rowHasPlayer_(sheet, headers, row)) {
    clearDropdownsOnRow_(sheet, headers, row);
    SPELERS_DROPDOWN_COLS.forEach(function (colName) {
      var colIdx = headers.indexOf(colName);
      if (colIdx < 0) return;
      sheet.getRange(row, colIdx + 1).clearContent();
    });
    return;
  }

  applyDropdownsToRow_(sheet, headers, rules, row);
  fillEmptyAppearanceWithRandomOnRow_(sheet, headers, row);
}

function deleteColumnIfPresent_(sheet, name) {
  var headers = getHeaders_(sheet);
  var idx = headers.indexOf(name);
  if (idx < 0) return;
  sheet.deleteColumn(idx + 1);
}

function getHeaders_(sheet) {
  return sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getValues()[0]
    .map(function (h) {
      return String(h || '').trim();
    });
}

function rowHasPlayer_(sheet, headers, row) {
  var iNum = headers.indexOf('nummer');
  var iNaam = headers.indexOf('voornaam');
  if (iNum < 0 || iNaam < 0) return false;
  var num = sheet.getRange(row, iNum + 1).getValue();
  var naam = String(sheet.getRange(row, iNaam + 1).getValue() || '').trim();
  return !(num === '' || num == null) || !!naam;
}

function buildRules_(lists, headers) {
  var rules = {};
  SPELERS_DROPDOWN_COLS.forEach(function (colName) {
    if (headers.indexOf(colName) < 0) return;
    var values = lists[colName];
    if (!values || !values.length) return;
    rules[colName] = SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)
      .setAllowInvalid(false)
      .setHelpText('Kies uit Keuzelijsten · tip: random')
      .build();
  });
  return rules;
}

function applyDropdownsToRow_(sheet, headers, rules, row) {
  SPELERS_DROPDOWN_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0 || !rules[colName]) return;
    sheet.getRange(row, colIdx + 1).setDataValidation(rules[colName]);
  });
}

function clearDropdownsOnRow_(sheet, headers, row) {
  SPELERS_DROPDOWN_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) return;
    sheet.getRange(row, colIdx + 1).clearDataValidations();
  });
}

function clearDropdownValidations_(sheet, headers) {
  SPELERS_DROPDOWN_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) return;
    sheet
      .getRange(SPELERS_ROW_START, colIdx + 1, SPELERS_ROW_END, colIdx + 1)
      .clearDataValidations();
  });
}

function fillEmptyAppearanceWithRandomOnRow_(sheet, headers, row) {
  SPELERS_DROPDOWN_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) return;
    var cell = sheet.getRange(row, colIdx + 1);
    if (!String(cell.getValue() || '').trim()) cell.setValue('random');
  });
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
    .addItem('Spelers-dropdowns zetten (nu)', 'setupSpelersDropdowns')
    .addItem('Auto-dropdowns voor alle coaches (1×)', 'installSpelersTriggers')
    .addToUi();
}
