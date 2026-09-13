/**
 * Plak dit in de AANWEZIGHEID-spreadsheet:
 * Extensies → Apps Script → plak in Code.gs → opslaan.
 *
 * Setup (jij / Academy — niet de coaches):
 * 1) Tab Uitleg: beheer_sheet_id + vbl_team_guid (VBL-ploegcode, bv. BVBL1125G10  3)
 * 2) Menu Academy sync → "Eerste setup (auto matchen)" één keer
 *    → rechten toestaan, matchen binnenhalen, auto-trigger klaarzetten.
 * Daarna sheet delen met coaches: Wedstrijden staat al vol. Coaches doen niks.
 *
 * Menu verder alleen voor jou bij onderhoud.
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

  var sessies = buildSessiesVanuitBeheer_(beheer);
  var trainings = sessies.filter(function (s) { return s.type === 'training'; });
  var vblMatches = fetchVblMatchSessies_(ss);
  var sheetMatches = sessies.filter(function (s) { return s.type === 'match'; });
  var matches = mergeMatchSessies_(vblMatches, sheetMatches);

  var existing = collectAllAttendanceMaps_(ss);
  writeTrainingenMatrix_(ss, players, trainings, existing);
  writeWedstrijdenMatrix_(ss, players, matches, existing);
  markVblBootstrapped_(ss);

  ss.toast(
    players.length + ' spelers · ' + trainings.length + ' trainingen · ' +
      matches.length + ' wedstrijden (antwoorden bewaard).',
    'Academy sync',
    8
  );
}

/**
 * Alleen Wedstrijden (VBL + Beheer-extras). Raakt Trainingen NIET aan.
 * Veilig voor coaches / auto-bootstrap.
 */
function syncWedstrijdenVanuitVbl() {
  var ss = SpreadsheetApp.getActive();
  var beheer = openBeheer_(ss);
  var players = readPlayersFromBeheer_(beheer);
  var sessies = buildSessiesVanuitBeheer_(beheer);
  var vblMatches = fetchVblMatchSessies_(ss);
  var sheetMatches = sessies.filter(function (s) { return s.type === 'match'; });
  var matches = mergeMatchSessies_(vblMatches, sheetMatches);
  var existing = collectAllAttendanceMaps_(ss);
  writeWedstrijdenMatrix_(ss, players, matches, existing);
  markVblBootstrapped_(ss);
  ss.toast(matches.length + ' wedstrijden uit VBL/Beheer (Trainingen onaangeroerd).', 'Academy sync', 8);
  return matches.length;
}

/** Alleen spelers (herbouw matrices met bestaande Sessies-index). */
function syncSpelersFromBeheer() {
  syncAllesVanuitBeheer();
}

/**
 * Eerste setup voor een nieuwe ploeg-sheet (jij, vóór delen met coaches):
 * - rechten (Beheer + UrlFetch)
 * - installable onOpen (auto matchen als Wedstrijden nog leeg)
 * - meteen 1× VBL-matchen binnenhalen
 */
function eersteSetupAutoMatchen() {
  var ss = SpreadsheetApp.getActive();
  ensureUitlegVblKey_(ss);
  installeerAutoOnOpen_();
  var n = syncWedstrijdenVanuitVbl();
  ss.toast(
    'Klaar: ' + n + ' matchen binnen. Sheet mag naar coaches — zij hoeven niks te doen.',
    'Eerste setup',
    10
  );
}

/** Installable onOpen: menu + bootstrap als Wedstrijden nog leeg. */
function onOpenInstallable() {
  onOpen();
  try {
    bootstrapVblIndienLeeg_();
  } catch (e) {
    // Auth/eerste keer: stil — eersteSetup of menu dekt het
  }
}

function bootstrapVblIndienLeeg_() {
  var ss = SpreadsheetApp.getActive();
  if (isVblBootstrapped_(ss)) return;
  if (!readVblTeamGuid_(ss)) return;
  if (!wedstrijdenIsLeeg_(ss)) {
    markVblBootstrapped_(ss);
    return;
  }
  syncWedstrijdenVanuitVbl();
}

function wedstrijdenIsLeeg_(ss) {
  var sh = ss.getSheetByName(SHEET_WEDSTRIJDEN_);
  if (!sh) return true;
  // Layout: R1 headers, R2 sessie_id (verborgen), R3 sub — match-kolommen vanaf B
  if (sh.getLastColumn() < 3) return true;
  var idRow = sh.getRange(2, 1, 2, Math.min(sh.getLastColumn(), 40)).getDisplayValues()[0];
  for (var c = 1; c < idRow.length; c++) {
    if (/^[tm]-/.test(String(idRow[c] || '').trim())) return false;
  }
  // Fallback: headerrij heeft "Match "
  var h = sh.getRange(1, 2, 1, Math.min(sh.getLastColumn(), 20)).getDisplayValues()[0];
  for (var i = 0; i < h.length; i++) {
    if (/^Match\s+\d+/i.test(String(h[i] || ''))) return false;
  }
  return true;
}

function isVblBootstrapped_(ss) {
  return PropertiesService.getDocumentProperties().getProperty('vbl_bootstrapped') === '1';
}

function markVblBootstrapped_(ss) {
  PropertiesService.getDocumentProperties().setProperty('vbl_bootstrapped', '1');
}

function installeerAutoOnOpen_() {
  var ss = SpreadsheetApp.getActive();
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onOpenInstallable') return;
  }
  ScriptApp.newTrigger('onOpenInstallable')
    .forSpreadsheet(ss)
    .onOpen()
    .create();
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
    .addItem('Eerste setup (auto matchen)', 'eersteSetupAutoMatchen')
    .addItem('Wedstrijden uit VBL verversen', 'syncWedstrijdenVanuitVbl')
    .addSeparator()
    .addItem('Alles bijwerken vanuit Beheer', 'syncAllesVanuitBeheer')
    .addItem('Alleen spelers syncen', 'syncSpelersFromBeheer')
    .addItem('Ja/Nee chips + zachte kleuren', 'styleJaNeeChipsNu')
    .addItem('Herstel Totaal + voetregels', 'herstelTrainingenTotaalEnVoet_')
    .addItem('Opruimen overbodige tabs', 'opruimOverbodigeTabs_')
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
  // Niet meer: Spelers_ref was ballast voor ouders.
  return;
}

// ── Sessies bouwen ───────────────────────────────────────────────────


/** Fallback als Uitleg nog geen vbl_team_guid heeft (huidige U10 C). */
var VBL_U10C_GUID_ = 'BVBL1125G10  3';
var VBL_API_ = 'https://vblcb.wisseq.eu/VBLCB_WebService/data/TeamMatchesByGuid?teamguid=';

function readVblTeamGuid_(ss) {
  var uitleg = ss.getSheetByName('Uitleg');
  if (!uitleg) return '';
  var g = lookupUitleg_(uitleg, 'vbl_team_guid');
  return String(g || '').trim();
}

