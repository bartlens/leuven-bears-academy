/**
 * Plak dit in de AANWEZIGHEID-spreadsheet:
 * Extensies → Apps Script → nieuw bestand → plak → opslaan.
 *
 * Eerste keer: vul in tab Uitleg het veld beheer_sheet_id (alleen het ID,
 * het stuk tussen /d/ en /edit in de Beheer-URL).
 * Run syncAllesVanuitBeheer() eenmaal (rechten toestaan: ook Beheer lezen).
 *
 * Menu "Academy sync":
 * - Alles bijwerken vanuit Beheer (spelers + trainingen + matchen)
 * - Alleen spelers syncen
 *
 * Optioneel (Apps Script-editor): genereerTrainingenUitWeekschema()
 * vult Beheer → Trainingen_data voor de website-kalender (10 weken).
 *
 * Effect van syncAllesVanuitBeheer (U10 C-oriëntatie):
 * - Spelers_ref vanuit Beheer!Spelers (gesorteerd op nummer)
 * - Sessies-index (coach) vanuit weekschema + Trainingen_data + Matchen
 * - Tab Trainingen: 1 rij per kind, kolommen = trainingen, vinkje = komt, Totaal
 * - Tab Wedstrijden: 1 rij per kind, per match 2 kolommen
 *   (Kan aanwezig zijn + Heeft gespeeld), Totaal gespeeld
 * - Bestaande vinkjes blijven via (speler + sessie_id[+veld]); ook migratie
 *   vanuit oude tab Aanwezigheid (sessie-rijen)
 * - Aanwezigheid_per_speler: alleen nieuwe sessie×speler-rijen
 */

var TZ_ = 'Europe/Brussels';
var WEEKDAYS_NL_ = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
var WEEKDAY_SHORT_ = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
var WEEKDAY_NUM_ = {
  zondag: 0, maandag: 1, dinsdag: 2, woensdag: 3,
  donderdag: 4, vrijdag: 5, zaterdag: 6,
  zo: 0, ma: 1, di: 2, wo: 3, do: 4, vr: 5, za: 6,
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

var SHEET_TRAININGEN_ = 'Trainingen';
var SHEET_WEDSTRIJDEN_ = 'Wedstrijden';
var SHEET_OUD_MATRIX_ = 'Aanwezigheid';

/** Volledige sync: spelers + sessies + matrices. */
function syncAllesVanuitBeheer() {
  var ss = SpreadsheetApp.getActive();
  var beheer = openBeheer_(ss);
  var players = readPlayersFromBeheer_(beheer);

  writeSpelersRef_(ss, players);

  var sessies = buildSessiesVanuitBeheer_(beheer);
  writeSessies_(ss, sessies);

  var trainings = sessies.filter(function (s) { return s.type === 'training'; });
  var matches = sessies.filter(function (s) { return s.type === 'match'; });

  var existing = collectAllAttendanceMaps_(ss);
  writeTrainingenMatrix_(ss, players, trainings, existing);
  writeWedstrijdenMatrix_(ss, players, matches, existing);
  ensureTallRows_(ss, players, sessies);

  ss.toast(
    players.length + ' spelers · ' + trainings.length + ' trainingen · ' +
      matches.length + ' wedstrijden (vinkjes bewaard).',
    'Academy sync',
    8
  );
}

/** Alleen spelers (herbouw matrices met bestaande Sessies-index). */
function syncSpelersFromBeheer() {
  var ss = SpreadsheetApp.getActive();
  var beheer = openBeheer_(ss);
  var players = readPlayersFromBeheer_(beheer);

  writeSpelersRef_(ss, players);

  var sessiesSheet = ss.getSheetByName('Sessies');
  var sessies = sessiesSheet ? readSessiesFromSheet_(sessiesSheet) : [];
  var trainings = sessies.filter(function (s) { return s.type === 'training'; });
  var matches = sessies.filter(function (s) { return s.type === 'match'; });

  var existing = collectAllAttendanceMaps_(ss);
  writeTrainingenMatrix_(ss, players, trainings, existing);
  writeWedstrijdenMatrix_(ss, players, matches, existing);
  ensureTallRows_(ss, players, sessies);

  ss.toast(players.length + ' spelers gesynchroniseerd.', 'Academy sync', 6);
}

/**
 * Bonus: schrijf ontbrekende trainingsdata (10 weken) naar Beheer → Trainingen_data
 * (handig voor de website-kalender). Overslaat bestaande data; raakt status=nee niet aan.
 * Daarna volledige sync.
 */
function genereerTrainingenUitWeekschema() {
  var ss = SpreadsheetApp.getActive();
  var beheer = openBeheer_(ss);
  var week = readTrainingenWeek_(beheer);
  var dataSheet = beheer.getSheetByName('Trainingen_data');
  if (!dataSheet) throw new Error('Beheer heeft geen tab "Trainingen_data"');

  var existing = readTrainingenDataMap_(dataSheet);
  var candidates = expandWeekDates_(week, 10);
  var added = 0;
  var headers = dataSheet.getRange(1, 1, 1, Math.max(dataSheet.getLastColumn(), 1)).getValues()[0].map(String);
  var colCount = Math.max(headers.length, 6);

  if (!headers[0] || String(headers[0]).trim() !== 'datum') {
    dataSheet.clear();
    dataSheet.getRange(1, 1, 1, 6).setValues([['datum', 'status', 'start', 'einde', 'locatie', 'notitie']]);
    headers = ['datum', 'status', 'start', 'einde', 'locatie', 'notitie'];
    colCount = 6;
    existing = {};
  }

  var iDat = headers.indexOf('datum');
  var iStat = headers.indexOf('status');
  var iStart = headers.indexOf('start');
  var iEinde = headers.indexOf('einde');
  var iLoc = headers.indexOf('locatie');
  var iNot = headers.indexOf('notitie');
  if (iDat < 0) iDat = 0;
  if (iStat < 0) iStat = 1;
  if (iStart < 0) iStart = 2;
  if (iEinde < 0) iEinde = 3;
  if (iLoc < 0) iLoc = 4;
  if (iNot < 0) iNot = 5;

  candidates.forEach(function (c) {
    if (existing[c.datum]) return;
    var row = [];
    for (var i = 0; i < colCount; i++) row.push('');
    row[iDat] = c.datum;
    row[iStat] = 'ja';
    row[iStart] = c.start || '';
    row[iEinde] = c.einde || '';
    row[iLoc] = c.locatie || '';
    row[iNot] = '';
    dataSheet.appendRow(row.slice(0, colCount));
    existing[c.datum] = { status: 'ja', start: c.start, einde: c.einde, locatie: c.locatie, notitie: '' };
    added++;
  });

  ss.toast(added + ' trainingsdag(en) toegevoegd in Beheer → Trainingen_data.', 'Academy sync', 8);
  syncAllesVanuitBeheer();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Academy sync')
    .addItem('Alles bijwerken vanuit Beheer (spelers + trainingen + matchen)', 'syncAllesVanuitBeheer')
    .addItem('Alleen spelers syncen', 'syncSpelersFromBeheer')
    .addItem('Ja/Nee chips + zachte kleuren', 'styleJaNeeChipsNu')
    .addToUi();
}

// ── Beheer openen / spelers ──────────────────────────────────────────

function openBeheer_(ss) {
  var uitleg = ss.getSheetByName('Uitleg');
  if (!uitleg) throw new Error('Tab "Uitleg" ontbreekt');
  var beheerId = lookupUitleg_(uitleg, 'beheer_sheet_id');
  if (!beheerId || beheerId.indexOf('BEHEER') === 0) {
    throw new Error('Zet een echte beheer_sheet_id in tab Uitleg');
  }
  return SpreadsheetApp.openById(beheerId);
}

function lookupUitleg_(sheet, key) {
  var values = sheet.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === key) return String(values[i][1] || '').trim();
  }
  return '';
}

