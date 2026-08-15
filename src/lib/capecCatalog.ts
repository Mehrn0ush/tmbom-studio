import capecCatalogJson from '../data/capec-catalog.json'
import capecHierarchyJson from '../data/capec-hierarchy.json'

/** CAPEC List 3.9 entry (generated from official MITRE CSVs) */
export type CapecCatalogEntry = {
  capecId: number
  name: string
  description: string
  abstraction?: string
  status?: string
  severity?: string
  likelihood?: string
  owaspRelated?: boolean
  techniques?: Array<{ id: string; name: string; tactic?: string }>
}

export type CapecRelatedEdge = { nature: string; capecId: number }

export type CapecCatalogView = 'owasp' | 'all' | 'hierarchy'

export const CAPEC_META = capecCatalogJson.meta as {
  version: string
  source: string
  views: Record<string, string>
  count: number
  owaspRelatedCount: number
}

/** Full CAPEC List 3.9 dictionary (View 2000), with View 659 OWASP flags */
export const CAPEC_CATALOG: CapecCatalogEntry[] =
  capecCatalogJson.patterns as CapecCatalogEntry[]

const byId = new Map(CAPEC_CATALOG.map((c) => [c.capecId, c]))

/** Related Attack Patterns edges (Views 1000/3000/2000 share this graph in CAPEC 3.9). */
export const CAPEC_RELATED: Record<string, CapecRelatedEdge[]> =
  (capecHierarchyJson as { related: Record<string, CapecRelatedEdge[]> })
    .related ?? {}

export function getCapecEntry(capecId: number): CapecCatalogEntry | undefined {
  return byId.get(capecId)
}

export function getCapecRelated(capecId: number): CapecRelatedEdge[] {
  return CAPEC_RELATED[String(capecId)] ?? []
}

/** Patterns that declare ChildOf → parentId (children of parent). */
export function getCapecChildren(parentId: number): CapecCatalogEntry[] {
  const children: CapecCatalogEntry[] = []
  for (const [id, edges] of Object.entries(CAPEC_RELATED)) {
    if (edges.some((e) => e.nature === 'ChildOf' && e.capecId === parentId)) {
      const entry = byId.get(Number(id))
      if (entry) children.push(entry)
    }
  }
  return children.sort((a, b) => a.capecId - b.capecId)
}

export function getCapecParents(capecId: number): CapecCatalogEntry[] {
  return getCapecRelated(capecId)
    .filter((e) => e.nature === 'ChildOf')
    .map((e) => byId.get(e.capecId))
    .filter((e): e is CapecCatalogEntry => !!e)
}

/** Meta / Category roots: patterns with no ChildOf parent (or Meta abstraction). */
export function getCapecHierarchyRoots(): CapecCatalogEntry[] {
  const roots = CAPEC_CATALOG.filter((c) => {
    const parents = getCapecRelated(c.capecId).filter((e) => e.nature === 'ChildOf')
    return parents.length === 0 && (c.abstraction === 'Meta' || c.abstraction === 'Category')
  })
  if (roots.length > 0) return roots.sort((a, b) => a.capecId - b.capecId)
  // Fallback: any pattern without ChildOf
  return CAPEC_CATALOG.filter(
    (c) => getCapecRelated(c.capecId).filter((e) => e.nature === 'ChildOf').length === 0,
  )
    .filter((c) => c.abstraction === 'Meta' || c.abstraction === 'Standard')
    .slice(0, 40)
}

export function filterCapecCatalog(
  view: CapecCatalogView,
  query = '',
): CapecCatalogEntry[] {
  const q = query.trim().toLowerCase()
  return CAPEC_CATALOG.filter((c) => {
    if (view === 'owasp' && !c.owaspRelated) return false
    if (!q) return true
    return (
      String(c.capecId).includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q)
    )
  })
}