/** Zorg dat Uitleg een vbl_team_guid-rij heeft (leeg of U10 C default). */
function ensureUitlegVblKey_(ss) {
  var uitleg = ss.getSheetByName('Uitleg') || ss.insertSheet('Uitleg');
  var existing = lookupUitleg_(uitleg, 'vbl_team_guid');
  if (existing) return existing;
  var last = Math.max(uitleg.getLastRow(), 0) + 1;
  // Default alleen zinvol voor huidige U10 C-sheet; andere ploegen vullen jij in
  var def = VBL_U10C_GUID_;
  uitleg.getRange(last, 1, last, 2).setValues([['vbl_team_guid', def]]);
  return def;
}

/** Officiële matchen via Basketbal Vlaanderen (guid uit Uitleg). */
function fetchVblMatchSessies_(ss) {
  var guid = readVblTeamGuid_(ss) || VBL_U10C_GUID_;
  return fetchVblMatchSessiesForGuid_(guid);
}

/** @deprecated alias */
function fetchVblMatchSessiesU10C_() {
  return fetchVblMatchSessies_(SpreadsheetApp.getActive());
}

function fetchVblMatchSessiesForGuid_(guid) {
  try {
    guid = String(guid || '').trim();
    if (!guid) return [];
    var enc = encodeURIComponent(guid);
    var res = UrlFetchApp.fetch(VBL_API_ + enc, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    if (res.getResponseCode() !== 200) return [];
    var data = JSON.parse(res.getContentText());
    if (!data || !data.length) return [];
    var out = [];
    for (var i = 0; i < data.length; i++) {
      var s = parseVblRawToSessie_(data[i], guid);
      if (s) out.push(s);
    }
    out.sort(function (a, b) {
      return String(a.datum).localeCompare(String(b.datum)) || String(a.uur || '').localeCompare(String(b.uur || ''));
    });
    return out;
  } catch (e) {
    return [];
  }
}

function parseVblRawToSessie_(raw, ourGuid) {
  var dateIso = formatDateIso_(raw.datumString);
  // datumString is often DD-MM-YYYY
  if (!dateIso || dateIso.indexOf('-') < 0) {
    var m = String(raw.datumString || '').trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) dateIso = m[3] + '-' + pad2_(m[2]) + '-' + pad2_(m[1]);
  }
  if (!dateIso) return null;
  var weHome = raw.tTGUID === ourGuid;
  var weAway = raw.tUGUID === ourGuid;
  var venue = weHome ? 'thuis' : (weAway ? 'uit' : '');
  var tegen = weHome ? String(raw.tUNaam || '').trim() : String(raw.tTNaam || '').trim();
  if (!tegen) return null;
  var uur = formatTime_(raw.beginTijd);
  var loc = String(raw.accNaam || '').trim();
  var uurKey = String(uur || '').replace(':', '').replace('.', '');
  var sid = 'm-' + dateIso + (uurKey ? '-' + uurKey : '');
  return {
    sessie_id: sid,
    type: 'match',
    datum: dateIso,
    uur: uur,
    label: (venue === 'uit' ? 'Uit' : 'Thuis') + ' vs ' + tegen,
    tegenstander: tegen,
    locatie: loc,
    zichtbaar: 'ja',
    bron: 'vbl'
  };
}

/** VBL wint: als VBL matchen heeft, negeer Beheer-matchen (voorkomt dubbels). */
function mergeMatchSessies_(vbl, sheet) {
  var list = (vbl && vbl.length) ? vbl.slice() : (sheet || []).slice();
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    var day = normalizeIsoDate_(s.datum);
    var uur = String(s.uur || '').replace('.', ':');
    var key = day + '|' + uur;
    if (day && seen[key]) continue;
    if (day) seen[key] = true;
    if (day) s.datum = day;
    out.push(s);
  }
  return out.sort(function (a, b) {
    return String(a.datum).localeCompare(String(b.datum)) || String(a.uur || '').localeCompare(String(b.uur || ''));
  });
}

function normalizeIsoDate_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, 'Europe/Brussels', 'yyyy-MM-dd');
  }
  var s = String(v || '').trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return m[3] + '-' + pad2_(m[2]) + '-' + pad2_(m[1]);
  return s;
}

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
  // Niet meer: Sessies-tab was coach-index / ballast. Sync bouwt in memory.
  return;
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
  // Leeg = onbekend — NOOIT false (dat werd Nee bij Trainingen)
  return '';
}

/**
 * Trainingen — layout zoals origineel U10 C trainingsblad:
 * R1: Training 1, Training 2, … Totaal
 * R2: 24-8-2026, …
 * R3: sessie_id (verborgen)
 * Spelers · Totaal-rij (geen Tafel/truitjes — die horen bij Wedstrijden)
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

  // Geen Tafel/truitjes op Trainingen — die horen alleen bij Wedstrijden
  resetSheet_(sh);
  var all = [labelRow, dateRow, idRow].concat(dataRows);
  if (sorted.length) all.push(totalRow);
  sh.getRange(1, 1, all.length, nCols).setValues(all);

  var firstPlayerRow = 4;
  var lastPlayerRow = 3 + sorted.length;
  var totRowNum = sorted.length ? lastPlayerRow + 1 : 0;

  for (var r = 0; r < sorted.length; r++) {
    var rowNum = firstPlayerRow + r;
    if (nSess > 0) {
      sh.getRange(rowNum, nCols).setFormula(
        '=COUNTIF(' + colToLetter_(2) + rowNum + ':' + colToLetter_(1 + nSess) + rowNum + ';"Ja")'
      );
    } else {
      sh.getRange(rowNum, nCols).setValue(0);
    }
  }
  if (sorted.length && nSess > 0) {
    for (var c = 0; c < nSess; c++) {
      var colLetter = colToLetter_(2 + c);
      sh.getRange(totRowNum, 2 + c).setFormula(
        totaalJaFormula_(colLetter, firstPlayerRow, lastPlayerRow)
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
  // Totaal + eronder wit
  if (totRowNum > 0) {
    var wEnd = Math.max(totRowNum + 15, sh.getMaxRows());
    sh.getRange(totRowNum, 1, wEnd, nCols).setBackground('#ffffff');
  }
}

/**
 * Wedstrijden — opmaak zoals origineel U10 C:
 * Match N + datum/tegenstander/uur (bold, merged) · Kan aanwezig (checkbox+pastel) ·
 * Heeft gespeeld (checkbox) · Totaal · voetregels Tafel/Truitjes/Afspraken · freeze kolom A.
 */


