import type { AssetType, CycloneDxBom } from '../types/cyclonedx'
import type { Component } from '../types/cyclonedx-extended'
import { bomRef, createAsset, getPrimaryBlueprint } from './bom'

type SbomComponent = {
  'bom-ref'?: string
  type?: string
  name?: string
  version?: string
  description?: string
  [key: string]: unknown
}

type SbomService = {
  'bom-ref'?: string
  name?: string
  description?: string
  version?: string
  [key: string]: unknown
}

export type SbomImportCandidate = {
  key: string
  name: string
  kind: 'component' | 'service'
  type?: string
  version?: string
  description?: string
  /** Existing blueprint asset with same name (case-insensitive), if any */
  suggestedAssetRef?: string
  suggestedAssetName?: string
}

export type SbomMapDecision =
  | { action: 'create' }
  | { action: 'link'; assetRef: string }
  | { action: 'skip' }

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function assetTypeForComponent(type: string | undefined): AssetType {
  if (type === 'service') return 'service'
  return 'component'
}

function toComponent(entry: SbomComponent | SbomService, fallbackType: string): Component {
  const bomRefValue =
    typeof entry['bom-ref'] === 'string' && entry['bom-ref']
      ? entry['bom-ref']
      : bomRef(fallbackType === 'service' ? 'service' : 'component')
  return {
    'bom-ref': bomRefValue,
    type:
      ('type' in entry && typeof entry.type === 'string' ? entry.type : undefined) ??
      fallbackType,
    name: entry.name,
    version: typeof entry.version === 'string' ? entry.version : undefined,
    description: typeof entry.description === 'string' ? entry.description : undefined,
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

export function parseSbomJson(text: string): unknown {
  return JSON.parse(text) as unknown
}

/** List SBOM components/services for guided mapping before applying. */
export function listSbomCandidates(
  sbom: unknown,
  existingBom: CycloneDxBom,
): SbomImportCandidate[] {
  const src = asRecord(sbom)
  if (!src) return []

  const assets = getPrimaryBlueprint(existingBom).assets ?? []
  const byName = new Map(
    assets
      .filter((a) => a.name)
      .map((a) => [normalizeName(a.name!), a] as const),
  )

  const out: SbomImportCandidate[] = []
  const components = Array.isArray(src.components) ? (src.components as SbomComponent[]) : []
  const services = Array.isArray(src.services) ? (src.services as SbomService[]) : []

  for (const raw of components) {
    if (!raw || typeof raw !== 'object' || !raw.name) continue
    const key =
      typeof raw['bom-ref'] === 'string' && raw['bom-ref']
        ? raw['bom-ref']
        : `component:${raw.name}:${raw.version ?? ''}`
    const match = byName.get(normalizeName(raw.name))
    out.push({
      key,
      name: raw.name,
      kind: 'component',
      type: typeof raw.type === 'string' ? raw.type : undefined,
      version: typeof raw.version === 'string' ? raw.version : undefined,
      description: typeof raw.description === 'string' ? raw.description : undefined,
      suggestedAssetRef: match?.['bom-ref'],
      suggestedAssetName: match?.name,
    })
  }

  for (const raw of services) {
    if (!raw || typeof raw !== 'object' || !raw.name) continue
    const key =
      typeof raw['bom-ref'] === 'string' && raw['bom-ref']
        ? raw['bom-ref']
        : `service:${raw.name}`
    const match = byName.get(normalizeName(raw.name))
    out.push({
      key,
      name: raw.name,
      kind: 'service',
      type: 'service',
      version: typeof raw.version === 'string' ? raw.version : undefined,
      description: typeof raw.description === 'string' ? raw.description : undefined,
      suggestedAssetRef: match?.['bom-ref'],
      suggestedAssetName: match?.name,
    })
  }

  return out
}

export function defaultSbomDecisions(
  candidates: SbomImportCandidate[],
): Record<string, SbomMapDecision> {
  const decisions: Record<string, SbomMapDecision> = {}
  for (const c of candidates) {
    decisions[c.key] = c.suggestedAssetRef
      ? { action: 'link', assetRef: c.suggestedAssetRef }
      : { action: 'create' }
  }
  return decisions
}

/**
 * Apply SBOM import with per-component decisions (create asset / link existing / skip).
 */
export function applySbomImport(
  sbom: unknown,
  existingBom: CycloneDxBom,
  decisions: Record<string, SbomMapDecision>,
): { bom: CycloneDxBom; mapped: number; linked: number; skipped: number } {
  const bom = structuredClone(existingBom)
  const src = asRecord(sbom)
  if (!src) return { bom, mapped: 0, linked: 0, skipped: 0 }

  const bp = getPrimaryBlueprint(bom)
  bp.assets ??= []
  bom.components ??= []

  const existingRefs = new Set(
    (bom.components ?? [])
      .map((c) => c['bom-ref'])
      .filter((r): r is string => typeof r === 'string'),
  )

  let mapped = 0
  let linked = 0
  let skipped = 0

  const components = Array.isArray(src.components) ? (src.components as SbomComponent[]) : []
  const services = Array.isArray(src.services) ? (src.services as SbomService[]) : []

  const ensureComponent = (component: Component) => {
    const ref = component['bom-ref']!
    if (!existingRefs.has(ref)) {
      bom.components!.push(component)
      existingRefs.add(ref)
    }
    return ref
  }

  const process = (
    key: string,
    raw: SbomComponent | SbomService,
    kind: 'component' | 'service',
  ) => {
    const decision = decisions[key] ?? { action: 'create' as const }
    if (decision.action === 'skip') {
      skipped += 1
      return
    }

    const component = toComponent(
      raw,
      kind === 'service' ? 'service' : (raw as SbomComponent).type ?? 'library',
    )
    const ref = ensureComponent(component)

    if (decision.action === 'link') {
      const asset = bp.assets!.find((a) => a['bom-ref'] === decision.assetRef)
      if (asset) {
        asset.componentRef = ref
        linked += 1
        mapped += 1
        return
      }
      // Fall through to create if asset missing
    }

    bp.assets!.push(
      createAsset({
        name: raw.name!,
        description: typeof raw.description === 'string' ? raw.description : undefined,
        type: kind === 'service' ? 'service' : assetTypeForComponent((raw as SbomComponent).type),
        componentRef: ref,
      }),
    )
    mapped += 1
  }

  for (const raw of components) {
    if (!raw || typeof raw !== 'object' || !raw.name) continue
    const key =
      typeof raw['bom-ref'] === 'string' && raw['bom-ref']
        ? raw['bom-ref']
        : `component:${raw.name}:${raw.version ?? ''}`
    process(key, raw, 'component')
  }

  for (const raw of services) {
    if (!raw || typeof raw !== 'object' || !raw.name) continue
    const key =
      typeof raw['bom-ref'] === 'string' && raw['bom-ref']
        ? raw['bom-ref']
        : `service:${raw.name}`
    process(key, raw, 'service')
  }

  const serial =
    typeof src.serialNumber === 'string'
      ? src.serialNumber
      : typeof src.serialNumber === 'number'
        ? String(src.serialNumber)
        : undefined
  if (serial) {
    bom.externalReferences ??= []
    const url = serial.startsWith('urn:') ? serial : `urn:uuid:${serial}`
    const already = bom.externalReferences.some(
      (r) => r.type === 'bom' && r.url === url,
    )
    if (!already) {
      bom.externalReferences.push({ type: 'bom', url, comment: 'Imported SBOM' })
    }
  }

  bom.version = (bom.version ?? 1) + 1
  bom.metadata = {
    ...bom.metadata,
    timestamp: new Date().toISOString(),
  }

  return { bom, mapped, linked, skipped }
}

/**
 * Merge a CycloneDX SBOM into an existing TM-BOM (create new assets for every entry).
 */
export function importSbomToTmbom(
  sbom: unknown,
  existingBom: CycloneDxBom,
): { bom: CycloneDxBom; mapped: number } {
  const candidates = listSbomCandidates(sbom, existingBom)
  const decisions = Object.fromEntries(
    candidates.map((c) => [c.key, { action: 'create' as const }]),
  )
  const { bom, mapped } = applySbomImport(sbom, existingBom, decisions)
  return { bom, mapped }
}
