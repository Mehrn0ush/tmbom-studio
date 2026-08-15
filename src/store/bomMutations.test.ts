import { describe, expect, it } from 'vitest'
import { emptyBom } from '../lib/bom'
import { bumpVersion, mutateBlueprint } from './bomMutations'

describe('bomMutations', () => {
  it('bumpVersion increments and refreshes timestamp', () => {
    const bom = emptyBom()
    bom.version = 3
    bumpVersion(bom)
    expect(bom.version).toBe(4)
    expect(bom.metadata?.timestamp).toBeTruthy()
  })

  it('mutateBlueprint clones before editing', () => {
    const bom = emptyBom()
    const originalName = bom.blueprints![0].name
    const next = mutateBlueprint(bom, (bp) => {
      bp.name = 'Mutated'
    })
    expect(bom.blueprints![0].name).toBe(originalName)
    expect(next.blueprints![0].name).toBe('Mutated')
    expect(next.version).toBe((bom.version ?? 1) + 1)
  })
})