function readPlayersFromBeheer_(beheer) {
  var spelersSheet = beheer.getSheetByName('Spelers');
  if (!spelersSheet) throw new Error('Beheer heeft geen tab "Spelers"');

  var data = spelersSheet.getDataRange().getValues();
  if (data.length < 2) return [];

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
  players.sort(function (a, b) { return Number(a.nummer) - Number(b.nummer); });
  return players;
}

function writeSpelersRef_(ss, players) {
  var sh = ss.getSheetByName('Spelers_ref') || ss.insertSheet('Spelers_ref');
  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['nummer', 'voornaam', 'rij_label', 'actief']]);
  if (!players.length) return;
  var rows = players.map(function (p) {
    return [p.nummer, p.voornaam, p.header, 'ja'];
  });
  sh.getRange(2, 1, rows.length, 4).setValues(rows);
}

// ── Sessies bouwen ───────────────────────────────────────────────────

function buildSessiesVanuitBeheer_(beheer) {
  var week = readTrainingenWeek_(beheer);
  var dataSheet = beheer.getSheetByName('Trainingen_data');
  var dataMap = dataSheet ? readTrainingenDataMap_(dataSheet) : {};
  var byId = {};

  expandWeekDates_(week, 10).forEach(function (c) {
    var override = dataMap[c.datum];
    if (override && isNee_(override.status)) return;
    var start = c.start;
    var locatie = c.locatie;
    var notitie = '';
    if (override && isJa_(override.status)) {
      if (override.start) start = override.start;
      if (override.locatie) locatie = override.locatie;
      notitie = override.notitie || '';
    }
    var sessie = makeTrainingSessie_(c.datum, start, locatie, notitie);
    byId[sessie.sessie_id] = sessie;
  });

  Object.keys(dataMap).forEach(function (datum) {
    var d = dataMap[datum];
    if (isNee_(d.status)) return;
    if (byId['t-' + datum]) return;
    byId['t-' + datum] = makeTrainingSessie_(datum, d.start, d.locatie, d.notitie);
  });

  var matchen = readMatchen_(beheer);
  var matchIdsPerDay = {};
  matchen.forEach(function (m) {
    matchIdsPerDay[m.datum] = (matchIdsPerDay[m.datum] || 0) + 1;
  });
  var dayCount = {};
  matchen.forEach(function (m) {
    dayCount[m.datum] = (dayCount[m.datum] || 0) + 1;
    var needTime = matchIdsPerDay[m.datum] > 1;
    var id = 'm-' + m.datum;
    if (needTime && m.uur) {
      id += '-' + String(m.uur).replace(':', '');
    } else if (needTime) {
      id += '-' + dayCount[m.datum];
    }
    byId[id] = {
      sessie_id: id,
      type: 'match',
      datum: m.datum,
      uur: m.uur || '',
      label: m.label,
      locatie: m.locatie || '',
      tegenstander: m.tegenstander || '',
      zichtbaar: 'ja',
    };
  });

  var list = Object.keys(byId).map(function (k) { return byId[k]; });
  list.sort(function (a, b) {
    if (a.datum < b.datum) return -1;
    if (a.datum > b.datum) return 1;
    if (a.uur < b.uur) return -1;
    if (a.uur > b.uur) return 1;
    return String(a.sessie_id).localeCompare(String(b.sessie_id));
  });
  return list;
}

