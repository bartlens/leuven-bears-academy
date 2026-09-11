/**
 * Plak dit in de BEHEER-spreadsheet (niet Aanwezigheid):
 * Extensies → Apps Script → nieuw bestand → plak → opslaan.
 *
 * Eerste keer: run setupSpelersDropdowns() eenmaal (rechten toestaan).
 * Menu: Academy Beheer → Spelers-dropdowns zetten.
 *
 * Regels:
 * - Geen kolom "volgorde" — sortering op de site = nummer.
 * - Dropdowns ALLEEN op rijen met nummer én/of voornaam (lege rijen blijven proper).
 * - Nieuwe speler: onEdit zet defaults op "random" + dropdowns op die rij.
 * - Lege rijen: data validation wordt gewist.
 */

var SPELERS_DROPDOWN_COLS = [
  'label',
  'emoji',
  'accent',
  'move',
  'haarstijl',
  'haarkleur',
  'huidskleur',
  'zichtbaar',
];
var SPELERS_ROW_START = 2;
var SPELERS_ROW_END = 200;

function setupSpelersDropdowns() {
  var ss = SpreadsheetApp.getActive();
  var spelers = ss.getSheetByName('Spelers');
  var keuzes = ss.getSheetByName('Keuzelijsten');
  if (!spelers) throw new Error('Tab "Spelers" ontbreekt');
  if (!keuzes) throw new Error('Tab "Keuzelijsten" ontbreekt');

  // Drop obsolete volgorde column if still present
  removeVolgordeColumn_(spelers);

  var lists = readKeuzelijsten_(keuzes);
  var headers = getHeaders_(spelers);
  var rules = buildRules_(lists, headers);

  // Clear validations on the whole appearance block first (empty rows stay clean)
  clearDropdownValidations_(spelers, headers);

  var filled = 0;
  for (var row = SPELERS_ROW_START; row <= SPELERS_ROW_END; row++) {
    if (!rowHasPlayer_(spelers, headers, row)) continue;
    applyDropdownsToRow_(spelers, headers, rules, row);
    fillEmptyAppearanceWithRandomOnRow_(spelers, headers, row);
    filled++;
  }

  SpreadsheetApp.getUi().alert(
    'Spelers-dropdowns gezet op ' +
      filled +
      ' gevulde rij(en). Lege rijen hebben geen dropdowns. Kolom volgorde (indien aanwezig) is verwijderd.',
  );
}

/** Simple trigger: owner edits Spelers. */
function onEdit(e) {
  onEditSpelersDefaults(e);
}

function onEditSpelersDefaults(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Spelers') return;

  var row = e.range.getRow();
  if (row < SPELERS_ROW_START || row > SPELERS_ROW_END) return;

  var ss = SpreadsheetApp.getActive();
  var keuzes = ss.getSheetByName('Keuzelijsten');
  if (!keuzes) return;

  var headers = getHeaders_(sheet);
  var lists = readKeuzelijsten_(keuzes);
  var rules = buildRules_(lists, headers);

  if (!rowHasPlayer_(sheet, headers, row)) {
    // Cleared name/number → remove dropdowns on this row
    clearDropdownsOnRow_(sheet, headers, row);
    return;
  }

  applyDropdownsToRow_(sheet, headers, rules, row);
  fillEmptyAppearanceWithRandomOnRow_(sheet, headers, row);
}

function removeVolgordeColumn_(sheet) {
  var headers = getHeaders_(sheet);
  var idx = headers.indexOf('volgorde');
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
  var hasNum = !(num === '' || num == null);
  return hasNum || !!naam;
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
    if (colIdx < 0) return;
    var rule = rules[colName];
    if (!rule) return;
    sheet.getRange(row, colIdx + 1).setDataValidation(rule);
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
    if (colName === 'zichtbaar') return; // default ja separately
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) return;
    var cell = sheet.getRange(row, colIdx + 1);
    if (!String(cell.getValue() || '').trim()) cell.setValue('random');
  });
  var iZ = headers.indexOf('zichtbaar');
  if (iZ >= 0) {
    var z = sheet.getRange(row, iZ + 1);
    if (!String(z.getValue() || '').trim()) z.setValue('ja');
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
