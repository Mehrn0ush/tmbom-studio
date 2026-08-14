import { describe, expect, it } from 'vitest'
import {
  bomRef,
  createAsset,
  createFlow,
  createRisk,
  createThreat,
  createZone,
  emptyBom,
  fromImportBom,
  getPrimaryBlueprint,
  toExportBom,
} from './bom'

describe('bomRef', () => {
  it('prefixes a short uuid segment', () => {
    const ref = bomRef('asset')
    expect(ref).toMatch(/^asset-[0-9a-f]{8}$/)
  })

  it('produces distinct refs', () => {
    expect(bomRef('t')).not.toBe(bomRef('t'))
  })
})

describe('emptyBom', () => {
  it('creates a CycloneDX 2.0 TM-BOM skeleton', () => {
    const bom = emptyBom('Payments API')
    expect(bom.specFormat).toBe('CycloneDX')
    expect(bom.specVersion).toBe('2.0')
    expect(bom.metadata?.component?.name).toBe('Payments API')
    expect(bom.blueprints).toHaveLength(1)
    expect(bom.threats?.methodologies).toContain('STRIDE')
    expect(bom.controls).toEqual([])
    expect(bom.definitions?.requirements).toEqual([])
    expect(bom.profiles?.threatProfiles).toEqual([])
    expect(bom.components).toEqual([])
  })
})

describe('factories', () => {
  it('createAsset fills defaults', () => {
    const asset = createAsset({ name: 'API Gateway' })
    expect(asset.name).toBe('API Gateway')
    expect(asset.type).toBe('service')
    expect(asset['bom-ref']).toMatch(/^asset-/)
    expect(asset._position).toEqual({ x: 120, y: 120 })
  })

  it('createZone / createFlow / createThreat / createRisk', () => {
    const zone = createZone({ name: 'DMZ' })
    expect(zone.type).toBe('trust')

    const flow = createFlow({
      name: 'Place order',
      source: 'a',
      destination: 'b',
    })
    expect(flow.type).toBe('data')
    expect(flow.source).toBe('a')

    const threat = createThreat({ name: 'Spoofing' })
    expect(threat['bom-ref']).toMatch(/^threat-/)

    const risk = createRisk({
      name: 'Fraud',
      statement: 'If spoofing succeeds, then fraud.',
    })
    expect(risk.domains).toEqual([{ type: 'security' }])
  })
})

describe('getPrimaryBlueprint', () => {
  it('returns the first blueprint', () => {
    const bom = emptyBom()
    const bp = getPrimaryBlueprint(bom)
    expect(bp['bom-ref']).toBe(bom.blueprints![0]['bom-ref'])
  })

  it('creates a blueprint when missing', () => {
    const bom = emptyBom()
    bom.blueprints = []
    const bp = getPrimaryBlueprint(bom)
    expect(bom.blueprints).toHaveLength(1)
    expect(bp.name).toBe('Architecture')
  })
})

describe('toExportBom / fromImportBom', () => {
  it('serializes asset positions into properties and restores them', () => {
    const bom = emptyBom('Roundtrip')
    const bp = getPrimaryBlueprint(bom)
    bp.assets = [
      createAsset({
        name: 'Checkout',
        _position: { x: 42, y: 99 },
      }),
    ]

    const exported = toExportBom(bom)
    const asset = exported.blueprints![0].assets![0]
    expect(asset._position).toBeUndefined()
    expect(asset.properties).toEqual(
      expect.arrayContaining([
        { name: 'threatmodeler:x', value: '42' },
        { name: 'threatmodeler:y', value: '99' },
      ]),
    )

    const imported = fromImportBom(exported)
    expect(imported.blueprints![0].assets![0]._position).toEqual({
      x: 42,
      y: 99,
    })
  })

  it('rejects invalid import payloads', () => {
    expect(() => fromImportBom(null)).toThrow(/JSON object/)
    expect(() => fromImportBom({ specFormat: 'SPDX' })).toThrow(/CycloneDX/)
    expect(() =>
      fromImportBom({ specFormat: 'CycloneDX' }),
    ).toThrow(/specVersion/)
  })

  it('fills missing TM sections on import', () => {
    const imported = fromImportBom({
      specFormat: 'CycloneDX',
      specVersion: '2.0',
      blueprints: [
        {
          'bom-ref': 'bp-1',
          name: 'DFD',
          modelTypes: ['data-flow'],
          assets: [],
        },
      ],
    })
    expect(imported.controls).toEqual([])
    expect(imported.threats?.threats).toEqual([])
    expect(imported.risks?.risks).toEqual([])
    expect(imported.definitions?.useCases).toEqual([])
  })
})
