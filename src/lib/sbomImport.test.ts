import { describe, expect, it } from 'vitest'
import { emptyBom, getPrimaryBlueprint } from './bom'
import {
  applySbomImport,
  importSbomToTmbom,
  listSbomCandidates,
  parseSbomJson,
} from './sbomImport'

describe('parseSbomJson', () => {
  it('parses JSON text', () => {
    expect(parseSbomJson('{"bomFormat":"CycloneDX"}')).toEqual({
      bomFormat: 'CycloneDX',
    })
  })
})

describe('importSbomToTmbom', () => {
  it('maps components and services to assets with componentRef', () => {
    const existing = emptyBom('Host')
    existing.threats!.threats = [
      { 'bom-ref': 'threat-keep', name: 'Keep me' },
    ]
    const threatCount = existing.threats!.threats!.length

    const sbom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      serialNumber: 'urn:uuid:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      components: [
        {
          'bom-ref': 'pkg:lib/foo@1.0',
          type: 'library',
          name: 'foo',
          version: '1.0.0',
        },
        {
          type: 'application',
          name: 'app',
        },
        {
          type: 'library',
          // no name — skipped
        },
      ],
      services: [
        {
          'bom-ref': 'svc-api',
          name: 'Payments API',
          description: 'Checkout API',
        },
      ],
    }

    const { bom, mapped } = importSbomToTmbom(sbom, existing)
    expect(mapped).toBe(3)
    expect(bom.threats!.threats).toHaveLength(threatCount)
    expect(bom.threats!.threats![0].name).toBe('Keep me')

    const bp = getPrimaryBlueprint(bom)
    expect(bp.assets!.some((a) => a.name === 'foo' && a.componentRef === 'pkg:lib/foo@1.0')).toBe(
      true,
    )
    expect(bp.assets!.some((a) => a.name === 'Payments API' && a.type === 'service')).toBe(true)
    expect(bom.components!.some((c) => c.name === 'foo')).toBe(true)
    expect(bom.components!.some((c) => c['bom-ref'] === 'svc-api')).toBe(true)
    expect(
      bom.externalReferences?.some(
        (r) =>
          r.type === 'bom' &&
          r.url === 'urn:uuid:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      ),
    ).toBe(true)
    expect(bom.version).toBe((existing.version ?? 1) + 1)
  })

  it('returns mapped 0 for non-object sbom', () => {
    const existing = emptyBom()
    const { bom, mapped } = importSbomToTmbom(null, existing)
    expect(mapped).toBe(0)
    expect(bom.specFormat).toBe('CycloneDX')
  })

  it('links to an existing asset when decided', () => {
    const existing = emptyBom('Host')
    const bp = getPrimaryBlueprint(existing)
    bp.assets = [
      {
        'bom-ref': 'asset-checkout',
        name: 'Checkout',
        type: 'service',
      },
    ]
    const sbom = {
      components: [
        { 'bom-ref': 'pkg:app/checkout@2', type: 'application', name: 'Checkout' },
      ],
    }
    const candidates = listSbomCandidates(sbom, existing)
    expect(candidates[0]?.suggestedAssetRef).toBe('asset-checkout')
    const { bom, linked, mapped } = applySbomImport(sbom, existing, {
      [candidates[0]!.key]: { action: 'link', assetRef: 'asset-checkout' },
    })
    expect(mapped).toBe(1)
    expect(linked).toBe(1)
    const asset = getPrimaryBlueprint(bom).assets!.find(
      (a) => a['bom-ref'] === 'asset-checkout',
    )
    expect(asset?.componentRef).toBe('pkg:app/checkout@2')
    expect(getPrimaryBlueprint(bom).assets).toHaveLength(1)
  })

  it('skips candidates marked skip', () => {
    const existing = emptyBom()
    const sbom = {
      components: [{ 'bom-ref': 'pkg:x', type: 'library', name: 'x' }],
    }
    const { mapped, skipped } = applySbomImport(sbom, existing, {
      'pkg:x': { action: 'skip' },
    })
    expect(mapped).toBe(0)
    expect(skipped).toBe(1)
  })
})
