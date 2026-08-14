import { describe, expect, it } from 'vitest'
import {
  IN_SCOPE_PROPERTY,
  readThreatInScope,
  writeThreatInScope,
} from './cyclonedx-extended'

describe('threat in-scope helpers', () => {
  it('reads cyclonedx:in-scope', () => {
    expect(
      readThreatInScope([{ name: IN_SCOPE_PROPERTY, value: 'true' }]),
    ).toBe(true)
    expect(
      readThreatInScope([{ name: IN_SCOPE_PROPERTY, value: 'false' }]),
    ).toBe(false)
  })

  it('reads legacy asf:in-scope', () => {
    expect(readThreatInScope([{ name: 'asf:in-scope', value: 'false' }])).toBe(
      false,
    )
  })

  it('returns undefined when unset', () => {
    expect(readThreatInScope(undefined)).toBeUndefined()
    expect(readThreatInScope([{ name: 'other', value: 'x' }])).toBeUndefined()
  })

  it('writes and clears the property without dropping others', () => {
    const withScope = writeThreatInScope(
      [{ name: 'keep', value: '1' }, { name: 'asf:in-scope', value: 'true' }],
      false,
    )
    expect(withScope).toEqual([
      { name: 'keep', value: '1' },
      { name: IN_SCOPE_PROPERTY, value: 'false' },
    ])

    const cleared = writeThreatInScope(withScope, undefined)
    expect(cleared).toEqual([{ name: 'keep', value: '1' }])
  })
})
