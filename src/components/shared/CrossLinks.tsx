import { useThreatModelStore } from '../../store/useThreatModelStore'
import type { WorkspaceView } from '../../types/cyclonedx'
import { getPrimaryBlueprint } from '../../lib/bom'

export type CrossLink = { label: string; view: WorkspaceView; ref: string }

/** Navigate to a related entity from inspectors. */
export function CrossLinks({ links }: { links: CrossLink[] }) {
  const setView = useThreatModelStore((s) => s.setView)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)

  if (links.length === 0) {
    return <p className="muted">No cross-links yet.</p>
  }

  return (
    <div className="cross-links">
      {links.map((l) => (
        <button
          key={`${l.view}-${l.ref}`}
          type="button"
          className="btn"
          onClick={() => {
            setSelectedRef(l.ref)
            setView(l.view)
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function useThreatCrossLinks(threatRef: string): CrossLink[] {
  const bom = useThreatModelStore((s) => s.bom)
  const threat = bom.threats?.threats?.find((t) => t['bom-ref'] === threatRef)
  if (!threat) return []

  const assets = getPrimaryBlueprint(bom).assets ?? []
  const patterns = bom.threats?.attackPatterns ?? []
  const trees = bom.threats?.attackTrees ?? []
  const risks = bom.risks?.risks ?? []
  const controls = bom.controls ?? []
  const links: CrossLink[] = []

  for (const ref of threat.affectedAssets ?? []) {
    const a = assets.find((x) => x['bom-ref'] === ref)
    links.push({
      label: `Asset: ${a?.name ?? ref}`,
      view: 'blueprint',
      ref,
    })
  }
  for (const ref of threat.attackPatterns ?? []) {
    const p = patterns.find((x) => x['bom-ref'] === ref)
    links.push({
      label: `CAPEC: ${p?.name ?? ref}`,
      view: 'attack-patterns',
      ref,
    })
  }
  for (const ref of threat.attackTrees ?? []) {
    const t = trees.find((x) => x['bom-ref'] === ref)
    links.push({
      label: `Tree: ${t?.name ?? ref}`,
      view: 'attack-trees',
      ref,
    })
  }
  for (const ref of threat.mitigations ?? []) {
    const c = controls.find((x) => x['bom-ref'] === ref)
    links.push({
      label: `Control: ${c?.name ?? ref}`,
      view: 'controls',
      ref,
    })
  }
  for (const r of risks) {
    if (r.relatedThreats?.includes(threatRef)) {
      links.push({ label: `Risk: ${r.name}`, view: 'risks', ref: r['bom-ref'] })
    }
  }
  return links
}

export function useRiskCrossLinks(riskRef: string): CrossLink[] {
  const bom = useThreatModelStore((s) => s.bom)
  const risk = bom.risks?.risks?.find((r) => r['bom-ref'] === riskRef)
  if (!risk) return []

  const threats = bom.threats?.threats ?? []
  const scenarios = bom.threats?.scenarios ?? []
  const assets = getPrimaryBlueprint(bom).assets ?? []
  const controls = bom.controls ?? []
  const links: CrossLink[] = []

  for (const ref of risk.relatedThreats ?? []) {
    const t = threats.find((x) => x['bom-ref'] === ref)
    if (t) {
      links.push({ label: `Threat: ${t.name}`, view: 'threats', ref })
      continue
    }
    const sc = scenarios.find((x) => x['bom-ref'] === ref)
    if (sc) {
      links.push({ label: `Scenario: ${sc.name}`, view: 'scenarios', ref })
    }
  }
  for (const ref of risk.affects ?? []) {
    const a = assets.find((x) => x['bom-ref'] === ref)
    links.push({
      label: `Asset: ${a?.name ?? ref}`,
      view: 'blueprint',
      ref,
    })
  }
  for (const resp of risk.responses ?? []) {
    for (const ref of resp.controls ?? []) {
      const c = controls.find((x) => x['bom-ref'] === ref)
      links.push({
        label: `Control: ${c?.name ?? ref}`,
        view: 'controls',
        ref,
      })
    }
  }
  return links
}

export function useAttackPatternCrossLinks(patternRef: string): CrossLink[] {
  const bom = useThreatModelStore((s) => s.bom)
  const threats = bom.threats?.threats ?? []
  const risks = bom.risks?.risks ?? []
  const links: CrossLink[] = []

  for (const t of threats) {
    if (t.attackPatterns?.includes(patternRef)) {
      links.push({
        label: `Threat: ${t.name}`,
        view: 'threats',
        ref: t['bom-ref'],
      })
      for (const r of risks) {
        if (r.relatedThreats?.includes(t['bom-ref'])) {
          links.push({
            label: `Risk: ${r.name}`,
            view: 'risks',
            ref: r['bom-ref'],
          })
        }
      }
    }
  }
  return links
}

export function useAttackTreeCrossLinks(treeRef: string): CrossLink[] {
  const bom = useThreatModelStore((s) => s.bom)
  const threats = bom.threats?.threats ?? []
  const risks = bom.risks?.risks ?? []
  const links: CrossLink[] = []

  for (const t of threats) {
    if (t.attackTrees?.includes(treeRef)) {
      links.push({
        label: `Threat: ${t.name}`,
        view: 'threats',
        ref: t['bom-ref'],
      })
      for (const r of risks) {
        if (r.relatedThreats?.includes(t['bom-ref'])) {
          links.push({
            label: `Risk: ${r.name}`,
            view: 'risks',
            ref: r['bom-ref'],
          })
        }
      }
    }
  }
  return links
}
