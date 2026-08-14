import { v4 as uuidv4 } from 'uuid'
import type {
  Asset,
  Blueprint,
  Boundary,
  CycloneDxBom,
  Flow,
  Risk,
  Threat,
  ThreatScenario,
  Zone,
} from '../types/cyclonedx'

export function bomRef(prefix: string): string {
  return `${prefix}-${uuidv4().slice(0, 8)}`
}

export function serialNumber(): string {
  return `urn:uuid:${uuidv4()}`
}

export function emptyBom(name = 'Untitled System'): CycloneDxBom {
  const blueprintRef = bomRef('blueprint')
  return {
    $schema: 'https://cyclonedx.org/schema/2.0/cyclonedx-2.0.schema.json',
    specFormat: 'CycloneDX',
    specVersion: '2.0',
    serialNumber: serialNumber(),
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        type: 'application',
        name,
        version: '0.1.0',
        'bom-ref': bomRef('component'),
      },
      tools: {
        components: [
          {
            type: 'application',
            name: 'ThreatModeler',
            version: '0.1.0',
          },
        ],
      },
    },
    blueprints: [
      {
        'bom-ref': blueprintRef,
        name: `${name} Architecture`,
        description: 'System architecture blueprint for threat modeling',
        modelTypes: ['data-flow', 'architecture'],
        assets: [],
        zones: [],
        boundaries: [],
        flows: [],
        actors: [],
      },
    ],
    threats: {
      methodologies: ['STRIDE'],
      threats: [],
      scenarios: [],
      attackPaths: [],
      abuseCases: [],
      trustBoundaries: [],
    },
    risks: {
      risks: [],
      assessments: [],
    },
    controls: [],
    definitions: {
      requirements: [],
      businessObjectives: [],
      useCases: [],
    },
    profiles: {
      threatProfiles: [],
      dataProfiles: [],
    },
    components: [],
  }
}

export function getPrimaryBlueprint(bom: CycloneDxBom): Blueprint {
  if (!bom.blueprints?.length) {
    const bp: Blueprint = {
      'bom-ref': bomRef('blueprint'),
      name: 'Architecture',
      modelTypes: ['data-flow'],
      assets: [],
      zones: [],
      boundaries: [],
      flows: [],
      actors: [],
    }
    bom.blueprints = [bp]
  }
  return bom.blueprints[0]
}

export function createAsset(
  partial: Partial<Asset> & { name: string },
): Asset {
  return {
    'bom-ref': bomRef('asset'),
    type: 'service',
    _position: { x: 120, y: 120 },
    ...partial,
  }
}

export function createZone(
  partial: Partial<Zone> & { name: string },
): Zone {
  return {
    'bom-ref': bomRef('zone'),
    type: 'trust',
    ...partial,
  }
}

export function createBoundary(
  partial: Partial<Boundary> & { zones: string[] },
): Boundary {
  return {
    'bom-ref': bomRef('boundary'),
    type: 'trust',
    name: 'Trust Boundary',
    ...partial,
  }
}

export function createFlow(
  partial: Partial<Flow> & {
    name: string
    source: string
    destination: string
  },
): Flow {
  return {
    'bom-ref': bomRef('flow'),
    type: 'data',
    ...partial,
  }
}

export function createThreat(
  partial: Partial<Threat> & { name: string },
): Threat {
  return {
    'bom-ref': bomRef('threat'),
    ...partial,
  }
}

export function createScenario(
  partial: Partial<ThreatScenario> & { name: string; threats: string[] },
): ThreatScenario {
  return {
    'bom-ref': bomRef('scenario'),
    ...partial,
  }
}

export function createRisk(
  partial: Partial<Risk> & { name: string; statement: string },
): Risk {
  return {
    'bom-ref': bomRef('risk'),
    domains: [{ type: 'security' }],
    ...partial,
  }
}

/** Strip tool-local fields before CycloneDX export */
export function toExportBom(bom: CycloneDxBom): CycloneDxBom {
  const clone = structuredClone(bom)
  for (const bp of clone.blueprints ?? []) {
    for (const asset of bp.assets ?? []) {
      if (asset._position) {
        asset.properties = [
          ...(asset.properties ?? []).filter(
            (p) => p.name !== 'threatmodeler:x' && p.name !== 'threatmodeler:y',
          ),
          { name: 'threatmodeler:x', value: String(asset._position.x) },
          { name: 'threatmodeler:y', value: String(asset._position.y) },
        ]
        delete asset._position
      }
    }
    for (const actor of bp.actors ?? []) {
      if (actor._position) {
        actor.properties = [
          ...(actor.properties ?? []).filter(
            (p) => p.name !== 'threatmodeler:x' && p.name !== 'threatmodeler:y',
          ),
          { name: 'threatmodeler:x', value: String(actor._position.x) },
          { name: 'threatmodeler:y', value: String(actor._position.y) },
        ]
        delete actor._position
      }
    }
  }
  clone.metadata = {
    ...clone.metadata,
    timestamp: new Date().toISOString(),
  }
  return clone
}

export function fromImportBom(raw: unknown): CycloneDxBom {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid BOM: expected a JSON object')
  }
  const bom = raw as CycloneDxBom
  if (bom.specFormat !== 'CycloneDX') {
    throw new Error('Invalid BOM: specFormat must be "CycloneDX"')
  }
  if (!bom.specVersion) {
    throw new Error('Invalid BOM: missing specVersion')
  }

  for (const bp of bom.blueprints ?? []) {
    for (const asset of bp.assets ?? []) {
      const x = asset.properties?.find((p) => p.name === 'threatmodeler:x')?.value
      const y = asset.properties?.find((p) => p.name === 'threatmodeler:y')?.value
      if (x !== undefined && y !== undefined) {
        asset._position = { x: Number(x), y: Number(y) }
      } else {
        asset._position = { x: 80 + Math.random() * 400, y: 80 + Math.random() * 240 }
      }
    }
  }

  bom.threats ??= { methodologies: ['STRIDE'], threats: [], scenarios: [] }
  bom.risks ??= { risks: [], assessments: [] }
  bom.controls ??= []
  bom.definitions ??= {
    requirements: [],
    businessObjectives: [],
    useCases: [],
  }
  bom.profiles ??= { threatProfiles: [], dataProfiles: [] }
  bom.components ??= []
  bom.blueprints ??= []
  if (!bom.blueprints.length) {
    getPrimaryBlueprint(bom)
  }

  return bom
}
