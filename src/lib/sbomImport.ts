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
    type: ('type' in entry && typeof entry.type === 'string' ? entry.type : undefined) ?? fallbackType,
    name: entry.name,
    version: typeof entry.version === 'string' ? entry.version : undefined,
    description: typeof entry.description === 'string' ? entry.description : undefined,
  }
}

export function parseSbomJson(text: string): unknown {
  return JSON.parse(text) as unknown
}

/**
 * Merge a CycloneDX 1.x / 2.0-ish SBOM into an existing TM-BOM.
 * Creates blueprint assets linked via componentRef; preserves threats/blueprints.
 */
export function importSbomToTmbom(
  sbom: unknown,
  existingBom: CycloneDxBom,
): { bom: CycloneDxBom; mapped: number } {
  const bom = structuredClone(existingBom)
  const src = asRecord(sbom)
  if (!src) return { bom, mapped: 0 }

  const bp = getPrimaryBlueprint(bom)
  bp.assets ??= []
  bom.components ??= []

  const existingRefs = new Set(
    (bom.components ?? [])
      .map((c) => c['bom-ref'])
      .filter((r): r is string => typeof r === 'string'),
  )

  let mapped = 0
  const components = Array.isArray(src.components) ? (src.components as SbomComponent[]) : []
  const services = Array.isArray(src.services) ? (src.services as SbomService[]) : []

  for (const raw of components) {
    if (!raw || typeof raw !== 'object' || !raw.name) continue
    const component = toComponent(raw, raw.type ?? 'library')
    const ref = component['bom-ref']!
    if (!existingRefs.has(ref)) {
      bom.components!.push(component)
      existingRefs.add(ref)
    }
    bp.assets.push(
      createAsset({
        name: raw.name,
        description: typeof raw.description === 'string' ? raw.description : undefined,
        type: assetTypeForComponent(raw.type),
        componentRef: ref,
      }),
    )
    mapped += 1
  }

  for (const raw of services) {
    if (!raw || typeof raw !== 'object' || !raw.name) continue
    const component = toComponent(raw, 'service')
    const ref = component['bom-ref']!
    if (!existingRefs.has(ref)) {
      bom.components!.push(component)
      existingRefs.add(ref)
    }
    bp.assets.push(
      createAsset({
        name: raw.name,
        description: typeof raw.description === 'string' ? raw.description : undefined,
        type: 'service',
        componentRef: ref,
      }),
    )
    mapped += 1
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

  return { bom, mapped }
}
