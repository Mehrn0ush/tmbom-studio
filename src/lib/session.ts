import type { CycloneDxBom, ExternalReference, Property } from '../types/cyclonedx'

export const SESSION_TITLE = 'tmbom-studio:session-title'
export const SESSION_DATE = 'tmbom-studio:session-date'
export const SESSION_NOTES = 'tmbom-studio:session-notes'

export interface WorkshopSession {
  title: string
  date: string
  notes: string
  participants: Array<{ name: string; email?: string }>
}

function getProp(bom: CycloneDxBom, name: string): string {
  return bom.properties?.find((p) => p.name === name)?.value ?? ''
}

function setProp(properties: Property[] | undefined, name: string, value: string): Property[] {
  const next = (properties ?? []).filter((p) => p.name !== name)
  if (value.trim()) next.push({ name, value })
  return next
}

export function readSession(bom: CycloneDxBom): WorkshopSession {
  return {
    title: getProp(bom, SESSION_TITLE) || `${bom.metadata?.component?.name ?? 'System'} workshop`,
    date: getProp(bom, SESSION_DATE) || new Date().toISOString().slice(0, 10),
    notes: getProp(bom, SESSION_NOTES),
    participants: (bom.metadata?.authors ?? []).map((a) => ({
      name: a.name ?? 'Participant',
      email: a.email,
    })),
  }
}

export function applySession(bom: CycloneDxBom, session: WorkshopSession): CycloneDxBom {
  const next = structuredClone(bom)
  next.metadata ??= {}
  next.metadata.authors = session.participants
    .filter((p) => p.name.trim())
    .map((p) => ({
      name: p.name.trim(),
      email: p.email?.trim() || undefined,
    }))
  next.properties = setProp(next.properties, SESSION_TITLE, session.title)
  next.properties = setProp(next.properties, SESSION_DATE, session.date)
  next.properties = setProp(next.properties, SESSION_NOTES, session.notes)
  return next
}

export interface SessionPackage {
  format: 'tmbom-studio-session'
  version: '1'
  exportedAt: string
  session: WorkshopSession
  bom: CycloneDxBom
}

export function buildSessionPackage(
  bom: CycloneDxBom,
  session: WorkshopSession,
): SessionPackage {
  return {
    format: 'tmbom-studio-session',
    version: '1',
    exportedAt: new Date().toISOString(),
    session,
    bom: applySession(bom, session),
  }
}

export function parseSessionPackage(raw: unknown): {
  bom: CycloneDxBom
  session?: WorkshopSession
} {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid session package')
  }
  const obj = raw as Record<string, unknown>
  if (obj.format === 'tmbom-studio-session' && obj.bom) {
    return {
      bom: obj.bom as CycloneDxBom,
      session: obj.session as WorkshopSession | undefined,
    }
  }
  return { bom: raw as CycloneDxBom }
}

/** CycloneDX BOM-Link URN: urn:cdx:serialNumber/version[#bom-ref] */
export function buildBomLink(
  serialNumber: string,
  version: number | string = 1,
  elementRef?: string,
): string {
  const serial = serialNumber.replace(/^urn:uuid:/, '')
  const base = `urn:cdx:${serial}/${version}`
  return elementRef ? `${base}#${elementRef}` : base
}

export function isBomLink(url: string): boolean {
  return url.startsWith('urn:cdx:')
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function upsertExternalReference(
  refs: ExternalReference[] | undefined,
  ref: ExternalReference,
): ExternalReference[] {
  const list = [...(refs ?? [])]
  const idx = list.findIndex((r) => r.type === ref.type && r.url === ref.url)
  if (idx >= 0) list[idx] = ref
  else list.push(ref)
  return list
}
