import { useThreatModelStore } from '../../store/useThreatModelStore'
import type { WorkspaceView } from '../../types/cyclonedx'
import { getPrimaryBlueprint } from '../../lib/bom'

type Link = { label: string; view: WorkspaceView; ref: string }

/** Navigate to a related entity from threat/risk inspectors. */
export function CrossLinks({ links }: { links: Link[] }) {
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

export function useThreatCrossLinks(threatRef: string): Link[] {
  const bom = useThreatModelStore((s) => s.bom)
  const threat = bom.threats?.threats?.find((t) => t['bom-ref'] === threatRef)
  if (!threat) return []

  const assets = getPrimaryBlueprint(bom).assets ?? []
  const patterns = bom.threats?.attackPatterns ?? []
  const trees = bom.threats?.attackTrees ?? []
  const risks = bom.risks?.risks ?? []
  const controls = bom.controls ?? []
  const links: Link[] = []

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
