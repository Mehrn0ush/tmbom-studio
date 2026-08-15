import { describe, expect, it } from 'vitest'
import { emptyBom, createThreat } from './bom'
import { filterBomByInScope, partitionThreatsByScope } from './inScopeFilter'
import { writeThreatInScope } from '../types/cyclonedx'

describe('filterBomByInScope', () => {
  it('drops explicitly out-of-scope threats in in-scope-only mode', () => {
    const bom = emptyBom('Lib')
    const keep = createThreat({ name: 'In' })
    const drop = createThreat({ name: 'Out' })
    drop.properties = writeThreatInScope(drop.properties, false)
    bom.threats!.threats = [keep, drop]
    bom.threats!.scenarios = [
      {
        'bom-ref': 'sc-1',
        name: 'S',
        threats: [keep['bom-ref'], drop['bom-ref']],
      },
    ]

    const filtered = filterBomByInScope(bom, 'in-scope-only')
    expect(filtered.threats?.threats?.map((t) => t.name)).toEqual(['In'])
    expect(filtered.threats?.scenarios?.[0]?.threats).toEqual([keep['bom-ref']])
  })

  it('keeps all threats for all / flag modes', () => {
    const bom = emptyBom('X')
    const t = createThreat({ name: 'Out' })
    t.properties = writeThreatInScope(t.properties, false)
    bom.threats!.threats = [t]
    expect(filterBomByInScope(bom, 'all').threats?.threats).toHaveLength(1)
    expect(
      filterBomByInScope(bom, 'flag-out-of-scope').threats?.threats,
    ).toHaveLength(1)
  })
})

describe('partitionThreatsByScope', () => {
  it('partitions by cyclonedx:in-scope convention', () => {
    const bom = emptyBom('X')
    const a = createThreat({ name: 'A' })
    const b = createThreat({ name: 'B' })
    b.properties = writeThreatInScope(b.properties, false)
    bom.threats!.threats = [a, b]
    const { inScope, outOfScope } = partitionThreatsByScope(bom)
    expect(inScope.map((t) => t.name)).toEqual(['A'])
    expect(outOfScope.map((t) => t.name)).toEqual(['B'])
  })
})