function makeTrainingSessie_(datum, start, locatie, notitie) {
  var wd = weekdayIndexFromIso_(datum);
  var shortDay = WEEKDAY_SHORT_[wd] || '';
  var shortLoc = shortLoc_(locatie);
  var label = ('Training ' + shortDay + (shortLoc ? ' ' + shortLoc : '')).trim();
  return {
    sessie_id: 't-' + datum,
    type: 'training',
    datum: datum,
    uur: formatTime_(start) || '',
    label: label,
    locatie: String(locatie || '').trim(),
    zichtbaar: 'ja',
  };
}

function readTrainingenWeek_(beheer) {
  var sh = beheer.getSheetByName('Trainingen_week');
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  var iDag = headers.indexOf('dag');
  var iAct = headers.indexOf('actief');
  var iStart = headers.indexOf('start');
  var iEinde = headers.indexOf('einde');
  var iLoc = headers.indexOf('locatie');
  if (iDag < 0) return [];

  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var dag = String(row[iDag] || '').trim().toLowerCase();
    if (!dag) continue;
    if (iAct >= 0) {
      var actief = String(row[iAct] || '').trim().toLowerCase();
      if (!(actief === 'ja' || actief === 'yes' || actief === 'true' || actief === '1')) continue;
    }
    var wd = WEEKDAY_NUM_[dag];
    if (wd === undefined) continue;
    out.push({
      weekday: wd,
      dag: dag,
      start: formatTime_(row[iStart]),
      einde: formatTime_(iEinde >= 0 ? row[iEinde] : ''),
      locatie: String(iLoc >= 0 ? row[iLoc] || '' : '').trim(),
    });
  }
  return out;
}

function readTrainingenDataMap_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return {};
  var headers = data[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  var iDat = headers.indexOf('datum');
  var iStat = headers.indexOf('status');
  var iStart = headers.indexOf('start');
  var iEinde = headers.indexOf('einde');
  var iLoc = headers.indexOf('locatie');
  var iNot = headers.indexOf('notitie');
  if (iDat < 0) return {};

  var map = {};
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var datum = formatDateIso_(row[iDat]);
    if (!datum) continue;
    map[datum] = {
      status: String(iStat >= 0 ? row[iStat] || '' : 'ja').trim(),
      start: formatTime_(iStart >= 0 ? row[iStart] : ''),
      einde: formatTime_(iEinde >= 0 ? row[iEinde] : ''),
      locatie: String(iLoc >= 0 ? row[iLoc] || '' : '').trim(),
      notitie: String(iNot >= 0 ? row[iNot] || '' : '').trim(),
    };
  }
  return map;
}

function expandWeekDates_(week, weeksAhead) {
  if (!week || !week.length) return [];
  var byWd = {};
  week.forEach(function (w) { byWd[w.weekday] = w; });

  var today = new Date();
  var startIso = Utilities.formatDate(today, TZ_, 'yyyy-MM-dd');
  var startParts = startIso.split('-');
  var y = Number(startParts[0]);
  var m = Number(startParts[1]);
  var d = Number(startParts[2]);

  var out = [];
  var totalDays = (weeksAhead || 10) * 7;
  for (var offset = 0; offset < totalDays; offset++) {
    var dt = new Date(Date.UTC(y, m - 1, d + offset));
    var iso = Utilities.formatDate(dt, 'UTC', 'yyyy-MM-dd');
    var parts = iso.split('-');
    var utcDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    var wd = utcDate.getUTCDay();
    var slot = byWd[wd];
    if (!slot) continue;
    out.push({
      datum: iso,
      start: slot.start,
      einde: slot.einde,
      locatie: slot.locatie,
    });
  }
  return out;
}

function readMatchen_(beheer) {
  var sh = beheer.getSheetByName('Matchen');
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  var iDat = headers.indexOf('datum');
  var iUur = headers.indexOf('uur');
  var iTegen = headers.indexOf('tegenstander');
  var iThuis = headers.indexOf('thuis_of_uit');
  if (iThuis < 0) iThuis = headers.indexOf('thuis_uit');
  var iLoc = headers.indexOf('locatie');
  if (iDat < 0) return [];

  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var datum = formatDateIso_(row[iDat]);
    var tegen = String(iTegen >= 0 ? row[iTegen] || '' : '').trim();
    if (!datum && !tegen) continue;
    var firstCell = String(row[0] || '').trim().toLowerCase();
    if (firstCell.indexOf('_uitleg') === 0) continue;
    if (!datum) continue;
    if (!tegen) continue;
    if (/voorbeeld/i.test(tegen)) continue;
    if (/^_/.test(tegen)) continue;

    var thuisRaw = String(iThuis >= 0 ? row[iThuis] || '' : '').trim().toLowerCase();
    var thuisLabel = 'Thuis';
    if (thuisRaw.indexOf('uit') === 0 || thuisRaw === 'away') thuisLabel = 'Uit';
    else if (thuisRaw.indexOf('thuis') === 0 || thuisRaw === 'home') thuisLabel = 'Thuis';

    var tegenClean = tegen.replace(/^vs\.?\s+/i, '').trim();
    out.push({
      datum: datum,
      uur: formatTime_(iUur >= 0 ? row[iUur] : ''),
      label: thuisLabel + ' vs ' + tegenClean,
      tegenstander: tegenClean,
      locatie: String(iLoc >= 0 ? row[iLoc] || '' : '').trim(),
    });
  }
  return out;
}