function writeWedstrijdenMatrix_(ss, players, matches, existing) {
  var sh = ss.getSheetByName(SHEET_WEDSTRIJDEN_) || ss.insertSheet(SHEET_WEDSTRIJDEN_);
  var sorted = (players || []).slice().sort(function (a, b) {
    return Number(a.nummer) - Number(b.nummer);
  });
  var visible = (matches || []).filter(function (s) {
    return String(s.zichtbaar || 'ja').toLowerCase() !== 'nee';
  });
  var nMatch = visible.length;
  var nCols = 1 + nMatch * 2 + 1;

  var headerRow = [''];
  var idRow = ['sessie_id'];
  var subRow = [''];
  for (var i = 0; i < nMatch; i++) {
    var lab = matchHeaderLabel_(visible[i], i);
    if (!String(lab || '').trim()) lab = 'Match ' + (i + 1);
    headerRow.push(lab);
    headerRow.push('');
    idRow.push(String(visible[i].sessie_id || ''));
    idRow.push(String(visible[i].sessie_id || '') + '|gespeeld');
    subRow.push('Aanwezig');
    subRow.push('Heeft gespeeld');
  }
  headerRow.push('Totaal gespeeld');
  idRow.push('');
  subRow.push('');

  var dataRows = [];
  for (var p = 0; p < sorted.length; p++) {
    var player = sorted[p];
    var row = [player.voornaam];
    var keys = playerMatchKeys_(player);
    for (var s = 0; s < nMatch; s++) {
      var sid = String(visible[s].sessie_id || '');
      row.push(toJaNee_(lookupAtt_(existing, keys, sid, 'aan')));
      var g = lookupAtt_(existing, keys, sid, 'gespeeld');
      row.push(g === true || g === 'TRUE' || toJaNee_(g) === 'Ja');
    }
    row.push('');
    dataRows.push(row);
  }

  var totalRow = ['Totaal'];
  for (var t = 0; t < nMatch * 2; t++) totalRow.push('');
  totalRow.push('');

  resetSheet_(sh);

  var all = [headerRow, idRow, subRow].concat(dataRows);
  if (sorted.length) all.push(totalRow);
  sh.getRange(1, 1, all.length, nCols).setValues(all);

  var firstPlayerRow = 4;
  var lastPlayerRow = 3 + sorted.length;
  var totRowNum = sorted.length ? lastPlayerRow + 1 : 0;
  var blankW = lastPlayerRow + 2;
  var tafelW = blankW + 1;
  var footEnd = tafelW + 2;

  for (var r = 0; r < sorted.length; r++) {
    var rn = firstPlayerRow + r;
    if (nMatch > 0) {
      var bits = [];
      for (var mj = 0; mj < nMatch; mj++) {
        var gLetter = colToLetter_(3 + mj * 2);
        bits.push('IF(' + gLetter + rn + ';1;0)');
      }
      sh.getRange(rn, nCols).setFormula('=' + bits.join('+'));
    } else {
      sh.getRange(rn, nCols).setValue(0);
    }
  }

  try { importWedstrijdenPlayerAtt_(sh, HERSTEL_PAYLOAD_, firstPlayerRow, lastPlayerRow, nMatch); } catch (eImp) {}

  var aanRanges = [];
  if (sorted.length && nMatch > 0) {
    for (var mk = 0; mk < nMatch; mk++) {
      var aanCol = 2 + mk * 2;
      var gesCol = 3 + mk * 2;
      var aanRange = sh.getRange(firstPlayerRow, aanCol, lastPlayerRow, aanCol);
      var gesRange = sh.getRange(firstPlayerRow, gesCol, lastPlayerRow, gesCol);
      var aanVals = aanRange.getValues();
      for (var ar = 0; ar < aanVals.length; ar++) aanVals[ar][0] = toJaNee_(aanVals[ar][0]);
      aanRange.setValues(aanVals);
      aanRanges.push(aanRange);
      applyCheckboxesPlain_(gesRange);
    }
    styleJaNeeRanges_(aanRanges);
  }

  sh.getRange(1, 1).clearContent().setFontWeight('normal').setFontSize(10);
  sh.getRange(2, 1).setValue('sessie_id');
  sh.getRange(3, 1).clearContent();
  if (sorted.length) {
    sh.getRange(firstPlayerRow, 1, lastPlayerRow, 1)
      .setFontWeight('normal').setFontSize(10).setFontColor('#000000')
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
  }

  if (totRowNum > 0) {
    try { sh.getRange(totRowNum, 1, footEnd, nCols).removeCheckboxes(); } catch (eTc) {}
    sh.getRange(totRowNum, 1, footEnd, nCols).clearContent().setBackground('#ffffff');
    sh.getRange(totRowNum, 1).setValue('Totaal').setFontWeight('bold');
    if (nMatch > 0) {
      for (var tc = 0; tc < nMatch; tc++) {
        var aanL2 = colToLetter_(2 + tc * 2);
        var gesL2 = colToLetter_(3 + tc * 2);
        sh.getRange(totRowNum, 2 + tc * 2).setFormula(
          totaalJaFormula_(aanL2, firstPlayerRow, lastPlayerRow)
        );
        sh.getRange(totRowNum, 3 + tc * 2).setFormula(
          '=COUNTIF(' + gesL2 + firstPlayerRow + ':' + gesL2 + lastPlayerRow + ';TRUE)'
        );
      }
    }
    sh.getRange(tafelW, 1).setValue('Tafel').setFontWeight('bold');
    sh.getRange(tafelW + 1, 1).setValue('Truitjes').setFontWeight('bold');
    sh.getRange(tafelW + 2, 1).setValue('Afspraken zie apart blad')
      .setFontColor('#990000').setFontWeight('bold');
    for (var fi2 = 0; fi2 < nMatch; fi2++) {
      var cA2 = 2 + fi2 * 2;
      sh.getRange(tafelW, cA2).setValue('Naam');
      sh.getRange(tafelW + 1, cA2).setValue('Naam (#nummer)');
    }
  }

  sh.getRange(3, 1, 3, nCols)
    .setFontWeight('normal').setFontSize(9).setFontColor('#666666')
    .setWrap(true).setHorizontalAlignment('center');

  // Headers (nog zonder merge)
  sh.getRange(1, 1).clearContent().setFontWeight('normal');
  try { sh.getRange(1, 1, 1, nCols).breakApart(); } catch (eBrAll) {}
  for (var hm = 0; hm < nMatch; hm++) {
    var hc = 2 + hm * 2;
    var hLabel = String(headerRow[1 + hm * 2] || '').trim() || ('Match ' + (hm + 1));
    sh.getRange(1, hc).setValue(hLabel)
      .setFontWeight('bold').setWrap(true)
      .setVerticalAlignment('middle').setHorizontalAlignment('center')
      .setFontColor('#000000').setFontSize(10);
    sh.getRange(1, hc + 1).clearContent();
  }
  sh.getRange(1, nCols).setValue('Totaal gespeeld').setFontWeight('bold').setHorizontalAlignment('center');
  sh.setRowHeight(1, 78);

  sh.setColumnWidth(1, 140);
  for (var cw = 0; cw < nMatch; cw++) {
    sh.setColumnWidth(2 + cw * 2, 110);
    sh.setColumnWidth(3 + cw * 2, 88);
  }
  sh.setColumnWidth(nCols, 90);

  // Speler-kolom "Totaal gespeeld": nooit checkboxes
  if (sorted.length) {
    var totColRange = sh.getRange(firstPlayerRow, nCols, lastPlayerRow, nCols);
    try { totColRange.removeCheckboxes(); } catch (eTotCb) {}
    try { totColRange.clearDataValidations(); } catch (eTotDv) {}
    totColRange.clearContent();
    for (var r2 = 0; r2 < sorted.length; r2++) {
      var rn2 = firstPlayerRow + r2;
      if (nMatch > 0) {
        var bits2 = [];
        for (var mj2 = 0; mj2 < nMatch; mj2++) {
          var gl = colToLetter_(3 + mj2 * 2);
          bits2.push('IF(' + gl + rn2 + ';1;0)');
        }
        sh.getRange(rn2, nCols).setFormula('=' + bits2.join('+'));
      } else {
        sh.getRange(rn2, nCols).setValue(0);
      }
    }
    totColRange.setHorizontalAlignment('center').setFontWeight('normal');
  }

  if (totRowNum > 0 && nMatch > 0) {
    try { sh.getRange(totRowNum, 2, totRowNum, nCols).removeCheckboxes(); } catch (eTx) {}
    try { sh.getRange(totRowNum, 2, totRowNum, nCols).clearDataValidations(); } catch (eTd) {}
    for (var tc2 = 0; tc2 < nMatch; tc2++) {
      var aanL3 = colToLetter_(2 + tc2 * 2);
      var gesL3 = colToLetter_(3 + tc2 * 2);
      sh.getRange(totRowNum, 2 + tc2 * 2).setFormula(
        totaalJaFormula_(aanL3, firstPlayerRow, lastPlayerRow)
      );
      sh.getRange(totRowNum, 3 + tc2 * 2).setFormula(
        '=COUNTIF(' + gesL3 + firstPlayerRow + ':' + gesL3 + lastPlayerRow + ';TRUE)'
      );
    }
    sh.getRange(totRowNum, nCols).setFormula(
      '=SUM(' + colToLetter_(nCols) + firstPlayerRow + ':' + colToLetter_(nCols) + lastPlayerRow + ')'
    );
    sh.getRange(totRowNum, 1).setValue('Totaal').setFontWeight('bold');
  }

  // Finale polish (volgorde belangrijk): wit → merge → unfreeze → hide sessie_id → freeze
  witOnderTotaalOpSheet_(sh);
  SpreadsheetApp.flush();
  for (var hm2 = 0; hm2 < nMatch; hm2++) {
    var hc2 = 2 + hm2 * 2;
    try { sh.getRange(1, hc2, 1, hc2 + 1).merge(); } catch (eMg) {}
  }
  try { sh.setFrozenRows(0); sh.setFrozenColumns(0); } catch (eUf) {}
  try { sh.showRows(1, Math.max(footEnd, lastPlayerRow + 5, 25)); } catch (eShow) {}
  try { sh.hideRows(2); } catch (eH) {}  // sessie_id — mag niet zichtbaar voor coaches
  try { sh.setFrozenColumns(1); } catch (eF1) {}
  try { sh.setFrozenRows(3); } catch (eF2) {}  // 1+hidden2+3; coaches zien header+Aanwezig
  SpreadsheetApp.flush();
  try { sh.hideRows(2); } catch (eH2) {}  // nogmaals na freeze
}







