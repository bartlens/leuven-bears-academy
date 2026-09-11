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
 * Effect van syncAllesVanuitBeheer:
 * - Spelers_ref + Aanwezigheid-kolommen vanuit Beheer!Spelers
 * - Sessies herschreven vanuit weekschema + Trainingen_data + Matchen
 * - Aanwezigheid-matrix: nieuwe rijen erbij; bestaande J/N/? blijven staan
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

/** Volledige sync: spelers + sessies + matrix. */
function syncAllesVanuitBeheer() {
  var ss = SpreadsheetApp.getActive();
  var beheer = openBeheer_(ss);
  var players = readPlayersFromBeheer_(beheer);

  writeSpelersRef_(ss, players);
  ensureMatrixColumns_(ss, players);

  var sessies = buildSessiesVanuitBeheer_(beheer);
  writeSessies_(ss, sessies);
  ensureMatrixRows_(ss, sessies);
  ensureTallRows_(ss, players, sessies);

  ss.toast(
    players.length + ' spelers · ' + sessies.length + ' sessies bijgewerkt (J/N/? bewaard).',
    'Academy sync',
    8
  );
}

/** Alleen spelers (oude entry — blijft werken). */
function syncSpelersFromBeheer() {
  var ss = SpreadsheetApp.getActive();
  var beheer = openBeheer_(ss);
  var players = readPlayersFromBeheer_(beheer);

  writeSpelersRef_(ss, players);
  ensureMatrixColumns_(ss, players);
  ensureTallRows_(ss, players, null);

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

  // Zorg voor standaard headers als leeg
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
    if (existing[c.datum]) return; // al aanwezig (ook status=nee) → niet overschrijven
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
  return players;
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
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);

  players.forEach(function (p) {
    if (headers.indexOf(p.header) === -1) {
      var col = sh.getLastColumn() + 1;
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

// ── Sessies bouwen ───────────────────────────────────────────────────

/**
 * Trainingen: weekschema (komende 10 weken) + Trainingen_data overrides/extras.
 * Matchen: Beheer → Matchen (extras / korte rijen voor aanwezigheid).
 */
function syncSessiesVanuitBeheer_(beheer) {
  return buildSessiesVanuitBeheer_(beheer);
}

function buildSessiesVanuitBeheer_(beheer) {
  var week = readTrainingenWeek_(beheer);
  var dataSheet = beheer.getSheetByName('Trainingen_data');
  var dataMap = dataSheet ? readTrainingenDataMap_(dataSheet) : {};
  var byId = {};

  // 1) Weekschema → kandidaten
  expandWeekDates_(week, 10).forEach(function (c) {
    var override = dataMap[c.datum];
    if (override && isNee_(override.status)) return; // afgelast
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

  // 2) Extra / alle Trainingen_data status != nee (one-offs + bestaande data)
  Object.keys(dataMap).forEach(function (datum) {
    var d = dataMap[datum];
    if (isNee_(d.status)) return;
    if (byId['t-' + datum]) return; // al via week
    byId['t-' + datum] = makeTrainingSessie_(datum, d.start, d.locatie, d.notitie);
  });

  // 3) Matchen
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
  if (notitie) {
    // nietitie niet in label — blijft in Beheer; label simpel houden
  }
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
    // Weekdag van de kalenderdatum (YYYY-MM-DD) zonder TZ-shift
    var parts = iso.split('-');
    var utcDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    var wd = utcDate.getUTCDay(); // 0=Sun — klopt voor kalenderdatum zonder TZ-shift
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
    // Skip uitleg / voorbeeld / lege rijen
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

/**
 * Matrix: bestaande rijen behouden (J/N/? nooit wissen).
 * Lead-kolommen (datum/type/label) updaten; ontbrekende sessie-rijen appenden.
 */
function ensureMatrixRows_(ss, sessies) {
  var sh = ss.getSheetByName('Aanwezigheid');
  if (!sh) return;

  var lastCol = Math.max(sh.getLastColumn(), 1);
  var lastRow = Math.max(sh.getLastRow(), 1);
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var iId = headers.indexOf('sessie_id');
  var iDat = headers.indexOf('datum');
  var iType = headers.indexOf('type');
  var iLab = headers.indexOf('label');

  // Zorg voor standaard headers als sheet leeg/nieuw
  if (iId < 0) {
    sh.clear();
    var lead = ['sessie_id', 'datum', 'type', 'label'];
    sh.getRange(1, 1, 1, lead.length).setValues([lead]);
    headers = lead.slice();
    iId = 0; iDat = 1; iType = 2; iLab = 3;
    lastCol = lead.length;
    lastRow = 1;
  }

  var existing = {}; // sessie_id → row number (1-based)
  if (lastRow >= 2) {
    var idCol = sh.getRange(2, iId + 1, lastRow, iId + 1).getValues();
    for (var r = 0; r < idCol.length; r++) {
      var sid = String(idCol[r][0] || '').trim();
      if (sid) existing[sid] = r + 2;
    }
  }

  var toAppend = [];
  sessies.forEach(function (s) {
    if (existing[s.sessie_id]) {
      var rowNum = existing[s.sessie_id];
      // Alleen lead-info updaten — speelercellen met rust laten
      if (iDat >= 0) sh.getRange(rowNum, iDat + 1).setValue(s.datum);
      if (iType >= 0) sh.getRange(rowNum, iType + 1).setValue(s.type);
      if (iLab >= 0) sh.getRange(rowNum, iLab + 1).setValue(s.label);
    } else {
      var row = [];
      for (var c = 0; c < headers.length; c++) row.push('');
      row[iId] = s.sessie_id;
      if (iDat >= 0) row[iDat] = s.datum;
      if (iType >= 0) row[iType] = s.type;
      if (iLab >= 0) row[iLab] = s.label;
      toAppend.push(row);
      existing[s.sessie_id] = -1;
    }
  });

  if (toAppend.length) {
    sh.getRange(sh.getLastRow() + 1, 1, toAppend.length, headers.length).setValues(toAppend);
  }
}

/**
 * Tall format: alleen nieuwe sessie×speler-combo's.
 * @param {Object[]} players
 * @param {Object[]|null} sessies — als null, lees uit tab Sessies
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
          sid,
          s.datum,
          s.type,
          s.label,
          p.nummer,
          p.voornaam,
          '',
          '',
          '',
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
  // dd/mm/yyyy of dd-mm-yyyy
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