function writeSessies_(ss, sessies) {
  var sh = ss.getSheetByName('Sessies') || ss.insertSheet('Sessies');
  sh.clear();
  var headers = ['sessie_id', 'type', 'datum', 'uur', 'label', 'locatie', 'zichtbaar'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (!sessies.length) return;
  var rows = sessies.map(function (s) {
    return [s.sessie_id, s.type, s.datum, s.uur, s.label, s.locatie, s.zichtbaar || 'ja'];
  });
  sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

// ── Matrices (U10 C-oriëntatie) ──────────────────────────────────────

/**
 * Verzamel bestaande vinkjes uit Trainingen, Wedstrijden én oude Aanwezigheid.
 * Keys: "playerKey|sessie_id" (training / aanwezig) of "playerKey|sessie_id|gespeeld".
 */
function collectAllAttendanceMaps_(ss) {
  var map = {};
  mergeAttendanceMap_(map, readTrainingenAttendanceMap_(ss.getSheetByName(SHEET_TRAININGEN_)));
  mergeAttendanceMap_(map, readWedstrijdenAttendanceMap_(ss.getSheetByName(SHEET_WEDSTRIJDEN_)));
  mergeAttendanceMap_(map, readLegacyAanwezigheidMap_(ss.getSheetByName(SHEET_OUD_MATRIX_)));
  return map;
}

function mergeAttendanceMap_(into, from) {
  if (!from) return;
  Object.keys(from).forEach(function (k) { into[k] = from[k]; });
}

function lookupAtt_(map, keys, sid, field) {
  var suffix = field ? '|' + field : '';
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i] + '|' + sid + suffix;
    if (Object.prototype.hasOwnProperty.call(map, k)) return map[k];
  }
  // Fallback: training/aanwezig zonder veld-suffix
  if (!field || field === 'aan') {
    for (var j = 0; j < keys.length; j++) {
      var k2 = keys[j] + '|' + sid;
      if (Object.prototype.hasOwnProperty.call(map, k2)) return map[k2];
    }
  }
  return false;
}

/**
 * Trainingen — layout zoals origineel U10 C trainingsblad:
 * R1: Training 1, Training 2, … Totaal
 * R2: 24-8-2026, …
 * R3: sessie_id (verborgen)
 * Spelers · Totaal-rij · helper-rijen (Tafel / Truitjes / Afspraken)
 * Cellen: Ja / Nee dropdown + groen/rood/grijs (zoals origineel).
 */