function formatDateDMyyyy_(iso) {
  var s = String(iso || '').trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return String(Number(m[3])) + '-' + String(Number(m[2])) + '-' + m[1];
}

function formatDateSlashPadded_(iso) {
  var s = String(iso || '').trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return m[3] + '/' + m[2] + '/' + m[1];
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

/** Één keer CF + dropdown voor meerdere Ja/Nee-bereiken (voorkomt quota/unknown errors). */
function styleJaNeeRanges_(ranges) {
  if (!ranges || !ranges.length) return;
  var sheet = ranges[0].getSheet();
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Ja', 'Nee'], true)
    .setAllowInvalid(true)
    .setHelpText('Ja of Nee')
    .build();
  for (var i = 0; i < ranges.length; i++) {
    try { clearValidationsHard_(ranges[i]); } catch (eC) {}
    ranges[i].setDataValidation(rule);
    ranges[i].setHorizontalAlignment('center').setVerticalAlignment('middle').setFontWeight('bold');
  }
  // Alleen spelersranges; sheet-CF reset zodat Totaal/voet niet grijs wordt
  sheet.clearConditionalFormatRules();
  var existing = [];
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Ja')
    .setBackground(JA_NEE_COLORS_.jaBg)
    .setFontColor(JA_NEE_COLORS_.jaFg)
    .setRanges(ranges)
    .build());
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Nee')
    .setBackground(JA_NEE_COLORS_.neeBg)
    .setFontColor(JA_NEE_COLORS_.neeFg)
    .setRanges(ranges)
    .build());
  // Geen grijs op lege cellen — dat liep door tot onder Totaal en verwart coaches
  sheet.setConditionalFormatRules(existing);
}

function styleJaNeeRange_(range) {
  clearValidationsHard_(range);

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
  sheet.setConditionalFormatRules(existing);
  range.setHorizontalAlignment('center').setVerticalAlignment('middle');
  range.setFontWeight('bold');
}

/** Sheets Advanced Service — pill chips. false = niet beschikbaar. */

/** Wis data-validatie hard (ook CHIP via Sheets API). */
function clearValidationsHard_(range) {
  try { range.clearDataValidations(); } catch (e0) {}
  try { range.removeCheckboxes(); } catch (e1) {}
  try {
    if (typeof Sheets === 'undefined' || !Sheets.Spreadsheets) return;
    var ss = range.getSheet().getParent();
    var sheetId = range.getSheet().getSheetId();
    Sheets.Spreadsheets.batchUpdate({
      requests: [{
        setDataValidation: {
          range: {
            sheetId: sheetId,
            startRowIndex: range.getRow() - 1,
            endRowIndex: range.getRow() - 1 + range.getNumRows(),
            startColumnIndex: range.getColumn() - 1,
            endColumnIndex: range.getColumn() - 1 + range.getNumColumns()
          }
          // rule weglaten = validatie wissen
        }
      }]
    }, ss.getId());
  } catch (e2) {}
}

function trySetJaNeeChips_(range) {
  // CHIP via API bleef plakken op Totaal/voet — uitgeschakeld; gewone dropdown + pastel CF.
  return false;
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
  // Altijd Totaal + voetregels herstellen (geen dropdowns onder spelers)
  herstelTrainingenTotaalEnVoet_();
  ss.toast('Ja/Nee gestyled op ' + n + ' bereik(en); Totaal/voetregels hersteld.', 'Academy sync', 6);
}

/**
 * Alleen Totaal-formules + voetregels zonder dropdown (Trainingen).
 * Menu: Academy sync → Herstel Totaal + voetregels.
 */

/** Totaal-cel: tel Ja's; leeg als de kolom nog helemaal leeg is (geen Ja/Nee). */
function totaalJaFormula_(colLetter, firstRow, lastRow) {
  var rng = colLetter + firstRow + ':' + colLetter + lastRow;
  // NL-BE locale: ; als scheidingsteken
  return '=IF(COUNTIF(' + rng + ';"Ja")+COUNTIF(' + rng + ';"Nee")=0;"";COUNTIF(' + rng + ';"Ja"))';
}


/**
 * Wis ballast-tabs. Houdt: Trainingen, Wedstrijden, Uitleg.
 * (Sessies/Spelers_ref/… mogen weg — sync bouwt alles uit Beheer.)
 */
