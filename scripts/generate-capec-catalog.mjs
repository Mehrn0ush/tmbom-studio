#!/usr/bin/env node
/**
 * Build src/data/capec-catalog.json from vendored CAPEC List 3.9 CSVs.
 *
 * Sources (see data/capec/README.md):
 * - View 2000 Comprehensive CAPEC Dictionary
 * - View 659 OWASP Related Patterns (owaspRelated flag)
 */
import { createReadStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

/** Minimal CSV parser that respects quoted fields (CAPEC exports use these). */
function parseCsvLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur)
  return fields
}

async function loadCsv(relPath) {
  const full = path.join(root, relPath)
  const rl = createInterface({
    input: createReadStream(full, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })
  let headers = null
  const rows = []
  let buffer = ''
  for await (const raw of rl) {
    buffer = buffer ? `${buffer}\n${raw}` : raw
    // Unclosed quotes → continue accumulating (multiline fields)
    const quotes = (buffer.match(/"/g) || []).length
    if (quotes % 2 === 1) continue
    const line = buffer
    buffer = ''
    if (!headers) {
      headers = parseCsvLine(line).map((h) => h.replace(/^\uFEFF/, ''))
      continue
    }
    const values = parseCsvLine(line)
    const row = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    rows.push(row)
  }
  return rows
}

function rowId(row) {
  const raw = row["'ID"] ?? row.ID ?? ''
  return Number(String(raw).replace(/^'/, '').trim())
}

function parseAttackTechniques(taxonomy) {
  if (!taxonomy) return []
  const techniques = []
  // CAPEC uses "::" as the field delimiter; ENTRY NAME may contain ":"
  const re = /TAXONOMY NAME:ATTACK:ENTRY ID:([^:]+):ENTRY NAME:(.+?)::/g
  let m
  while ((m = re.exec(taxonomy)) !== null) {
    const eid = m[1].trim()
    const name = m[2].trim().replace(/:+$/, '')
    if (!eid) continue
    const id = eid.toUpperCase().startsWith('T') ? eid : `T${eid}`
    techniques.push({ id, name })
  }
  const seen = new Set()
  return techniques.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
}

function shortDescription(desc, max = 360) {
  const cleaned = String(desc || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1).trimEnd()}…`
}

const full = await loadCsv('data/capec/2000/2000.csv')
const owaspIds = new Set(
  (await loadCsv('data/capec/659/659.csv')).map(rowId).filter(Number.isFinite),
)

const patterns = full
  .map((row) => {
    const capecId = rowId(row)
    if (!Number.isFinite(capecId)) return null
    const techniques = parseAttackTechniques(row['Taxonomy Mappings'] || '')
    const entry = {
      capecId,
      name: row.Name || `CAPEC-${capecId}`,
      description: shortDescription(row.Description),
      abstraction: row.Abstraction || '',
      status: row.Status || '',
      severity: row['Typical Severity'] || '',
      likelihood: row['Likelihood Of Attack'] || '',
      owaspRelated: owaspIds.has(capecId),
    }
    if (techniques.length) entry.techniques = techniques
    return entry
  })
  .filter(Boolean)
  .sort((a, b) => a.capecId - b.capecId)

const payload = {
  meta: {
    version: '3.9',
    source: 'https://capec.mitre.org/data/downloads.html',
    views: {
      1000: 'Mechanisms of Attack',
      3000: 'Domains of Attack',
      659: 'OWASP Related Patterns',
      2000: 'Comprehensive CAPEC Dictionary',
    },
    generatedFrom: 'data/capec/2000/2000.csv + data/capec/659/659.csv',
    count: patterns.length,
    owaspRelatedCount: patterns.filter((p) => p.owaspRelated).length,
  },
  patterns,
}

const outDir = path.join(root, 'src/data')
await mkdir(outDir, { recursive: true })
const outFile = path.join(outDir, 'capec-catalog.json')
await writeFile(outFile, JSON.stringify(payload), 'utf8')
console.log(
  `Wrote ${path.relative(root, outFile)} (${patterns.length} patterns, ${payload.meta.owaspRelatedCount} OWASP-related)`,
)