function writeTrainingenMatrix_(ss, players, trainings, existing) {
  var sh = ss.getSheetByName(SHEET_TRAININGEN_) || ss.insertSheet(SHEET_TRAININGEN_);
  var sorted = (players || []).slice().sort(function (a, b) {
    return Number(a.nummer) - Number(b.nummer);
  });
  var visible = (trainings || []).filter(function (s) {
    return String(s.zichtbaar || 'ja').toLowerCase() !== 'nee';
  });
  var nSess = visible.length;
  var nCols = 1 + nSess + 1; // Naam + sessies + Totaal

  var labelRow = [''];
  var dateRow = [''];
  var idRow = ['sessie_id'];
  for (var i = 0; i < nSess; i++) {
    labelRow.push('Training ' + (i + 1));
    dateRow.push(formatDateDMyyyy_(visible[i].datum));
    idRow.push(String(visible[i].sessie_id || ''));
  }
  labelRow.push('Totaal');
  dateRow.push('');
  idRow.push('');

  var dataRows = [];
  for (var p = 0; p < sorted.length; p++) {
    var player = sorted[p];
    var row = [player.voornaam];
    var keys = playerMatchKeys_(player);
    for (var s = 0; s < nSess; s++) {
      row.push(toJaNee_(lookupAtt_(existing, keys, String(visible[s].sessie_id || ''), null)));
    }
    row.push('');
    dataRows.push(row);
  }

  var totalRow = ['Totaal'];
  for (var t = 0; t < nSess; t++) totalRow.push('');
  totalRow.push('');

  var helperRows = [
    [''],
    ['Tafel'],
    ['Truitjes en fruitje'],
    ['Afspraken zie apart blad']
  ];

  resetSheet_(sh);
  var all = [labelRow, dateRow, idRow].concat(dataRows);
  if (sorted.length) all.push(totalRow);
  all = all.concat(helperRows);
  sh.getRange(1, 1, all.length, nCols).setValues(all);

  var firstPlayerRow = 4;
  var lastPlayerRow = 3 + sorted.length;
  var totRowNum = sorted.length ? lastPlayerRow + 1 : 0;

  for (var r = 0; r < sorted.length; r++) {
    var rowNum = firstPlayerRow + r;
    if (nSess > 0) {
      sh.getRange(rowNum, nCols).setFormula(
        '=COUNTIF(' + colToLetter_(2) + rowNum + ':' + colToLetter_(1 + nSess) + rowNum + ',"Ja")'
      );
    } else {
      sh.getRange(rowNum, nCols).setValue(0);
    }
  }
  if (sorted.length && nSess > 0) {
    for (var c = 0; c < nSess; c++) {
      var colLetter = colToLetter_(2 + c);
      sh.getRange(totRowNum, 2 + c).setFormula(
        '=COUNTIF(' + colLetter + firstPlayerRow + ':' + colLetter + lastPlayerRow + ',"Ja")'
      );
    }
  }

  sh.getRange(1, 1, 1, nCols)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.getRange(2, 1, 2, nCols)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setNumberFormat('@');
  if (sorted.length) {
    sh.getRange(totRowNum, 1, totRowNum, nCols).setFontWeight('bold');
  }

  var blankAfterTotal = totRowNum ? totRowNum + 1 : lastPlayerRow + 1;
  var tafelRow = blankAfterTotal + 1;
  sh.getRange(tafelRow, 1, tafelRow + 2, 1).setFontWeight('bold');
  sh.getRange(tafelRow, 1, tafelRow + 2, nCols).setBackground('#F5F5F5');

  if (sh.getMaxRows() >= 3) sh.hideRows(3);
  sh.setFrozenColumns(1);
  sh.setFrozenRows(2);
  sh.setColumnWidth(1, 160);
  for (var cw = 2; cw <= 1 + nSess; cw++) sh.setColumnWidth(cw, 100);
  sh.setColumnWidth(nCols, 70);
  sh.setRowHeight(1, 28);
  sh.setRowHeight(2, 28);

  if (sorted.length && nSess > 0) {
    applyJaNeeValidation_(sh.getRange(firstPlayerRow, 2, lastPlayerRow, 1 + nSess));
  }
}

function formatDateDMyyyy_(iso) {
  var s = String(iso || '').trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return String(Number(m[3])) + '-' + String(Number(m[2])) + '-' + m[1];
}

function toJaNee_(v) {
  if (v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1') return 'Ja';
  if (v === false || v === 'FALSE' || v === 'false' || v === 0 || v === '0') return 'Nee';
  var t = String(v == null ? '' : v).trim().toLowerCase();
  if (!t || t === '?' || t === 'onbekend') return '';
  if (t === 'ja' || t === 'j' || t === 'yes' || t === 'y' || t === 'x' || t === '✓' || t === '✔') return 'Ja';
  if (t === 'nee' || t === 'n' || t === 'no') return 'Nee';
  return '';
}

/** Zachte kleuren zoals origineel U10 C-blad (niet neon). */
var JA_NEE_COLORS_ = {
  jaBg: '#D9EAD3',
  jaFg: '#274E13',
  neeBg: '#F4CCCC',
  neeFg: '#990000',
  leegBg: '#F3F3F3'
};

function applyJaNeeValidation_(range) {
  var values = range.getValues();
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      values[r][c] = toJaNee_(values[r][c]);
    }
  }
  range.setValues(values);
  styleJaNeeRange_(range);
}

/**
 * Chip-dropdowns (pill-knoppen) + zachte CF. Waarden blijven intact.
 * Probeert Sheets API displayStyle=CHIP; valt terug op gewone dropdown.
 */
function styleJaNeeRange_(range) {
  range.clearDataValidations();
  try { range.removeCheckboxes(); } catch (e) {}

  var chipOk = trySetJaNeeChips_(range);
  if (!chipOk) {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Ja', 'Nee'], true)
      .setAllowInvalid(true)
      .setHelpText('Ja of Nee')
      .build();
    range.setDataValidation(rule);
  }

  var sheet = range.getSheet();
  // Vervang enkel onze Ja/Nee-regels op dit bereik: clear all CF then callers
  // often clear sheet first. Hier: append zachte regels.
  var existing = sheet.getConditionalFormatRules();
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Ja')
    .setBackground(JA_NEE_COLORS_.jaBg)
    .setFontColor(JA_NEE_COLORS_.jaFg)
    .setRanges([range])
    .build());
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Nee')
    .setBackground(JA_NEE_COLORS_.neeBg)
    .setFontColor(JA_NEE_COLORS_.neeFg)
    .setRanges([range])
    .build());
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenCellEmpty()
    .setBackground(JA_NEE_COLORS_.leegBg)
    .setRanges([range])
    .build());
  sheet.setConditionalFormatRules(existing);
  range.setHorizontalAlignment('center').setVerticalAlignment('middle');
  range.setFontWeight('bold');
}

