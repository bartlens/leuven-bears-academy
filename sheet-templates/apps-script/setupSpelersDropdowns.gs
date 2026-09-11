/**
 * BEHEER Spelers — chip-dropdowns voor alle coaches.
 *
 * Extensies → Apps Script → plak → opslaan.
 * 1× installSpelersTriggers() (rechten), 1× setupSpelersDropdowns().
 *
 * Validatielijsten komen altijd uit Keuzelijsten (nieuwe huid/haar/kapsel
 * verschijnen zo in de chips). Grijze pill-opmaak wordt gekopieerd van
 * een bestaande rij.
 */

var SPELERS_DROPDOWN_COLS = [
  'label', 'emoji', 'accent', 'move', 'haarstijl', 'haarkleur', 'huidskleur',
];
var SPELERS_ROW_START = 2;
var SPELERS_ROW_END = 200;

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
  SpreadsheetApp.getActive().toast('Installable onEdit gezet.', 'Academy Beheer', 5);
}

function setupSpelersDropdowns() {
  var ss = SpreadsheetApp.getActive();
  var spelers = ss.getSheetByName('Spelers');
  var keuzes = ss.getSheetByName('Keuzelijsten');
  if (!spelers) throw new Error('Tab "Spelers" ontbreekt');
  if (!keuzes) throw new Error('Tab "Keuzelijsten" ontbreekt');

  deleteColumnIfPresent_(spelers, 'volgorde');
  deleteColumnIfPresent_(spelers, 'zichtbaar');

  var headers = getHeaders_(spelers);
  var lists = readKeuzelijsten_(keuzes);
  var rules = buildRules_(lists, headers);
  var templateRow = findFormatTemplateRow_(spelers, headers);

  var filled = 0;
  for (var row = SPELERS_ROW_START; row <= SPELERS_ROW_END; row++) {
    if (!rowHasPlayer_(spelers, headers, row)) {
      clearDropdownsOnRow_(spelers, headers, row);
      continue;
    }
    applyFreshDropdownsWithChipFormat_(spelers, headers, rules, templateRow, row);
    fillEmptyAppearanceWithRandomOnRow_(spelers, headers, row);
    filled++;
  }

  // toast i.p.v. alert — blokkeert de editor niet
  ss.toast('Chip-dropdowns gezet op ' + filled + ' rij(en).', 'Academy Beheer', 8);
}

function onEditSpelersDefaults(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Spelers') return;
  var row = e.range.getRow();
  if (row < SPELERS_ROW_START || row > SPELERS_ROW_END) return;

  var headers = getHeaders_(sheet);
  var keuzes = SpreadsheetApp.getActive().getSheetByName('Keuzelijsten');
  if (!keuzes) return;
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

  var templateRow = findFormatTemplateRow_(sheet, headers);
  applyFreshDropdownsWithChipFormat_(sheet, headers, rules, templateRow, row);
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

/** Row to copy grey pill FORMAT from (not validation lists). */
function findFormatTemplateRow_(sheet, headers) {
  var colIdx = headers.indexOf(SPELERS_DROPDOWN_COLS[0]);
  if (colIdx < 0) return 0;
  for (var row = SPELERS_ROW_START; row <= SPELERS_ROW_END; row++) {
    if (!rowHasPlayer_(sheet, headers, row)) continue;
    if (sheet.getRange(row, colIdx + 1).getDataValidation()) return row;
  }
  return 0;
}

/**
 * Fresh list from Keuzelijsten + chip-achtige opmaak van template.
 * setDataValidation vernieuwt de keuzes; PASTE_FORMAT houdt de pill-look.
 */
function applyFreshDropdownsWithChipFormat_(sheet, headers, rules, templateRow, row) {
  SPELERS_DROPDOWN_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0 || !rules[colName]) return;
    var dest = sheet.getRange(row, colIdx + 1);
    var keep = dest.getValue();
    dest.setDataValidation(rules[colName]);
    if (templateRow && templateRow !== row) {
      sheet
        .getRange(templateRow, colIdx + 1)
        .copyTo(dest, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    }
    dest.setValue(keep);
  });
}

function clearDropdownsOnRow_(sheet, headers, row) {
  SPELERS_DROPDOWN_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) return;
    var cell = sheet.getRange(row, colIdx + 1);
    cell.clearDataValidations();
    cell.clearFormat();
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
    .addItem('Spelers chip-dropdowns zetten (nu)', 'setupSpelersDropdowns')
    .addItem('Auto-dropdowns voor alle coaches (1×)', 'installSpelersTriggers')
    .addToUi();
}
