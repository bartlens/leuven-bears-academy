import type { HairStyle } from '../data/demoPlayers'
import { HAIR_COLOR_HEX, SKIN_COLOR_HEX } from '../lib/playerAppearance'
import { csvToObjects, parseCsv } from './csv'
import type {
  DatedTraining,
  HerfststageInfo,
  InfoItem,
  MatchAfspraken,
  PloegMeta,
  StaffMember,
  StaffMove,
  StaffOutfit,
  TeamEventItem,
  WeeklyTraining,
} from './beheerTypes'

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  // fuzzy: header may contain key as prefix ("naam jonathan")
  for (const [hk, hv] of Object.entries(row)) {
    for (const k of keys) {
      if (hk === k || hk.startsWith(k + ' ')) {
        const rest = hk.slice(k.length).trim()
        if (rest) return rest
        if (hv?.trim()) return hv.trim()
      }
    }
  }
  return ''
}

function isJa(v: string): boolean {
  const s = v.trim().toLowerCase()
  return s === 'ja' || s === 'yes' || s === 'true' || s === '1'
}

/** Empty = show by default (for zichtbaar/tonen). */
function isVisible(v: string): boolean {
  const s = v.trim().toLowerCase()
  if (!s) return true
  return !(s === 'nee' || s === 'no' || s === 'false' || s === '0')
}

function dayLabelFromIso(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('nl-BE', { weekday: 'long' })
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export function parsePloegCsv(csvText: string): PloegMeta {
  const rows = csvToObjects(csvText)
  const map = new Map<string, string>()
  for (const row of rows) {
    const field = pick(row, 'veld', 'field', 'sleutel', 'key').toLowerCase()
    const value = pick(row, 'waarde', 'value', 'inhoud')
    if (field) map.set(field, value)
  }
  const g = (k: string) => map.get(k) ?? ''
  return {
    slug: g('slug') || undefined,
    name: g('naam') || g('ploegnaam') || undefined,
    category: g('categorie') || undefined,
    season: g('seizoen') || undefined,
    homeBlurb: g('home_blurb') || g('intro') || undefined,
    highlightTitle: g('home_highlight_titel') || undefined,
    highlightText: g('home_highlight_tekst') || undefined,
    hallName: g('zaal_thuis') || g('zaal') || undefined,
    hallAddress: g('zaal_adres') || undefined,
    contactEmail: g('contact_email') || g('email') || undefined,
    vblCalendarUrl: g('vbl_kalender_url') || g('vbl_calendar_url') || undefined,
    aanwezigheidUrl: g('aanwezigheid_sheet_url') || undefined,
    externalSite: g('externe_site') || undefined,
    tagline: g('tagline') || g('slogan') || undefined,
  }
}

function defaultStaffLook(outfit: StaffOutfit, seed: string): StaffMember['look'] {
  if (outfit === 'volunteer') {
    return {
      hair: '#6b4423',
      skin: '#f0c4a0',
      hairStyle: 'long',
      cheek: '#ff8a7a',
    }
  }
  // coach defaults vary by seed
  if (/rafa/i.test(seed)) {
    return {
      hair: '#1a120e',
      skin: '#c9956c',
      hairStyle: 'side',
      cheek: '#d4785c',
    }
  }
  return {
    hair: '#5c3d24',
    skin: '#efc09a',
    hairStyle: 'short',
    cheek: '#f08070',
  }
}

function inferOutfit(role: string, raw: string): StaffOutfit {
  const r = (raw || role).toLowerCase()
  if (r.includes('vrijwill') || r.includes('volunteer') || r.includes('afgevaard')) {
    return 'volunteer'
  }
  if (raw === 'volunteer' || raw === 'vrijwilliger') return 'volunteer'
  return 'coach'
}

function inferMove(name: string, role: string, raw: string): { move: StaffMove; label: string } {
  const m = raw.toLowerCase()
  if (m === 'whistle-clap' || m === 'fluit') return { move: 'whistle-clap', label: 'Fluit & klap' }
  if (m === 'laugh' || m === 'lachen') return { move: 'laugh', label: 'Lachen!' }
  if (m === 'cheer' || m === 'juichen') return { move: 'cheer', label: 'Supporter' }
  if (/els/i.test(name) || /afgevaard/i.test(role)) return { move: 'cheer', label: 'Supporter' }
  if (/rafa/i.test(name)) return { move: 'laugh', label: 'Lachen!' }
  return { move: 'whistle-clap', label: 'Fluit & klap' }
}

/** Recover Staff CSV when live sheet mashed Jonathan into the header row. */
function staffObjects(csvText: string): Record<string, string>[] {
  const rows = parseCsv(csvText)
  if (rows.length === 0) return []
  const header = (rows[0] ?? []).map((h) => h.trim())
  const looksBroken = header.some((h) => /^naam\s+\S+/i.test(h) || /^rol\s+\S+/i.test(h))
  if (!looksBroken) return csvToObjects(csvText)

  const canon = ['naam', 'rol', 'email', 'telefoon', 'zichtbaar', 'volgorde', 'emoji', 'outfit', 'actie', 'actie_label', 'haarstijl', 'haarkleur', 'huidskleur', 'nota']
  const recovered: Record<string, string>[] = []

  // First header row embeds first staff member
  const first: Record<string, string> = {}
  for (let i = 0; i < header.length; i++) {
    const cell = header[i] ?? ''
    const key = canon[i] ?? `col${i}`
    const m = cell.match(/^(naam|rol|email|telefoon|zichtbaar|tonen|volgorde)\s*(.*)$/i)
    if (m) {
      first[m[1]!.toLowerCase()] = (m[2] ?? '').trim()
    } else if (i < canon.length) {
      first[key] = cell
    }
  }
  if (pick(first, 'naam')) recovered.push(first)

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r] ?? []
    if (cells.every((c) => !c.trim())) continue
    const obj: Record<string, string> = {}
    for (let c = 0; c < Math.max(cells.length, canon.length); c++) {
      obj[canon[c] ?? `col${c}`] = (cells[c] ?? '').trim()
    }
    if (pick(obj, 'naam')) recovered.push(obj)
  }
  return recovered
}