/** Sheets Advanced Service — pill chips. false = niet beschikbaar. */
function trySetJaNeeChips_(range) {
  try {
    if (typeof Sheets === 'undefined' || !Sheets.Spreadsheets) return false;
    var ss = range.getSheet().getParent();
    var sheetId = range.getSheet().getSheetId();
    var req = {
      requests: [{
        setDataValidation: {
          range: {
            sheetId: sheetId,
            startRowIndex: range.getRow() - 1,
            endRowIndex: range.getRow() - 1 + range.getNumRows(),
            startColumnIndex: range.getColumn() - 1,
            endColumnIndex: range.getColumn() - 1 + range.getNumColumns()
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: [
                { userEnteredValue: 'Ja' },
                { userEnteredValue: 'Nee' }
              ]
            },
            showCustomUi: true,
            strict: false,
            displayStyle: 'CHIP'
          }
        }
      }]
    };
    Sheets.Spreadsheets.batchUpdate(req, ss.getId());
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Herstijl bestaande Trainingen + Wedstrijden zonder sync (waarden blijven).
 * Menu: Academy sync → Ja/Nee chips + zachte kleuren.
 */
function styleJaNeeChipsNu() {
  var ss = SpreadsheetApp.getActive();
  var n = 0;
  n += styleJaNeeOnSheet_(ss.getSheetByName(SHEET_TRAININGEN_), 4);
  n += styleJaNeeOnSheet_(ss.getSheetByName(SHEET_WEDSTRIJDEN_), 4);
  ss.toast('Ja/Nee gestyled op ' + n + ' celbereik(en).', 'Academy sync', 6);
}

function styleJaNeeOnSheet_(sh, firstPlayerRow) {
  if (!sh) return 0;
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < firstPlayerRow || lastCol < 2) return 0;

  // Find last player row (before Totaal / helpers)
  var names = sh.getRange(firstPlayerRow, 1, lastRow, 1).getDisplayValues();
  var lastPlayer = firstPlayerRow - 1;
  for (var i = 0; i < names.length; i++) {
    var n = String(names[i][0] || '').trim();
    if (!n) break;
    if (n === 'Totaal' || n.indexOf('Tafel') === 0 || n.indexOf('Truitjes') === 0 || n.indexOf('Afspraken') === 0) break;
    lastPlayer = firstPlayerRow + i;
  }
  if (lastPlayer < firstPlayerRow) return 0;

  // Session cols: B .. lastCol-1 if last is Totaal, else B..lastCol
  var endCol = lastCol;
  var header = String(sh.getRange(1, lastCol).getDisplayValue() || '').toLowerCase();
  if (header.indexOf('totaal') >= 0) endCol = lastCol - 1;
  if (endCol < 2) return 0;

  var range = sh.getRange(firstPlayerRow, 2, lastPlayer, endCol);
  // Soft CF: clear previous conditional rules on sheet then re-apply only for this
  // (Wedstrijden+Trainingen both call this — second call would duplicate.
  //  Clear all CF once per sheet here.)
  sh.clearConditionalFormatRules();
  styleJaNeeRange_(range);
  return 1;
}


function matchHeaderLabel_(s) {
  // Zoals origineel: datum + tegenstander (+ thuis/uit + uur)
  var lines = [];
  var ddmm = formatDateDdMm_(s.datum);
  var wd = weekdayIndexFromIso_(s.datum);
  var dayName = WEEKDAYS_NL_[wd] || '';
  if (dayName) dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  if (ddmm) lines.push((dayName ? dayName + ' ' : '') + ddmm);
  var tegen = String(s.tegenstander || '').trim();
  if (!tegen) {
    // strip "Thuis vs " / "Uit vs "
    tegen = String(s.label || '').replace(/^(Thuis|Uit)\s+vs\s+/i, '').trim();
  }
  if (tegen) lines.push(tegen);
  var where = [];
  if (s.label && /^(Thuis|Uit)/i.test(String(s.label))) {
    where.push(String(s.label).indexOf('Uit') === 0 ? 'Uit' : 'Thuis');
  }
  if (s.uur) where.push(String(s.uur));
  if (s.locatie) where.push(shortLoc_(s.locatie) || s.locatie);
  if (where.length) lines.push(where.join(' · '));
  return lines.join('\n') || String(s.sessie_id || '');
}

function styleMatrixHeader_(sh, nCols, rowHeight) {
  sh.getRange(1, 1, 1, nCols)
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');
  sh.setRowHeight(1, rowHeight || 52);
}

function resetSheet_(sh) {
  sh.clear();
  sh.clearConditionalFormatRules();
  try {
    var merges = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).getMergedRanges();
    for (var i = 0; i < merges.length; i++) merges[i].breakApart();
  } catch (e) {}
  try { sh.showRows(1, Math.max(sh.getMaxRows(), 3)); } catch (e2) {}
  try { sh.setFrozenColumns(0); sh.setFrozenRows(0); } catch (e3) {}
}

function applyCheckboxesWithColors_(range) {
  var values = range.getValues();
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      values[r][c] = toCheckboxBool_(values[r][c]);
    }
  }
  range.setValues(values);
  range.insertCheckboxes();

  // TRUE = lichtgroen, FALSE = lichtrood (duidelijk voor ouders)
  var sheet = range.getSheet();
  var existing = sheet.getConditionalFormatRules();
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenCellTrue()
    .setBackground('#C8E6C9')
    .setRanges([range])
    .build());
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenCellFalse()
    .setBackground('#FFCDD2')
    .setRanges([range])
    .build());
  sheet.setConditionalFormatRules(existing);
}

