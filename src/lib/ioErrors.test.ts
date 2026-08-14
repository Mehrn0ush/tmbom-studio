import { describe, expect, it } from 'vitest'
import { describeIoError } from './ioErrors'

describe('describeIoError', () => {
  it('returns empty for AbortError so callers can ignore cancel', () => {
    expect(describeIoError(new DOMException('x', 'AbortError'), 'save')).toBe('')
  })

  it('explains permission and not-found cases', () => {
    expect(
      describeIoError(new DOMException('denied', 'NotAllowedError'), 'save'),
    ).toMatch(/Permission denied/)
    expect(
      describeIoError(new DOMException('gone', 'NotFoundError'), 'open'),
    ).toMatch(/could not be found/)
  })

  it('maps SyntaxError to a JSON guidance message', () => {
    expect(describeIoError(new SyntaxError('Unexpected token'), 'import')).toMatch(
      /not valid JSON/,
    )
  })

  it('preserves Error messages and falls back for unknowns', () => {
    expect(describeIoError(new Error('Custom fail'), 'open')).toBe('Custom fail')
    expect(describeIoError(42, 'save')).toMatch(/Could not save/)
  })
})