export function parseStaffCsv(csvText: string): StaffMember[] {
  const rows = staffObjects(csvText)
  const out: StaffMember[] = []
  for (const row of rows) {
    const name = pick(row, 'naam', 'name')
    if (!name) continue
    const visible = pick(row, 'zichtbaar', 'tonen', 'tonen_op_site')
    if (!isVisible(visible)) continue

    const role = pick(row, 'rol', 'role') || 'Staff'
    const outfit = inferOutfit(role, pick(row, 'outfit', 'kleding'))
    const { move, label } = inferMove(name, role, pick(row, 'actie', 'move', 'animatie'))
    const moveLabel = pick(row, 'actie_label', 'move_label') || label
    const id =
      pick(row, 'id') ||
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') ||
      `staff-${out.length + 1}`

    const hairKey = pick(row, 'haarkleur', 'hair')
    const skinKey = pick(row, 'huidskleur', 'skin')
    const hairStyle = (pick(row, 'haarstijl', 'hairstyle') || defaultStaffLook(outfit, name).hairStyle) as HairStyle
    const look = defaultStaffLook(outfit, name)
    if (hairKey && HAIR_COLOR_HEX[hairKey]) look.hair = HAIR_COLOR_HEX[hairKey]!
    if (skinKey && SKIN_COLOR_HEX[skinKey]) look.skin = SKIN_COLOR_HEX[skinKey]!
    look.hairStyle = hairStyle

    const emoji =
      pick(row, 'emoji') ||
      (outfit === 'volunteer' ? '🙌' : move === 'laugh' ? '😂' : '📢')

    out.push({
      id,
      name,
      role,
      note: pick(row, 'nota', 'note', 'bijschrift') || undefined,
      email: pick(row, 'email') || undefined,
      phone: pick(row, 'telefoon', 'phone') || undefined,
      emoji,
      outfit,
      move,
      moveLabel,
      look,
    })
  }
  return out
}


export function parseTrainingenWeekCsv(csvText: string): WeeklyTraining[] {
  const rows = csvToObjects(csvText)
  const out: WeeklyTraining[] = []
  for (const row of rows) {
    const day = pick(row, 'dag', 'day')
    if (!day) continue
    const activeRaw = pick(row, 'actief', 'active', 'aan')
    const start = pick(row, 'start', 'begin', 'uur_start')
    const end = pick(row, 'einde', 'eind', 'uur_einde')
    const active = isJa(activeRaw) && Boolean(start)
    out.push({
      day: capitalize(day),
      active,
      start,
      end,
      location: pick(row, 'locatie', 'location', 'zaal'),
      focus: pick(row, 'focus', 'thema', 'notitie'),
    })
  }
  return out
}

export function parseTrainingenDataCsv(
  csvText: string,
  week: WeeklyTraining[] = [],
): DatedTraining[] {
  const rows = csvToObjects(csvText)
  const weekByDay = new Map(
    week.filter((w) => w.active).map((w) => [w.day.toLowerCase(), w]),
  )
  const out: DatedTraining[] = []
  let i = 0
  for (const row of rows) {
    const dateIso = pick(row, 'datum', 'date', 'dateiso')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) continue
    const statusRaw = pick(row, 'status', 'doorgaan').toLowerCase() || 'ja'
    const status: 'ja' | 'nee' = statusRaw === 'nee' || statusRaw === 'no' ? 'nee' : 'ja'
    const dayName = capitalize(dayLabelFromIso(dateIso))
    const slot = weekByDay.get(dayName.toLowerCase())
    const start = pick(row, 'start', 'begin', 'uur') || slot?.start || ''
    const end = pick(row, 'einde', 'eind') || slot?.end || ''
    const time = start && end ? `${start}–${end}` : start || slot?.start || ''
    out.push({
      id: `dt-${++i}-${dateIso}`,
      dateIso,
      day: dayName,
      time,
      location: pick(row, 'locatie', 'location') || slot?.location || '',
      focus: pick(row, 'notitie', 'focus', 'note') || slot?.focus || '',
      status,
      note: pick(row, 'notitie', 'note') || undefined,
    })
  }
  return out.sort((a, b) => a.dateIso.localeCompare(b.dateIso))
}

