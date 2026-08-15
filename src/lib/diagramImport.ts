import type { Asset, CycloneDxBom, Flow, Zone } from '../types/cyclonedx'
import {
  createAsset,
  createFlow,
  createZone,
  getPrimaryBlueprint,
} from './bom'

export type DiagramImportResult = {
  assets: Asset[]
  zones: Zone[]
  flows: Flow[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function cellLabel(cell: Record<string, unknown>): string {
  const attrs = asRecord(cell.attrs)
  const text = attrs ? asRecord(attrs.text) : null
  if (text && typeof text.text === 'string' && text.text.trim()) return text.text.trim()
  if (typeof cell.name === 'string' && cell.name.trim()) return cell.name.trim()
  if (typeof cell.value === 'string' && cell.value.trim()) {
    return cell.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return ''
}

function collectThreatDragonCells(json: unknown): Record<string, unknown>[] {
  const root = asRecord(json)
  if (!root) return []

  const cells: Record<string, unknown>[] = []

  const pushCells = (list: unknown) => {
    if (!Array.isArray(list)) return
    for (const item of list) {
      const rec = asRecord(item)
      if (rec) cells.push(rec)
    }
  }

  const diagram = asRecord(root.diagram)
  if (diagram) pushCells(diagram.cells)

  const detail = asRecord(root.detail)
  if (detail) {
    const diagrams = detail.diagrams
    if (Array.isArray(diagrams)) {
      for (const d of diagrams) {
        const dr = asRecord(d)
        if (!dr) continue
        pushCells(dr.cells)
        // Threat Dragon v2 sometimes nests diagram under each entry
        const nested = asRecord(dr.diagram)
        if (nested) pushCells(nested.cells)
      }
    }
  }

  if (Array.isArray(root.cells)) pushCells(root.cells)

  return cells
}

function threatDragonShapeKind(
  type: string,
): 'process' | 'store' | 'actor' | 'boundary' | 'flow' | null {
  const t = type.toLowerCase()
  if (t.includes('flow') || t.endsWith('.flow')) return 'flow'
  if (t.includes('boundary') || t.includes('trustboundary')) return 'boundary'
  if (t.includes('store') || t.includes('datastore')) return 'store'
  if (t.includes('actor')) return 'actor'
  if (t.includes('process')) return 'process'
  return null
}

/** Lossy import of OWASP Threat Dragon JSON into blueprint patches. */
export function importThreatDragon(json: unknown): DiagramImportResult {
  const cells = collectThreatDragonCells(json)
  const assets: Asset[] = []
  const zones: Zone[] = []
  const flows: Flow[] = []
  const idToRef = new Map<string, string>()

  for (const cell of cells) {
    const type = typeof cell.type === 'string' ? cell.type : ''
    const kind = threatDragonShapeKind(type)
    if (!kind || kind === 'flow') continue
    const id = typeof cell.id === 'string' ? cell.id : undefined
    const name = cellLabel(cell) || kind
    if (kind === 'boundary') {
      const zone = createZone({ name, type: 'trust' })
      zones.push(zone)
      if (id) idToRef.set(id, zone['bom-ref'])
      continue
    }
    const assetType =
      kind === 'store' ? 'data-store' : kind === 'actor' ? 'actor' : 'process'
    const asset = createAsset({ name, type: assetType })
    assets.push(asset)
    if (id) idToRef.set(id, asset['bom-ref'])
  }

  for (const cell of cells) {
    const type = typeof cell.type === 'string' ? cell.type : ''
    if (threatDragonShapeKind(type) !== 'flow') continue
    const source = asRecord(cell.source)
    const target = asRecord(cell.target)
    const sourceId = source && typeof source.id === 'string' ? source.id : undefined
    const targetId = target && typeof target.id === 'string' ? target.id : undefined
    if (!sourceId || !targetId) continue
    const srcRef = idToRef.get(sourceId)
    const dstRef = idToRef.get(targetId)
    if (!srcRef || !dstRef) continue
    const name = cellLabel(cell) || 'Flow'
    flows.push(createFlow({ name, source: srcRef, destination: dstRef }))
  }

  return { assets, zones, flows }
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseMxCellsFromXml(xml: string): Array<{
  id: string
  value?: string
  edge?: boolean
  vertex?: boolean
  source?: string
  target?: string
}> {
  const cells: Array<{
    id: string
    value?: string
    edge?: boolean
    vertex?: boolean
    source?: string
    target?: string
  }> = []

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(xml, 'application/xml')
      const nodes = doc.getElementsByTagName('mxCell')
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const id = n.getAttribute('id')
        if (!id) continue
        cells.push({
          id,
          value: n.getAttribute('value') ?? undefined,
          edge: n.getAttribute('edge') === '1',
          vertex: n.getAttribute('vertex') === '1',
          source: n.getAttribute('source') ?? undefined,
          target: n.getAttribute('target') ?? undefined,
        })
      }
      if (cells.length) return cells
    } catch {
      /* fall through to regex */
    }
  }

  const re =
    /<mxCell\b([^>]*)\/?>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const attrs = m[1]
    const get = (name: string): string | undefined => {
      const am = new RegExp(`\\b${name}="([^"]*)"`, 'i').exec(attrs)
      return am ? am[1] : undefined
    }
    const id = get('id')
    if (!id) continue
    cells.push({
      id,
      value: get('value'),
      edge: get('edge') === '1',
      vertex: get('vertex') === '1',
      source: get('source'),
      target: get('target'),
    })
  }
  return cells
}

