import type { CycloneDxBom } from '../types/cyclonedx'
import { readThreatInScope } from '../types/cyclonedx'

export type InScopeExportMode = 'all' | 'in-scope-only' | 'flag-out-of-scope'

/**
 * Filter or annotate threats by cyclonedx:in-scope convention for export/report.
 * - all: unchanged
 * - in-scope-only: drop threats with explicit false
 * - flag-out-of-scope: keep all (caller marks in UI/report)
 */
export function filterBomByInScope(
  bom: CycloneDxBom,
  mode: InScopeExportMode,
): CycloneDxBom {
  if (mode === 'all' || mode === 'flag-out-of-scope') {
    return structuredClone(bom)
  }
  const next = structuredClone(bom)
  if (!next.threats?.threats) return next
  next.threats.threats = next.threats.threats.filter(
    (t) => readThreatInScope(t.properties) !== false,
  )
  const kept = new Set(next.threats.threats.map((t) => t['bom-ref']))
  if (next.threats.scenarios) {
    next.threats.scenarios = next.threats.scenarios
      .map((sc) => ({
        ...sc,
        threats: sc.threats.filter((r) => kept.has(r)),
      }))
      .filter((sc) => sc.threats.length > 0)
  }
  if (next.risks?.risks) {
    next.risks.risks = next.risks.risks.map((r) => ({
      ...r,
      relatedThreats: r.relatedThreats?.filter((ref) => kept.has(ref)),
    }))
  }
  return next
}

export function partitionThreatsByScope(bom: CycloneDxBom) {
  const threats = bom.threats?.threats ?? []
  const inScope = threats.filter((t) => readThreatInScope(t.properties) !== false)
  const outOfScope = threats.filter(
    (t) => readThreatInScope(t.properties) === false,
  )
  return { inScope, outOfScope }
}
