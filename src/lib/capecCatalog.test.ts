import { describe, expect, it } from 'vitest'
import {
  getCapecChildren,
  getCapecHierarchyRoots,
  getCapecParents,
  getCapecRelated,
} from './capecCatalog'

describe('capec hierarchy', () => {
  it('exposes ChildOf-related edges from vendored hierarchy', () => {
    const roots = getCapecHierarchyRoots()
    expect(roots.length).toBeGreaterThan(0)
    const sample = roots[0]
    const related = getCapecRelated(sample.capecId)
    expect(Array.isArray(related)).toBe(true)
  })

  it('resolves parents and children consistently', () => {
    // CAPEC-1 ChildOf CAPEC-122 in MITRE data
    const parents = getCapecParents(1)
    expect(parents.some((p) => p.capecId === 122)).toBe(true)
    const children = getCapecChildren(122)
    expect(children.some((c) => c.capecId === 1)).toBe(true)
  })
})
