/**
 * Save/load TM-BOM project files outside the browser.
 * Prefer File System Access API when available; fall back to download / file input.
 */

import type { CycloneDxBom } from '../types/cyclonedx'

export function suggestedFileName(bom: CycloneDxBom): string {
  const name = (bom.metadata?.component?.name ?? 'threat-model')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${name || 'threat-model'}.cdx.json`
}

export function downloadProjectFile(bom: CycloneDxBom, fileName?: string): void {
  const json = JSON.stringify(bom, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName ?? suggestedFileName(bom)
  a.click()
  URL.revokeObjectURL(url)
}

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  }) => Promise<FileSystemFileHandle>
}

type OpenPickerWindow = Window & {
  showOpenFilePicker?: (options?: {
    multiple?: boolean
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  }) => Promise<FileSystemFileHandle[]>
}

const CDX_TYPE = {
  description: 'CycloneDX TM-BOM',
  accept: {
    'application/json': ['.json', '.cdx.json'],
  },
}

/** Save using native picker when supported; otherwise trigger a download. */
export async function saveProjectFile(bom: CycloneDxBom): Promise<'picker' | 'download'> {
  const w = window as SavePickerWindow
  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: suggestedFileName(bom),
        types: [CDX_TYPE],
      })
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(bom, null, 2))
      await writable.close()
      return 'picker'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
      // Fall through to download on permission / unsupported edge cases
    }
  }
  downloadProjectFile(bom)
  return 'download'
}

/** Open a project file via native picker. Returns null if cancelled / unsupported. */
export async function openProjectFileWithPicker(): Promise<CycloneDxBom | null> {
  const w = window as OpenPickerWindow
  if (typeof w.showOpenFilePicker !== 'function') {
    return null
  }
  try {
    const [handle] = await w.showOpenFilePicker({
      multiple: false,
      types: [CDX_TYPE],
    })
    const file = await handle.getFile()
    const text = await file.text()
    return JSON.parse(text) as CycloneDxBom
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null
    }
    throw err
  }
}

export async function readProjectFromFile(file: File): Promise<CycloneDxBom> {
  const text = await file.text()
  return JSON.parse(text) as CycloneDxBom
}

/** Org convention: keep durable models under projects/ in Git */
export const PROJECTS_FOLDER_HINT = 'projects/<system-name>.cdx.json'
