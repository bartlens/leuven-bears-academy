/**
 * BEHEER Spelers — chip-dropdowns voor alle coaches.
 *
 * Extensies → Apps Script → plak → opslaan.
 * 1× installSpelersTriggers() (rechten), 1× setupSpelersDropdowns().
 *
 * Chip-stijl (grijze pills) blijft behouden door validatie+opmaak te
 * KOPIËREN van een bestaande rij — niet via setDataValidation (dat = pijltjes).
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
  SpreadsheetApp.getUi().alert(
    'Installable onEdit gezet. Nieuwe spelers krijgen automatisch chip-dropdowns.',
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

  var headers = getHeaders_(spelers);
  var lists = readKeuzelijsten_(keuzes);
  var rules = buildRules_(lists, headers);

  // Template EERST kiezen — nooit alle chips wissen vóór de copy.
  var templateRow = findChipTemplateRow_(spelers, headers, -1);
  if (!templateRow) {
    seedPlainValidationOnFirstPlayer_(spelers, headers, rules);
    templateRow = findChipTemplateRow_(spelers, headers, -1);
  }
  if (!templateRow) {
    SpreadsheetApp.getUi().alert('Geen spelersrij om dropdowns van te kopiëren.');
    return;
  }

  var filled = 0;
  for (var row = SPELERS_ROW_START; row <= SPELERS_ROW_END; row++) {
    if (!rowHasPlayer_(spelers, headers, row)) {
      clearDropdownsOnRow_(spelers, headers, row);
      continue;
    }
    applyChipDropdownsFromTemplate_(spelers, headers, templateRow, row);
    fillEmptyAppearanceWithRandomOnRow_(spelers, headers, row);
    filled++;
  }

  SpreadsheetApp.getUi().alert(
    'Chip-dropdowns gezet op ' + filled + ' gevulde rij(en), gekopieerd van rij ' + templateRow + '.',
  );
}

function onEditSpelersDefaults(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Spelers') return;
  var row = e.range.getRow();
  if (row < SPELERS_ROW_START || row > SPELERS_ROW_END) return;

  var headers = getHeaders_(sheet);

  if (!rowHasPlayer_(sheet, headers, row)) {
    clearDropdownsOnRow_(sheet, headers, row);
    SPELERS_DROPDOWN_COLS.forEach(function (colName) {
      var colIdx = headers.indexOf(colName);
      if (colIdx < 0) return;
      sheet.getRange(row, colIdx + 1).clearContent();
    });
    return;
  }

  var templateRow = findChipTemplateRow_(sheet, headers, row);
  if (!templateRow) {
    var keuzes = SpreadsheetApp.getActive().getSheetByName('Keuzelijsten');
    if (!keuzes) return;
    var rules = buildRules_(readKeuzelijsten_(keuzes), headers);
    seedPlainValidationOnFirstPlayer_(sheet, headers, rules);
    templateRow = findChipTemplateRow_(sheet, headers, row);
  }
  if (!templateRow) return;

  applyChipDropdownsFromTemplate_(sheet, headers, templateRow, row);
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

function findChipTemplateRow_(sheet, headers, excludeRow) {
  var colIdx = headers.indexOf(SPELERS_DROPDOWN_COLS[0]);
  if (colIdx < 0) return 0;
  for (var row = SPELERS_ROW_START; row <= SPELERS_ROW_END; row++) {
    if (row === excludeRow) continue;
    if (!rowHasPlayer_(sheet, headers, row)) continue;
    if (sheet.getRange(row, colIdx + 1).getDataValidation()) return row;
  }
  return 0;
}

/** Copy chip validation + grey pill format; keep the destination cell value. */
function applyChipDropdownsFromTemplate_(sheet, headers, templateRow, row) {
  SPELERS_DROPDOWN_COLS.forEach(function (colName) {
    var colIdx = headers.indexOf(colName);
    if (colIdx < 0) return;
    var dest = sheet.getRange(row, colIdx + 1);
    var keep = dest.getValue();
    var src = sheet.getRange(templateRow, colIdx + 1);
    src.copyTo(dest, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    src.copyTo(dest, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    dest.setValue(keep);
  });
}

function seedPlainValidationOnFirstPlayer_(sheet, headers, rules) {
  for (var row = SPELERS_ROW_START; row <= SPELERS_ROW_END; row++) {
    if (!rowHasPlayer_(sheet, headers, row)) continue;
    SPELERS_DROPDOWN_COLS.forEach(function (colName) {
      var colIdx = headers.indexOf(colName);
      if (colIdx < 0 || !rules[colName]) return;
      sheet.getRange(row, colIdx + 1).setDataValidation(rules[colName]);
    });
    return;
  }
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
