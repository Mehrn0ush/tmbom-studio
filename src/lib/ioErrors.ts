/**
 * User-facing messages for save/open/import failures.
 */

export type IoAction = 'save' | 'open' | 'import' | 'load example'

/** Empty string means the caller should ignore (user cancelled). */
export function describeIoError(err: unknown, action: IoAction): string {
  if (err instanceof DOMException) {
    if (err.name === 'AbortError') return ''
    if (err.name === 'NotAllowedError') {
      return `Permission denied while trying to ${action}. Allow file access for this site, or use the download / file-picker fallback.`
    }
    if (err.name === 'NotFoundError') {
      return `The file could not be found while trying to ${action}.`
    }
    if (err.name === 'NotReadableError') {
      return `The file could not be read while trying to ${action}. It may be locked by another program.`
    }
    if (err.name === 'QuotaExceededError') {
      return `Storage quota exceeded while trying to ${action}. Free disk space or choose a different location.`
    }
    return `Could not ${action}: ${err.message || err.name}`
  }

  if (err instanceof SyntaxError) {
    return `The file is not valid JSON, so it could not be used as a TM-BOM (.cdx.json).`
  }

  if (err instanceof TypeError && /fetch|network|Failed to fetch/i.test(err.message)) {
    return `Network error while trying to ${action}. Check your connection and that the example file is available.`
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message
  }

  return `Could not ${action} the project file.`
}