function opruimOverbodigeTabs_() {
  var ss = SpreadsheetApp.getActive();
  var keep = {
    Trainingen: true,
    Wedstrijden: true,
    Uitleg: true
  };
  var removed = [];
  ss.getSheets().slice().forEach(function (sh) {
    var name = sh.getName();
    if (keep[name]) return;
    if (ss.getSheets().length <= 1) return;
    try {
      ss.deleteSheet(sh);
      removed.push(name);
    } catch (e) {
      try {
        sh.hideSheet();
        removed.push(name + ' (verborgen)');
      } catch (e2) {}
    }
  });
  if (!ss.getSheetByName('Trainingen')) ss.insertSheet('Trainingen');
  if (!ss.getSheetByName('Wedstrijden')) ss.insertSheet('Wedstrijden');
  if (!ss.getSheetByName('Uitleg')) ss.insertSheet('Uitleg');
  ss.toast(
    removed.length ? ('Weg: ' + removed.join(', ')) : 'Niets te wissen',
    'Academy sync',
    10
  );
}


/** Totaal + alle rijen eronder: expliciet wit (geen lichtgrijs / CF-leeg). */
function witOnderTotaalBeide_() {
  var ss = SpreadsheetApp.getActive();
  witOnderTotaalOpSheet_(ss.getSheetByName(SHEET_TRAININGEN_));
  witOnderTotaalOpSheet_(ss.getSheetByName(SHEET_WEDSTRIJDEN_));
  ss.toast('Totaal + eronder wit.', 'Academy sync', 5);
}

function witOnderTotaalOpSheet_(sh) {
  if (!sh) return;
  var lastR = Math.max(sh.getLastRow(), 40);
  var names = sh.getRange(1, 1, lastR, 1).getDisplayValues();
  var totRow = 0;
  for (var i = 0; i < names.length; i++) {
    if (String(names[i][0] || '').trim() === 'Totaal') {
      totRow = i + 1;
      break;
    }
  }
  if (!totRow) return;
  var endR = Math.max(sh.getMaxRows(), totRow + 40);
  var endC = Math.max(sh.getMaxColumns(), sh.getLastColumn(), 30);
  var range = sh.getRange(totRow, 1, endR, endC);
  try { range.removeCheckboxes(); } catch (e1) {}
  try { clearValidationsHard_(range); } catch (e2) {}
  range.setBackground('#ffffff');
}

function herstelTrainingenTotaalEnVoet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SHEET_TRAININGEN_);
  if (!sh) {
    ss.toast('Tab Trainingen ontbreekt', 'Academy sync', 5);
    return;
  }
  var meta = findTrainingenPlayerBlock_(sh, 4);
  if (!meta) {
    ss.toast('Geen spelersrijen gevonden', 'Academy sync', 5);
    return;
  }
  var firstPlayer = meta.firstPlayer;
  var lastPlayer = meta.lastPlayer;
  var totRow = meta.totRow;
  var endCol = meta.endCol;
  var nCols = sh.getLastColumn();
  var lastRow = Math.max(sh.getLastRow(), totRow + 5);

  // Alles vanaf Totaal: geen Ja/Nee-dropdown (ook CHIP hard wissen)
  if (totRow > 0) {
    var below = sh.getRange(totRow, 2, lastRow, Math.max(endCol, nCols));
    clearValidationsHard_(below);
    // Wis per ongeluk geplakte Ja/Nee op Totaal/voet (formules komen terug)
    sh.getRange(totRow, 2, totRow, endCol).clearContent();
  }

  // Totaal-rij: COUNTIF Ja per kolom
  if (totRow > 0 && lastPlayer >= firstPlayer && endCol >= 2) {
    sh.getRange(totRow, 1).setValue('Totaal').setFontWeight('bold');
    for (var c = 2; c <= endCol; c++) {
      var colLetter = colToLetter_(c);
      sh.getRange(totRow, c).setFormula(
        totaalJaFormula_(colLetter, firstPlayer, lastPlayer)
      );
    }
    // Totaal-kolom rechts voor spelers (als header Totaal)
    var header = String(sh.getRange(1, nCols).getDisplayValue() || '').toLowerCase();
    if (header.indexOf('totaal') >= 0) {
      for (var r = firstPlayer; r <= lastPlayer; r++) {
        sh.getRange(r, nCols).setFormula(
          '=COUNTIF(' + colToLetter_(2) + r + ':' + colToLetter_(endCol) + r + ';"Ja")'
        );
      }
      sh.getRange(totRow, nCols).clearContent();
    }
  }

  // Trainingen: geen Tafel/truitjes-rijen (die horen bij Wedstrijden)
  var footEndCol = Math.max(endCol, nCols);
  // Wis eventuele oude Tafel-rijen onder Totaal (labels + content), behalve als leeg gelaten
  var blankRow = totRow > 0 ? totRow + 1 : lastPlayer + 1;
  var scanEnd = Math.min(sh.getLastRow(), blankRow + 6);
  if (scanEnd >= blankRow) {
    for (var rr = blankRow; rr <= scanEnd; rr++) {
      var lab = String(sh.getRange(rr, 1).getDisplayValue() || '').trim();
      if (!lab || lab.indexOf('Tafel') === 0 || lab.indexOf('Truitjes') === 0 || lab.indexOf('Afspraken') === 0) {
        sh.getRange(rr, 1, rr, footEndCol).clearContent();
        clearValidationsHard_(sh.getRange(rr, 1, rr, footEndCol));
      }
    }
  }

  // Spelers-rijen opnieuw zacht stylen (ALLEEN spelers)
  if (lastPlayer >= firstPlayer && endCol >= 2) {
    sh.clearConditionalFormatRules();
    styleJaNeeRange_(sh.getRange(firstPlayer, 2, lastPlayer, endCol));
  }

  // Nogmaals: CHIP-validatie mag nooit op Totaal/voet blijven
  if (totRow > 0) {
    clearValidationsHard_(sh.getRange(totRow, 2, lastRow, Math.max(endCol, nCols)));
    // Formules stonden al; content van voet was geleegd — Totaal-formules opnieuw
    for (var c2 = 2; c2 <= endCol; c2++) {
      var colL = colToLetter_(c2);
      sh.getRange(totRow, c2).setFormula(
        totaalJaFormula_(colL, firstPlayer, lastPlayer)
      );
    }
    // Totaal + eronder: wit (geen lichtgrijs)
    var whiteEnd = Math.max(lastRow, totRow + 20, sh.getMaxRows());
    sh.getRange(totRow, 1, whiteEnd, Math.max(endCol, nCols, sh.getMaxColumns()))
      .setBackground('#ffffff');
    witOnderTotaalOpSheet_(sh);
  }

  ss.toast('Totaal telt Ja’s; voetregels zonder dropdown.', 'Academy sync', 6);
}

function styleJaNeeOnSheet_(sh, firstPlayerRow) {
  if (!sh) return 0;
  var meta = findTrainingenPlayerBlock_(sh, firstPlayerRow);
  if (!meta) return 0;
  var range = sh.getRange(meta.firstPlayer, 2, meta.lastPlayer, meta.endCol);
  sh.clearConditionalFormatRules();
  styleJaNeeRange_(range);
  // Extra veilig: geen validatie onder spelers
  var lastRow = Math.max(sh.getLastRow(), meta.lastPlayer + 6);
  var nCols = sh.getLastColumn();
  if (meta.lastPlayer + 1 <= lastRow && nCols >= 2) {
    clearValidationsHard_(sh.getRange(meta.lastPlayer + 1, 2, lastRow, nCols));
  }
  return 1;
}