export function parseEvenementenCsv(csvText: string): TeamEventItem[] {
  const rows = csvToObjects(csvText)
  const out: TeamEventItem[] = []
  for (const row of rows) {
    const title = pick(row, 'titel', 'title', 'naam')
    const date = pick(row, 'start_datum', 'datum', 'date')
    if (!title || !date) continue
    const visible = pick(row, 'zichtbaar', 'tonen')
    if (!isVisible(visible)) continue
    const slug =
      pick(row, 'slug', 'id') ||
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    out.push({
      id: slug,
      slug,
      title,
      date,
      time: pick(row, 'start_uur', 'uur', 'time'),
      endDate: pick(row, 'eind_datum', 'end_date') || undefined,
      endTime: pick(row, 'eind_uur', 'end_time') || undefined,
      place: pick(row, 'locatie', 'plaats', 'place', 'location'),
      description: pick(row, 'beschrijving', 'description', 'tekst'),
      emoji: pick(row, 'emoji') || '🎉',
      rsvpOpen: true,
      visible: true,
    })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

export function parseInfoCsv(csvText: string): InfoItem[] {
  const rows = csvToObjects(csvText)
  const out: InfoItem[] = []
  for (const row of rows) {
    const kind = pick(row, 'soort', 'type', 'kind').toLowerCase()
    const title = pick(row, 'titel', 'title')
    const text = pick(row, 'tekst', 'text', 'inhoud', 'waarde')
    if (!kind && !title && !text) continue
    const order = Number.parseInt(pick(row, 'volgorde', 'order', 'nr') || '0', 10)
    out.push({
      kind: kind || 'info',
      title,
      text,
      link: pick(row, 'link', 'url') || undefined,
      order: Number.isFinite(order) ? order : out.length + 1,
    })
  }
  return out.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'nl'))
}

export function infoToAfspraken(items: InfoItem[]): MatchAfspraken {
  const afspraken = items.filter((i) => i.kind === 'afspraak' || i.kind === 'afspraken')
  const draai = items.filter(
    (i) => i.kind === 'draai' || i.kind === 'draaischema' || i.kind === 'beurtrol',
  )
  return {
    title: afspraken[0]?.title?.startsWith('Afspraken')
      ? 'Afspraken wedstrijden'
      : afspraken.length
        ? 'Afspraken wedstrijden'
        : 'Afspraken wedstrijden',
    bullets: afspraken.map((i) => i.text || i.title).filter(Boolean),
    draaischema: {
      title: draai[0]?.title || 'Draaischema',
      bullets: draai.map((i) => i.text || i.title).filter(Boolean),
    },
  }
}

export function infoToHerfststage(items: InfoItem[]): HerfststageInfo {
  const stage = items.filter((i) => i.kind === 'stage' || i.kind === 'herfststage')
  if (stage.length === 0) return null
  const byTitle = (re: RegExp) =>
    stage.find((i) => re.test(i.title) || re.test(i.text)) ?? null
  const titleRow =
    stage.find((i) => /titel|stage|herfst/i.test(i.title) && i.text && !/€|BE\d{2}/i.test(i.text)) ||
    stage[0]!
  const tariff = byTitle(/tarief|prijs|kost/i)?.text ?? ''
  const iban = byTitle(/iban|rekening|bank/i)?.text ?? ''
  const mededeling = byTitle(/mededeling|referentie|overschrijving/i)?.text ?? ''
  const form =
    stage.find((i) => i.link && /form|inschrijf|http/i.test(i.link + i.title))?.link ||
    byTitle(/formulier|inschrijf/i)?.link ||
    byTitle(/formulier|inschrijf/i)?.text ||
    ''
  const notes = stage
    .filter((i) => /nota|tip|let op|belangrijk/i.test(i.title) || i.kind === 'stage')
    .map((i) => i.text)
    .filter(
      (t) =>
        t &&
        t !== tariff &&
        t !== iban &&
        t !== mededeling &&
        t !== titleRow.text &&
        !/^https?:/i.test(t),
    )
  const title =
    (/stage|herfst/i.test(titleRow.title) ? titleRow.title : null) ||
    titleRow.text ||
    'Herfststage'
  if (!tariff && !iban && !form && !titleRow.text) return null
  return {
    title: /stage|herfst/i.test(titleRow.title) ? titleRow.title : String(title),
    tariff,
    iban,
    mededeling,
    notes: [...new Set(notes)].slice(0, 4),
    formUrl: form.startsWith('http') ? form : '',
  }
}

export function weeklyToTeamTrainings(week: WeeklyTraining[]): {
  day: string
  time?: string
  location?: string
}[] {
  return week
    .filter((w) => w.active)
    .map((w) => ({
      day: w.day,
      time: w.start && w.end ? `${w.start}–${w.end}` : w.start || undefined,
      location: w.location || undefined,
    }))
}
