/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useThreatModelStore } from './useThreatModelStore'

describe('useThreatModelStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useThreatModelStore.getState().newModel('Test System')
  })

  it('starts with an empty named model', () => {
    const { bom } = useThreatModelStore.getState()
    expect(bom.metadata?.component?.name).toBe('Test System')
    expect(bom.blueprints?.[0].assets).toEqual([])
    expect(bom.threats?.threats).toEqual([])
  })

  it('adds assets, flows, threats, and risks', () => {
    const store = useThreatModelStore.getState()
    const a = store.addAsset({ name: 'Gateway' })
    const b = store.addAsset({ name: 'Service' })
    const flow = store.addFlow({
      name: 'Forward',
      source: a,
      destination: b,
    })
    const threat = store.addThreat({
      name: 'Spoofing',
      affectedAssets: [a],
    })
    const risk = store.addRisk({
      name: 'Fraud',
      statement: 'If spoofing, then fraud.',
      relatedThreats: [threat],
    })

    const bom = useThreatModelStore.getState().bom
    expect(bom.blueprints![0].assets).toHaveLength(2)
    expect(bom.blueprints![0].flows?.[0]['bom-ref']).toBe(flow)
    expect(bom.threats!.threats).toHaveLength(1)
    expect(bom.risks!.risks?.[0]['bom-ref']).toBe(risk)
    expect(bom.version).toBeGreaterThan(1)
  })

  it('adds controls via the spec slice', () => {
    const ref = useThreatModelStore.getState().addControl({
      name: 'mTLS',
      category: 'preventive',
    })
    const controls = useThreatModelStore.getState().bom.controls ?? []
    expect(controls).toHaveLength(1)
    expect(controls[0]['bom-ref']).toBe(ref)
    expect(controls[0].name).toBe('mTLS')
  })

  it('exportBom strips local positions into properties', () => {
    const ref = useThreatModelStore.getState().addAsset({
      name: 'DB',
      _position: { x: 10, y: 20 },
    })
    const exported = useThreatModelStore.getState().exportBom()
    const asset = exported.blueprints![0].assets!.find(
      (a) => a['bom-ref'] === ref,
    )
    expect(asset?._position).toBeUndefined()
    expect(asset?.properties).toEqual(
      expect.arrayContaining([
        { name: 'threatmodeler:x', value: '10' },
        { name: 'threatmodeler:y', value: '20' },
      ]),
    )
  })

  it('loadSample replaces the working BOM', () => {
    useThreatModelStore.getState().loadSample()
    const bom = useThreatModelStore.getState().bom
    expect(bom.metadata?.component?.name).toBe('Checkout API')
    expect((bom.threats?.threats?.length ?? 0) > 0).toBe(true)
    expect((bom.controls?.length ?? 0) > 0).toBe(true)
  })
})