/** Spelerblok + Totaal-rij + eindkolom (zonder Totaal-kolom rechts). */
function findTrainingenPlayerBlock_(sh, firstPlayerRow) {
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < firstPlayerRow || lastCol < 2) return null;

  var names = sh.getRange(firstPlayerRow, 1, lastRow, 1).getDisplayValues();
  var lastPlayer = firstPlayerRow - 1;
  var totRow = 0;
  for (var i = 0; i < names.length; i++) {
    var n = String(names[i][0] || '').trim();
    if (n === 'Totaal' || n.toLowerCase() === 'total') {
      totRow = firstPlayerRow + i;
      break;
    }
    if (!n) {
      // lege rij: stop spelers, zoek Totaal verder
      for (var j = i + 1; j < names.length; j++) {
        var n2 = String(names[j][0] || '').trim();
        if (n2 === 'Totaal' || n2.toLowerCase() === 'total') {
          totRow = firstPlayerRow + j;
          break;
        }
        if (n2) break;
      }
      break;
    }
    if (n.indexOf('Tafel') === 0 || n.indexOf('Truitjes') === 0 || n.indexOf('Afspraken') === 0) break;
    lastPlayer = firstPlayerRow + i;
  }
  if (lastPlayer < firstPlayerRow) return null;
  if (!totRow) totRow = lastPlayer + 1;

  var endCol = lastCol;
  var header = String(sh.getRange(1, lastCol).getDisplayValue() || '').toLowerCase();
  if (header.indexOf('totaal') >= 0 || header.indexOf('total') >= 0) endCol = lastCol - 1;
  if (endCol < 2) return null;
  return {
    firstPlayer: firstPlayerRow,
    lastPlayer: lastPlayer,
    totRow: totRow,
    endCol: endCol
  };
}



function matchHeaderLabel_(s, index) {
  // Zoals origineel: Match N + weekdag datum + tegenstander + uur locatie
  var lines = [];
  var n = (typeof index === 'number' ? index : 0) + 1;
  lines.push('Match ' + n);
  var dmy = formatDateSlashPadded_(s.datum); // 27/09/2026 zoals origineel
  var wd = weekdayIndexFromIso_(s.datum);
  var dayName = WEEKDAYS_NL_[wd] || '';
  if (dayName) dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  if (dmy) lines.push((dayName ? dayName + ' ' : '') + dmy);
  var tegen = String(s.tegenstander || '').trim();
  if (!tegen) {
    tegen = String(s.label || '').replace(/^(Thuis|Uit)\s+vs\s+/i, '').trim();
  }
  // strip G10 suffix noise for shorter header like original
  tegen = tegen.replace(/\s+G10\s+[A-Z]\b/i, '').trim();
  if (tegen) lines.push(tegen);
  var where = [];
  if (s.uur) where.push(String(s.uur));
  if (s.locatie) where.push(shortLoc_(s.locatie) || s.locatie);
  if (where.length) lines.push(where.join(' '));
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
  try { sh.setFrozenColumns(0); sh.setFrozenRows(0); } catch (e3) {}
  try {
    var merges = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).getMergedRanges();
    for (var i = 0; i < merges.length; i++) {
      try { merges[i].breakApart(); } catch (eB) {}
    }
  } catch (e) {}
  try { sh.getRange(1, 1, Math.min(sh.getMaxRows(), 50), Math.min(sh.getMaxColumns(), 80)).breakApart(); } catch (eA) {}
  sh.clear();
  sh.clearConditionalFormatRules();
  try {
    var merges2 = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).getMergedRanges();
    for (var j = 0; j < merges2.length; j++) {
      try { merges2[j].breakApart(); } catch (eB2) {}
    }
  } catch (e2) {}
  try { sh.showRows(1, Math.max(sh.getMaxRows(), 3)); } catch (eShow) {}
}


