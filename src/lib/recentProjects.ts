import type { CycloneDxBom } from '../types/cyclonedx'
import { getPrimaryBlueprint } from './bom'
import { suggestedFileName } from './projectFiles'

const RECENT_KEY = 'tmbom-studio-recent-projects'
const MAX_RECENT = 8

export interface RecentProject {
  id: string
  name: string
  fileName: string
  savedAt: string
  assets: number
  threats: number
  risks: number
  /** Compact export kept for quick reopen (drafts only) */
  snapshot?: CycloneDxBom
}

export function summarizeBom(bom: CycloneDxBom) {
  const bp = getPrimaryBlueprint(bom)
  return {
    name: bom.metadata?.component?.name ?? bp.name ?? 'Untitled',
    fileName: suggestedFileName(bom),
    assets: bp.assets?.length ?? 0,
    threats: bom.threats?.threats?.length ?? 0,
    risks: bom.risks?.risks?.length ?? 0,
  }
}

export function listRecentProjects(): RecentProject[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentProject[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function rememberRecentProject(bom: CycloneDxBom): RecentProject[] {
  const summary = summarizeBom(bom)
  const entry: RecentProject = {
    id: bom.serialNumber ?? summary.fileName,
    name: summary.name,
    fileName: summary.fileName,
    savedAt: new Date().toISOString(),
    assets: summary.assets,
    threats: summary.threats,
    risks: summary.risks,
    snapshot: bom,
  }
  const next = [
    entry,
    ...listRecentProjects().filter((p) => p.id !== entry.id),
  ].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

export function clearRecentProjects() {
  localStorage.removeItem(RECENT_KEY)
}

export const BUNDLED_EXAMPLES = [
  {
    id: 'checkout-api',
    name: 'Checkout API',
    description: 'Sample STRIDE TM-BOM with zones, flows, threats, and risks',
    path: 'examples/checkout-api.cdx.json',
  },
] as const