function extractDrawioXml(xmlOrJson: string): string | null {
  const trimmed = xmlOrJson.trim()

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      const rec = asRecord(parsed)
      if (!rec) return null
      if (typeof rec.mxfile === 'string') return rec.mxfile
      if (typeof rec.xml === 'string') return rec.xml
      for (const key of Object.keys(rec)) {
        const v = rec[key]
        if (
          typeof v === 'string' &&
          (v.includes('<mxfile') || v.includes('<mxGraphModel'))
        ) {
          return v
        }
      }
    } catch {
      /* not JSON */
    }
    return null
  }

  if (
    trimmed.startsWith('<mxfile') ||
    trimmed.startsWith('<mxGraphModel') ||
    trimmed.includes('<mxGraphModel') ||
    trimmed.includes('<mxfile')
  ) {
    return trimmed
  }

  return null
}

/** Lossy import of draw.io XML (or JSON wrapping mxfile) into blueprint patches. */
export function importDrawio(xmlOrJson: string): DiagramImportResult {
  const xml = extractDrawioXml(xmlOrJson)
  if (!xml) return { assets: [], zones: [], flows: [] }

  const mxCells = parseMxCellsFromXml(xml)
  const assets: Asset[] = []
  const zones: Zone[] = []
  const flows: Flow[] = []
  const idToRef = new Map<string, string>()

  for (const cell of mxCells) {
    if (!cell.vertex || cell.edge) continue
    const label = cell.value ? stripHtml(cell.value) : ''
    if (!label) continue
    const asset = createAsset({ name: label, type: 'process' })
    assets.push(asset)
    idToRef.set(cell.id, asset['bom-ref'])
  }

  for (const cell of mxCells) {
    if (!cell.edge) continue
    if (!cell.source || !cell.target) continue
    const srcRef = idToRef.get(cell.source)
    const dstRef = idToRef.get(cell.target)
    if (!srcRef || !dstRef) continue
    const name = cell.value ? stripHtml(cell.value) || 'Flow' : 'Flow'
    flows.push(createFlow({ name, source: srcRef, destination: dstRef }))
  }

  return { assets, zones, flows }
}

/** Merge a diagram import result into the primary blueprint of a TM-BOM. */
export function applyDiagramImport(
  bom: CycloneDxBom,
  importResult: DiagramImportResult,
): CycloneDxBom {
  const next = structuredClone(bom)
  const bp = getPrimaryBlueprint(next)
  bp.assets = [...(bp.assets ?? []), ...importResult.assets]
  bp.zones = [...(bp.zones ?? []), ...importResult.zones]
  bp.flows = [...(bp.flows ?? []), ...importResult.flows]
  next.version = (next.version ?? 1) + 1
  next.metadata = {
    ...next.metadata,
    timestamp: new Date().toISOString(),
  }
  return next
}
