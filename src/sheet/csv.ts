/** Minimal CSV parser that respects quoted fields (incl. embedded newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let i = 0
  let inQuotes = false

  while (i < text.length) {
    const ch = text[i]!

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      cell += ch
      i += 1
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }

    if (ch === ',') {
      row.push(cell)
      cell = ''
      i += 1
      continue
    }

    if (ch === '\r') {
      i += 1
      continue
    }

    if (ch === '\n') {
      row.push(cell)
      cell = ''
      rows.push(row)
      row = []
      i += 1
      continue
    }

    cell += ch
    i += 1
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

/**
 * Header row → lowercase trimmed keys → record rows.
 * Skips leading note/uitleg rows (e.g. Matchen banner) until a real header is found.
 */
export function csvToObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text)
  if (rows.length === 0) return []

  let headerIdx = 0
  for (let i = 0; i < rows.length; i++) {
    const cells = (rows[i] ?? []).map((h) => h.trim().toLowerCase())
    const first = cells[0] ?? ''
    // Skip banner/note rows
    if (first.startsWith('_uitleg') || first.startsWith('uitleg') || first.startsWith('ℹ️')) {
      continue
    }
    // Prefer a row that looks like column headers (multiple short tokens, no long prose)
    const joined = cells.filter(Boolean).join(' ')
    if (
      cells.includes('datum') ||
      cells.includes('nummer') ||
      cells.includes('voornaam') ||
      cells.includes('veld') ||
      (cells.length >= 3 && !joined.includes(' automatisch '))
    ) {
      headerIdx = i
      break
    }
  }

  const headers = (rows[headerIdx] ?? []).map((h) => h.trim().toLowerCase())
  const out: Record<string, string>[] = []
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const cells = rows[r] ?? []
    if (cells.every((c) => !c.trim())) continue
    const obj: Record<string, string> = {}
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c]
      if (!key) continue
      obj[key] = (cells[c] ?? '').trim()
    }
    out.push(obj)
  }
  return out
}
