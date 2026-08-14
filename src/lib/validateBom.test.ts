import { describe, expect, it } from 'vitest'
import { emptyBom, createAsset, createFlow, createThreat } from './bom'
import { validateTmbom } from './validateBom'

describe('validateTmbom', () => {
  it('rejects non-objects', () => {
    const result = validateTmbom(null)
    expect(result.ok).toBe(false)
    expect(result.errors[0]?.message).toMatch(/JSON object/)
  })

  it('accepts emptyBom with asset warnings only', () => {
    const result = validateTmbom(emptyBom('Demo'))
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.some((w) => w.path.includes('assets'))).toBe(true)
  })

  it('flags missing CycloneDX format', () => {
    const bom = emptyBom()
    // @ts-expect-error intentional invalid fixture
    bom.specFormat = 'Other'
    const result = validateTmbom(bom)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.path === '/specFormat')).toBe(true)
  })

  it('requires blueprint name and modelTypes', () => {
    const bom = emptyBom()
    bom.blueprints![0].name = ''
    bom.blueprints![0].modelTypes = []
    const result = validateTmbom(bom)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.path.includes('/name'))).toBe(true)
    expect(result.errors.some((e) => e.path.includes('modelTypes'))).toBe(true)
  })

  it('validates flows, threats, scenarios, and risks', () => {
    const bom = emptyBom()
    const bp = bom.blueprints![0]
    const asset = createAsset({ name: 'Svc' })
    bp.assets = [asset]
    bp.flows = [
      createFlow({
        name: '',
        source: '',
        destination: '',
      }),
    ]
    bp.flows[0].name = ''
    bp.flows[0].source = ''
    bp.flows[0].destination = ''

    bom.threats!.threats = [{ 'bom-ref': '', name: '' } as never]
    bom.threats!.scenarios = [
      { 'bom-ref': 'sc-1', name: 'Incomplete', threats: [] },
    ]
    bom.risks!.risks = [
      { 'bom-ref': 'r-1', name: 'Missing statement' } as never,
    ]

    const result = validateTmbom(bom)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.path.includes('/flows/'))).toBe(true)
    expect(result.errors.some((e) => e.path.includes('/threats/threats/'))).toBe(
      true,
    )
    expect(result.errors.some((e) => e.path.includes('/scenarios/'))).toBe(true)
    expect(result.errors.some((e) => e.path.includes('/risks/risks/'))).toBe(
      true,
    )
  })

  it('passes a minimal coherent model', () => {
    const bom = emptyBom('Checkout')
    const bp = bom.blueprints![0]
    const a = createAsset({ name: 'Gateway' })
    const b = createAsset({ name: 'Service' })
    bp.assets = [a, b]
    bp.flows = [
      createFlow({
        name: 'Forward',
        source: a['bom-ref'],
        destination: b['bom-ref'],
      }),
    ]
    const threat = createThreat({ name: 'Spoofing', affectedAssets: [a['bom-ref']] })
    bom.threats!.threats = [threat]
    bom.threats!.scenarios = [
      {
        'bom-ref': 'sc-1',
        name: 'Key theft',
        threats: [threat['bom-ref']],
      },
    ]
    bom.risks!.risks = [
      {
        'bom-ref': 'risk-1',
        name: 'Fraud',
        statement: 'If spoofing, then fraud.',
      },
    ]

    const result = validateTmbom(bom)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