function applyCheckboxesPlain_(range) {
  var values = range.getValues();
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      values[r][c] = toCheckboxBool_(values[r][c]);
    }
  }
  range.setValues(values);
  range.insertCheckboxes();
}

function toCheckboxBool_(v) {
  if (v === true || v === false) return v;
  var s = String(v == null ? '' : v).trim().toLowerCase();
  if (!s) return false;
  if (s === 'j' || s === 'ja' || s === 'yes' || s === 'true' || s === '1' || s === '✅' || s === 'x') return true;
  return false;
}

// ── Attendance map readers ───────────────────────────────────────────

function readTrainingenAttendanceMap_(sh) {
  var map = {};
  if (!sh || sh.getLastRow() < 2 || sh.getLastColumn() < 2) return map;
  var values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  var headers = values[0];
  var row2 = values[1] || [];
  var isNew = String(row2[0] || '').trim().toLowerCase() === 'sessie_id' ||
    looksLikeSessieIdRow_(row2);
  if (!isNew) return map;

  var sessIds = [];
  for (var c = 1; c < headers.length; c++) {
    var h = String(headers[c] || '').trim();
    var sid = String(row2[c] || '').trim();
    if (/^totaal/i.test(h) || !sid || sid.indexOf('|') >= 0) sessIds.push(null);
    else sessIds.push(sid);
  }
  for (var r = 2; r < values.length; r++) {
    var name = String(values[r][0] || '').trim();
    if (!name || /^totaal$/i.test(name)) continue;
    var keys = parsePlayerKeysFromLabel_(name);
    for (var ci = 0; ci < sessIds.length; ci++) {
      if (!sessIds[ci]) continue;
      var b = toCheckboxBool_(values[r][ci + 1]);
      storePlayerKeys_(map, keys, sessIds[ci], null, b);
    }
  }
  return map;
}

function readWedstrijdenAttendanceMap_(sh) {
  var map = {};
  if (!sh || sh.getLastRow() < 3 || sh.getLastColumn() < 2) return map;
  var values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  var row2 = values[1] || [];
  if (!(String(row2[0] || '').trim().toLowerCase() === 'sessie_id' || looksLikeSessieIdRow_(row2))) {
    return map;
  }

  // Bepaal data-start: rij met "Kan aanwezig zijn" of rij 3
  var dataStart = 3;
  for (var r = 2; r < Math.min(values.length, 6); r++) {
    var joined = values[r].map(String).join(' ').toLowerCase();
    if (joined.indexOf('kan aanwezig') >= 0 || joined.indexOf('heeft gespeeld') >= 0) {
      dataStart = r + 1;
      break;
    }
  }

  var pairs = [];
  for (var c = 1; c < row2.length; c++) {
    var raw = String(row2[c] || '').trim();
    if (!raw || /^totaal/i.test(String(values[0][c] || ''))) continue;
    if (raw.indexOf('|gespeeld') >= 0) {
      var sidG = raw.split('|')[0];
      pairs.push({ col: c, sid: sidG, field: 'gespeeld' });
    } else if (/^[tm]-/.test(raw)) {
      pairs.push({ col: c, sid: raw, field: 'aan' });
    }
  }

  for (var r2 = dataStart; r2 < values.length; r2++) {
    var name = String(values[r2][0] || '').trim();
    if (!name || /^totaal$/i.test(name)) continue;
    var keys = parsePlayerKeysFromLabel_(name);
    for (var pi = 0; pi < pairs.length; pi++) {
      var p = pairs[pi];
      var b = toCheckboxBool_(values[r2][p.col]);
      storePlayerKeys_(map, keys, p.sid, p.field, b);
      if (p.field === 'aan') storePlayerKeys_(map, keys, p.sid, null, b);
    }
  }
  return map;
}

/** Oude matrix: sessie = rij, speler = kolom. */
function readLegacyAanwezigheidMap_(sh) {
  var map = {};
  if (!sh || sh.getLastRow() < 2 || sh.getLastColumn() < 2) return map;
  var values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  var headers = values[0].map(function (h) { return String(h || ''); });

  // Nieuwe layout per ongeluk op Aanwezigheid? hergebruik training-reader
  var row2 = values[1] || [];
  if (String(row2[0] || '').trim().toLowerCase() === 'sessie_id' || looksLikeSessieIdRow_(row2)) {
    return readTrainingenAttendanceMap_(sh);
  }

  var iId = headers.indexOf('sessie_id');
  if (iId < 0) return map;
  var lead = {
    sessie_id: 1, datum: 1, type: 1, label: 1,
    notitie_coach: 1, uur: 1, locatie: 1, totaal: 1,
  };
  var playerCols = [];
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim();
    if (!h || lead[h.toLowerCase()]) continue;
    playerCols.push({ col: c, keys: parsePlayerKeysFromLabel_(h) });
  }
  for (var r = 1; r < values.length; r++) {
    var sid = String(values[r][iId] || '').trim();
    if (!sid) continue;
    for (var pi = 0; pi < playerCols.length; pi++) {
      var pc = playerCols[pi];
      var b = toCheckboxBool_(values[r][pc.col]);
      storePlayerKeys_(map, pc.keys, sid, null, b);
      storePlayerKeys_(map, pc.keys, sid, 'aan', b);
    }
  }
  return map;
}

