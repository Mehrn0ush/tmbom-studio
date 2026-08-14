/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import { readProjectFromFile } from './projectFiles'

describe('readProjectFromFile', () => {
  it('parses a JSON object', async () => {
    const file = new File(
      [JSON.stringify({ specFormat: 'CycloneDX', specVersion: '2.0' })],
      'demo.cdx.json',
      { type: 'application/json' },
    )
    const bom = await readProjectFromFile(file)
    expect(bom.specFormat).toBe('CycloneDX')
  })

  it('rejects invalid JSON with a clear message', async () => {
    const file = new File(['{not-json'], 'bad.json', { type: 'application/json' })
    await expect(readProjectFromFile(file)).rejects.toThrow(/not valid JSON/)
  })

  it('rejects non-object JSON', async () => {
    const file = new File(['[1,2]'], 'arr.json', { type: 'application/json' })
    await expect(readProjectFromFile(file)).rejects.toThrow(/JSON object/)
  })
})