/** Checkbox + zachte pastel groen/rood (niet neon). */
function applyCheckboxesWithSoftColors_(range) {
  var values = range.getValues();
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      values[r][c] = toCheckboxBool_(values[r][c]);
    }
  }
  range.setValues(values);
  range.insertCheckboxes();
  var sheet = range.getSheet();
  var existing = sheet.getConditionalFormatRules();
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenCellTrue()
    .setBackground(JA_NEE_COLORS_.jaBg)
    .setRanges([range])
    .build());
  existing.push(SpreadsheetApp.newConditionalFormatRule()
    .whenCellFalse()
    .setBackground(JA_NEE_COLORS_.neeBg)
    .setRanges([range])
    .build());
  sheet.setConditionalFormatRules(existing);
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

  // Zoek sessie_id-rij: bij huidige layout R3 (index 2), niet R2 (dat is datum)
  var idRowIdx = -1;
  for (var r = 1; r < Math.min(values.length, 6); r++) {
    var cell0 = String(values[r][0] || '').trim().toLowerCase();
    if (cell0 === 'sessie_id' || looksLikeSessieIdRow_(values[r])) {
      idRowIdx = r;
      break;
    }
  }
  if (idRowIdx < 0) return map;

  var idRow = values[idRowIdx];
  var sessIds = [];
  for (var c = 1; c < Math.max(headers.length, idRow.length); c++) {
    var h = String(headers[c] || '').trim();
    var sid = String(idRow[c] || '').trim();
    if (/^totaal/i.test(h) || !sid || sid.indexOf('|') >= 0) sessIds.push(null);
    else sessIds.push(sid);
  }

  for (var r2 = idRowIdx + 1; r2 < values.length; r2++) {
    var name = String(values[r2][0] || '').trim();
    if (!name || /^totaal$/i.test(name)) continue;
    if (/^(tafel|truitjes|afspraken)/i.test(name)) continue;
    var keys = parsePlayerKeysFromLabel_(name);
    for (var ci = 0; ci < sessIds.length; ci++) {
      if (!sessIds[ci]) continue;
      var jn = toJaNee_(values[r2][ci + 1]);
      // Alleen echte Ja/Nee bewaren — lege cel mag NOOIT Nee worden
      if (jn === 'Ja' || jn === 'Nee') {
        storePlayerKeys_(map, keys, sessIds[ci], null, jn);
      }
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

  // Bepaal data-start: rij met "Aanwezig" / "Kan aanwezig zijn" of rij 3
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
      var raw = values[r2][p.col];
      if (p.field === 'aan' || !p.field) {
        var jn = toJaNee_(raw);
        if (jn === 'Ja' || jn === 'Nee') {
          storePlayerKeys_(map, keys, p.sid, p.field || null, jn);
          storePlayerKeys_(map, keys, p.sid, null, jn);
        }
      } else {
        var b = toCheckboxBool_(raw);
        storePlayerKeys_(map, keys, p.sid, p.field, b);
      }
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
  // Niet meer: tall-formaat is ballast.
  return;
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

/**
 * NOODHERSTEL — plak onderaan Code.gs, run herstelAllesNaDataverlies()
 * 1) Trainingen Ja/Nee uit oude sheet (leeg i.p.v. fout-Nee)
 * 2) Pastel kleuren alleen op spelers
 * 3) Wedstrijden voetregels Tafel/Truitjes/Afspraken
 * 4) Geen Tafel op Trainingen
 */
var HERSTEL_PAYLOAD_ = {"rename": {"Bas D": "Bas Dekeyser", "Bas N": "Bas Nuytten", "Jia Le": "Jia Lee"}, "training": {"Alfred": {"2026-08-24": "Ja", "2026-08-27": "Ja", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Ilya": {"2026-08-24": "Nee", "2026-08-27": "Nee", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Elias": {"2026-08-24": "Nee", "2026-08-27": "Nee", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Felix": {"2026-08-24": "Ja", "2026-08-27": "Ja", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Sam": {"2026-08-24": "Ja", "2026-08-27": "Nee", "2026-08-31": "Nee", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Bas Dekeyser": {"2026-08-24": "Ja", "2026-08-27": "Ja", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Jarne": {"2026-08-24": "Nee", "2026-08-27": "Nee", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Charlie": {"2026-08-24": "Ja", "2026-08-27": "Nee", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Jia Lee": {"2026-08-24": "Ja", "2026-08-27": "Ja", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Bas Nuytten": {"2026-08-24": "Nee", "2026-08-27": "Nee", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Jacob": {"2026-08-24": "Nee", "2026-08-27": "Nee", "2026-08-31": "Ja", "2026-09-03": "Ja", "2026-09-07": "Ja", "2026-09-10": "Ja"}, "Thomas": {"2026-08-24": "Ja", "2026-08-27": "Ja", "2026-08-31": "Nee", "2026-09-03": "Ja", "2026-09-07": "Nee", "2026-09-10": "Ja"}}, "match_att": {"Alfred": [["Ja", ""], ["Ja", ""], ["Ja", ""], ["Nee", ""], ["Ja", ""], ["Ja", ""], ["Nee", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""]], "Ilya": [["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""]], "Elias": [["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""]], "Felix": [["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""]], "Sam": [["Ja", ""], ["Ja", ""], ["Ja", ""], ["Nee", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""]], "Bas Dekeyser": [["Ja", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]], "Jarne": [["Ja", ""], ["Ja", ""], ["Ja", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]], "Charlie": [["Nee", ""], ["Ja", ""], ["Ja", ""], ["Nee", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""]], "Jia Lee": [["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""], ["Ja", ""]], "Bas Nuytten": [["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]], "Jacob": [["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]], "Thomas": [["Ja", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""], ["", ""]]}, "matches": [{"datum": "2026-09-27", "uur": "15:15", "tegenstander": "Clem Scherpenheuvel A", "thuis_of_uit": "uit", "locatie": "Stedeijke Sporthal Scherpenheuvel", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-10-03", "uur": "09:00", "tegenstander": "GSC Aarschot B", "thuis_of_uit": "thuis", "locatie": "Campus Redingenhof", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-10-11", "uur": "09:30", "tegenstander": "Dynamo Bertem B", "thuis_of_uit": "uit", "locatie": "Sportzaal Verona", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-10-17", "uur": "09:00", "tegenstander": "KYD Kortenberg Young Devils A", "thuis_of_uit": "uit", "locatie": "Sporthal Erps-Kwerps", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-10-24", "uur": "09:00", "tegenstander": "Hageland United A", "thuis_of_uit": "thuis", "locatie": "Campus Redingenhof", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-11-14", "uur": "09:00", "tegenstander": "Clem Scherpenheuvel A", "thuis_of_uit": "thuis", "locatie": "Campus Redingenhof", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-11-21", "uur": "09:30", "tegenstander": "GSG Aarschot B", "thuis_of_uit": "uit", "locatie": "Stedelijke Sporthal Demervallei", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-11-28", "uur": "09:00", "tegenstander": "Dynamo Bertem B", "thuis_of_uit": "thuis", "locatie": "Campus Redingenhof", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-12-05", "uur": "09:00", "tegenstander": "KYD Kortenberg Young Devils A", "thuis_of_uit": "thuis", "locatie": "Campus Redingenhof", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}, {"datum": "2026-12-12", "uur": "16:00", "tegenstander": "Hageland United A", "thuis_of_uit": "uit", "locatie": "Sporthal Lubbeek", "adres": "", "competitie": "aanwezigheid", "score_ons": "", "score_tegenstander": "", "status": "upcoming", "notitie": "VBL — alleen voor ouder-aanwezigheid (niet als site-extra)"}]};

function herstelAllesNaDataverlies() {
  var ss = SpreadsheetApp.getActive();
  var p = HERSTEL_PAYLOAD_;
  herstelTrainingenData_(ss, p);
  herstelWedstrijdenVoet_(ss);
  // match att if columns exist
  try { importWedstrijden_(ss, p); } catch (e) {}
  // style colors players only
  styleJaNeeOnSheet_(ss.getSheetByName('Trainingen'), 4);
  styleJaNeeOnSheet_(ss.getSheetByName('Wedstrijden'), 4);
  herstelTrainingenTotaalEnVoet_();
  try {
    var tr = ss.getSheetByName('Trainingen');
    if (tr && tr.getMaxRows() >= 3) tr.hideRows(3);
    var we = ss.getSheetByName('Wedstrijden');
    if (we && we.getMaxRows() >= 2) we.hideRows(2);
  } catch (eHide) {}
  ss.toast('Data + kleuren + Wedstrijden-voet hersteld', 'Herstel', 8);
}

function herstelTrainingenData_(ss, p) {
  var sh = ss.getSheetByName('Trainingen');
  if (!sh) throw new Error('Geen Trainingen');
  var meta = findTrainingenPlayerBlock_(sh, 4);
  if (!meta) throw new Error('Geen spelers');
  var dates = sh.getRange(2, 2, 2, meta.endCol).getDisplayValues()[0];
  var dateToCol = {};
  for (var c = 0; c < dates.length; c++) {
    var d = String(dates[c] || '').trim();
    var m = d.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (!m) continue;
    var iso = m[3] + '-' + ((Number(m[2]) < 10 ? '0' : '') + Number(m[2])) + '-' + ((Number(m[1]) < 10 ? '0' : '') + Number(m[1]));
    dateToCol[iso] = c + 2;
  }
  var names = sh.getRange(meta.firstPlayer, 1, meta.lastPlayer, 1).getDisplayValues();
  for (var r = 0; r < names.length; r++) {
    var name = String(names[r][0] || '').trim();
    if (p.rename && p.rename[name]) {
      sh.getRange(meta.firstPlayer + r, 1).setValue(p.rename[name]);
      name = p.rename[name];
    }
    var att = (p.training && p.training[name]) || {};
    for (var iso in dateToCol) {
      if (!Object.prototype.hasOwnProperty.call(dateToCol, iso)) continue;
      // leeg als geen oude waarde — NOOIT Nee forceren
      sh.getRange(meta.firstPlayer + r, dateToCol[iso]).setValue(att[iso] || '');
    }
  }
}

function herstelWedstrijdenVoet_(ss) {
  var sh = ss.getSheetByName('Wedstrijden');
  if (!sh) return;
  var lastCol = sh.getLastColumn();
  var lastRow = sh.getLastRow();
  var names = sh.getRange(4, 1, Math.max(lastRow, 4), 1).getDisplayValues();
  var lastPlayer = 3;
  var totRow = 0;
  for (var i = 0; i < names.length; i++) {
    var n = String(names[i][0] || '').trim();
    if (n === 'Totaal') { totRow = 4 + i; break; }
    if (!n || n.indexOf('Tafel') === 0 || n.indexOf('Truitjes') === 0 || n.indexOf('Afspraken') === 0) break;
    lastPlayer = 4 + i;
  }
  if (!totRow) totRow = lastPlayer + 1;
  var blank = totRow + 1;
  var tafel = blank + 1;
  // Don't wipe existing name fills in voet if present — only ensure labels
  if (!String(sh.getRange(tafel, 1).getDisplayValue() || '').trim()) {
    sh.getRange(blank, 1).setValue('');
    sh.getRange(tafel, 1).setValue('Tafel');
    sh.getRange(tafel + 1, 1).setValue('Truitjes');
    sh.getRange(tafel + 2, 1).setValue('Afspraken zie apart blad');
  }
  // Ensure placeholder Naam under each "Kan aanwezig" col if empty
  var sub = sh.getRange(3, 2, 3, lastCol).getDisplayValues()[0];
  for (var c = 0; c < sub.length; c++) {
    if (String(sub[c] || '').indexOf('Kan aanwezig') >= 0 || String(sub[c] || '').trim() === 'Aanwezig') {
      var col = c + 2;
      if (!String(sh.getRange(tafel, col).getDisplayValue() || '').trim()) {
        sh.getRange(tafel, col).setValue('Naam');
      }
      if (!String(sh.getRange(tafel + 1, col).getDisplayValue() || '').trim()) {
        sh.getRange(tafel + 1, col).setValue('Naam (#nummer)');
      }
    }
  }
  sh.getRange(tafel, 1, tafel + 2, 1).setFontWeight('bold');
  sh.getRange(totRow, 1, tafel + 2, lastCol).setBackground('#ffffff');
  clearValidationsHard_(sh.getRange(totRow, 2, tafel + 2, lastCol));
}

function importWedstrijdenPlayerAtt_(sh, p, firstPlayerRow, lastPlayerRow, nMatch) {
  if (!sh || !p || !p.match_att) return;
  var lastCol = sh.getLastColumn();
  if (lastCol < 2 || lastPlayerRow < firstPlayerRow) return;
  var headers = sh.getRange(1, 2, 1, lastCol).getDisplayValues()[0];
  var matchCols = [];
  var mi = 0;
  for (var c = 0; c < headers.length && matchCols.length < nMatch; ) {
    var h = String(headers[c] || '').trim();
    if (!h) {
      if (c + 1 < headers.length) {
        matchCols.push({ aanCol: c + 2, gesCol: c + 3, idx: mi });
        mi++;
        c += 2;
        continue;
      }
      c++;
      continue;
    }
    var idx = findMatchIndex_(h, p.matches || [], mi);
    matchCols.push({ aanCol: c + 2, gesCol: c + 3, idx: idx >= 0 ? idx : mi });
    mi++;
    c += 2;
  }
  var names = sh.getRange(firstPlayerRow, 1, lastPlayerRow, 1).getDisplayValues();
  for (var r = 0; r < names.length; r++) {
    var name = String(names[r][0] || '').trim();
    if (!name || name === 'Totaal') continue;
    if (p.rename && p.rename[name]) {
      sh.getRange(firstPlayerRow + r, 1).setValue(p.rename[name]);
      name = p.rename[name];
    }
    var pairs = p.match_att[name];
    if (!pairs) continue;
    for (var j = 0; j < matchCols.length; j++) {
      var mc = matchCols[j];
      var ix = mc.idx >= 0 ? mc.idx : j;
      if (ix < 0 || ix >= pairs.length) continue;
      var aan = toJaNee_(pairs[ix][0]);
      sh.getRange(firstPlayerRow + r, mc.aanCol).setValue(aan);
      var ges = String(pairs[ix][1] || '').trim();
      if (ges) sh.getRange(firstPlayerRow + r, mc.gesCol).setValue(toCheckboxBool_(ges));
    }
  }
}

function importWedstrijden_(ss, p) {
  var sh = ss.getSheetByName('Wedstrijden');
  if (!sh || !p || !p.match_att) return;
  var lastCol = sh.getLastColumn();
  if (lastCol < 2) return;
  // Merged headers: waarde staat in de linker kolom van elk paar
  var headers = sh.getRange(1, 2, 1, lastCol).getDisplayValues()[0];
  var matchCols = [];
  var mi = 0;
  for (var c = 0; c < headers.length; ) {
    var h = String(headers[c] || '').trim();
    if (!h) { c++; continue; }
    if (!/^Match\s+\d+/i.test(h) && h.indexOf('/') < 0 && h.indexOf('-') < 0) {
      c++; continue;
    }
    var idx = findMatchIndex_(h, p.matches || [], mi);
    matchCols.push({ aanCol: c + 2, gesCol: c + 3, idx: idx });
    mi++;
    c += 2;
  }
  var lastRow = sh.getLastRow();
  var names = sh.getRange(4, 1, lastRow, 1).getDisplayValues();
  for (var r = 0; r < names.length; r++) {
    var name = String(names[r][0] || '').trim();
    if (!name || name === 'Totaal') continue;
    if (name.indexOf('Tafel') === 0 || name.indexOf('Truitjes') === 0 || name.indexOf('Afspraken') === 0) continue;
    if (p.rename && p.rename[name]) {
      sh.getRange(4 + r, 1).setValue(p.rename[name]);
      name = p.rename[name];
    }
    var pairs = p.match_att[name];
    if (!pairs) continue;
    for (var j = 0; j < matchCols.length; j++) {
      var mc = matchCols[j];
      var ix = mc.idx >= 0 ? mc.idx : j;
      if (ix < 0 || ix >= pairs.length) continue;
      var aan = toJaNee_(pairs[ix][0]);
      var ges = String(pairs[ix][1] || '').trim();
      sh.getRange(4 + r, mc.aanCol).setValue(aan); // '' / Ja / Nee — nooit TRUE/FALSE
      if (ges) sh.getRange(4 + r, mc.gesCol).setValue(toCheckboxBool_(ges));
    }
  }
}

function findMatchIndex_(header, matches, hint) {
  for (var i = 0; i < matches.length; i++) {
    var d = matches[i].datum; // 2026-09-27
    var parts = d.split('-');
    var dmy = String(Number(parts[2])) + '/' + String(Number(parts[1])) + '/' + parts[0];
    var dmy2 = String(Number(parts[2])) + '-' + String(Number(parts[1])) + '-' + parts[0];
    if (header.indexOf(dmy) >= 0 || header.indexOf(dmy2) >= 0) return i;
    if (matches[i].tegenstander && header.indexOf(matches[i].tegenstander) >= 0) return i;
  }
  return hint < matches.length ? hint : -1;
}