function looksLikeSessieIdRow_(row) {
  for (var c = 1; c < row.length; c++) {
    if (/^[tm]-/.test(String(row[c] || '').trim())) return true;
  }
  return false;
}

function storePlayerKeys_(map, keys, sid, field, boolVal) {
  var suffix = field ? '|' + field : '';
  for (var i = 0; i < keys.length; i++) {
    map[keys[i] + '|' + sid + suffix] = boolVal;
  }
}

function playerMatchKeys_(player) {
  return parsePlayerKeysFromLabel_(player.header).concat([
    String(player.nummer),
    '#' + player.nummer,
    String(player.voornaam || '').trim(),
    String(player.voornaam || '').trim().toLowerCase(),
  ]);
}

function parsePlayerKeysFromLabel_(label) {
  var s = String(label || '').trim();
  var keys = [];
  if (!s) return keys;
  keys.push(s);
  keys.push(s.toLowerCase());
  var m = s.match(/^#\s*(\d+)\s+(.+)$/);
  if (m) {
    keys.push(m[1]);
    keys.push('#' + m[1]);
    keys.push('#' + m[1] + ' ' + m[2].trim());
    keys.push(m[2].trim());
    keys.push(m[2].trim().toLowerCase());
  } else {
    m = s.match(/^#(\d+)$/);
    if (m) {
      keys.push(m[1]);
      keys.push('#' + m[1]);
    }
  }
  return keys;
}

function colToLetter_(col) {
  var s = '';
  var n = Number(col);
  while (n > 0) {
    var r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function formatDateDdMm_(iso) {
  var parts = String(iso || '').split('-');
  if (parts.length >= 3) return pad2_(parts[2]) + '/' + pad2_(parts[1]);
  return String(iso || '');
}

/**
 * Tall format: alleen nieuwe sessie×speler-combo's.
 */
function ensureTallRows_(ss, players, sessies) {
  var tall = ss.getSheetByName('Aanwezigheid_per_speler');
  if (!tall) return;

  if (!sessies) {
    var sessiesSheet = ss.getSheetByName('Sessies');
    if (!sessiesSheet) return;
    sessies = readSessiesFromSheet_(sessiesSheet);
  }

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
  sessies.forEach(function (s) {
    if (String(s.zichtbaar || 'ja').toLowerCase() === 'nee') return;
    var sid = String(s.sessie_id || '');
    if (!sid) return;
    players.forEach(function (p) {
      var key = sid + '|' + String(p.nummer);
      if (!existing[key]) {
        toAdd.push([
          sid, s.datum, s.type, s.label, p.nummer, p.voornaam, '', '', '',
        ]);
        existing[key] = true;
      }
    });
  });
  if (toAdd.length) {
    tall.getRange(tall.getLastRow() + 1, 1, toAdd.length, 9).setValues(toAdd);
  }
}

function readSessiesFromSheet_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(String);
  var iId = headers.indexOf('sessie_id');
  var iType = headers.indexOf('type');
  var iDat = headers.indexOf('datum');
  var iUur = headers.indexOf('uur');
  var iLab = headers.indexOf('label');
  var iLoc = headers.indexOf('locatie');
  var iVis = headers.indexOf('zichtbaar');
  if (iId < 0) return [];
  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var sid = String(row[iId] || '').trim();
    if (!sid) continue;
    out.push({
      sessie_id: sid,
      type: iType >= 0 ? row[iType] : '',
      datum: formatDateIso_(iDat >= 0 ? row[iDat] : '') || String(iDat >= 0 ? row[iDat] : ''),
      uur: formatTime_(iUur >= 0 ? row[iUur] : ''),
      label: iLab >= 0 ? row[iLab] : '',
      locatie: iLoc >= 0 ? row[iLoc] : '',
      zichtbaar: iVis >= 0 ? row[iVis] : 'ja',
    });
  }
  return out;
}

// ── Helpers ──────────────────────────────────────────────────────────

function isJa_(v) {
  var s = String(v || '').trim().toLowerCase();
  return s === 'ja' || s === 'yes' || s === 'true' || s === '1' || s === '';
}

function isNee_(v) {
  var s = String(v || '').trim().toLowerCase();
  return s === 'nee' || s === 'no' || s === 'false' || s === '0';
}

function formatDateIso_(v) {
  if (v === '' || v == null) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, TZ_, 'yyyy-MM-dd');
  }
  var s = String(v).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (m) {
    return m[3] + '-' + pad2_(m[2]) + '-' + pad2_(m[1]);
  }
  return '';
}

function formatTime_(v) {
  if (v === '' || v == null) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, TZ_, 'HH:mm');
  }
  var s = String(v).trim();
  var m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return pad2_(m[1]) + ':' + m[2];
  return s;
}

function pad2_(n) {
  var s = String(n);
  return s.length < 2 ? '0' + s : s;
}

function weekdayIndexFromIso_(iso) {
  var parts = String(iso).split('-');
  if (parts.length < 3) return 0;
  var utcDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return utcDate.getUTCDay();
}

function shortLoc_(loc) {
  var s = String(loc || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (!s) return '';
  if (/^Campus\s+/i.test(s)) s = s.replace(/^Campus\s+/i, '');
  var parts = s.split(/\s+/);
  if (parts.length > 1 && /^(Heverlee|Leuven)$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join(' ');
}
