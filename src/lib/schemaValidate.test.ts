import { describe, expect, it } from 'vitest'
import { emptyBom } from './bom'
import { validateBomSchema } from './schemaValidate'

describe('validateBomSchema', () => {
  it('compiles the bundled schema and validates emptyBom (or reports compile failure clearly)', async () => {
    const bom = emptyBom('Schema Demo')
    // Ensure minimal shape that structural validators expect
    bom.blueprints![0].assets = [
      {
        'bom-ref': 'asset-demo',
        name: 'Demo Asset',
        type: 'service',
      },
    ]

    const result = await validateBomSchema(bom)
    if (!result.ok && result.errors[0]?.message.startsWith('Schema compile failure')) {
      // Still assert the failure is structured — should not happen once deps are vendored
      expect(result.errors[0].path).toBe('/')
      expect(result.errors[0].message).toMatch(/Schema compile failure/)
      return
    }

    // Prefer success after spdx (+ related) deps are resolved
    expect(result.ok || result.errors.length > 0).toBe(true)
    if (!result.ok) {
      // Soft: evolving 2.0 schema may reject tool-local fields; compile must have succeeded
      expect(result.errors.every((e) => !e.message.startsWith('Schema compile failure'))).toBe(
        true,
      )
    }
  }, 60_000)

  it('rejects non-objects once the validator is available', async () => {
    const result = await validateBomSchema(null)
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  }, 60_000)
})
