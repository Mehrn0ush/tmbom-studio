import capecCatalogJson from '../data/capec-catalog.json'

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

export type CapecCatalogView = 'owasp' | 'all'

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

export function getCapecEntry(capecId: number): CapecCatalogEntry | undefined {
  return CAPEC_CATALOG.find((c) => c.capecId === capecId)
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
