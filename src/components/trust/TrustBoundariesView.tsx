import { useThreatModelStore } from '../../store/useThreatModelStore'
import { getPrimaryBlueprint } from '../../lib/bom'
import { EntityCrudView, Field, RefMultiSelect } from '../shared/EntityCrudView'
import type { TrustBoundary } from '../../types/cyclonedx'

const TRUST_LEVELS = [
  'untrusted',
  'semi-trusted',
  'trusted',
  'highly-trusted',
] as const

export function TrustBoundariesView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addTrustBoundary = useThreatModelStore((s) => s.addTrustBoundary)
  const updateTrustBoundary = useThreatModelStore((s) => s.updateTrustBoundary)
  const removeTrustBoundary = useThreatModelStore((s) => s.removeTrustBoundary)

  const items = bom.threats?.trustBoundaries ?? []
  const bp = getPrimaryBlueprint(bom)
  const boundaries = bp.boundaries ?? []
  const threats = bom.threats?.threats ?? []
  const controls = bom.controls ?? []

  const boundaryOptions = boundaries.map((b) => ({
    ref: b['bom-ref'],
    label: b.name ?? b['bom-ref'],
  }))

  return (
    <EntityCrudView
      title="Trust boundaries"
      description="Annotate blueprint boundaries with trust level, threats, and controls (threats.trustBoundaries[])."
      items={items}
      selectedRef={selectedRef}
      onSelect={setSelectedRef}
      getLabel={(t) => t.name ?? t.boundary}
      getSubtitle={(t) => t.trustLevel ?? 'untrusted'}
      onAdd={() => {
        const first = boundaries[0]?.['bom-ref']
        if (!first) return
        addTrustBoundary({ boundary: first, name: 'Trust boundary' })
      }}
      onRemove={removeTrustBoundary}
      emptyLabel={
        boundaries.length
          ? 'No trust boundary annotations yet.'
          : 'Add blueprint boundaries first.'
      }
      addLabel="Add trust boundary"
      renderInspector={(t: TrustBoundary) => (
        <>
          <h3>Trust boundary</h3>
          <Field label="Name">
            <input
              value={t.name ?? ''}
              onChange={(e) =>
                updateTrustBoundary(t['bom-ref'], { name: e.target.value })
              }
            />
          </Field>
          <Field label="Blueprint boundary">
            <select
              value={t.boundary}
              onChange={(e) =>
                updateTrustBoundary(t['bom-ref'], { boundary: e.target.value })
              }
            >
              {boundaryOptions.map((o) => (
                <option key={o.ref} value={o.ref}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trust level">
            <select
              value={t.trustLevel ?? 'untrusted'}
              onChange={(e) =>
                updateTrustBoundary(t['bom-ref'], {
                  trustLevel: e.target.value as TrustBoundary['trustLevel'],
                })
              }
            >
              {TRUST_LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
          </Field>
          <RefMultiSelect
            label="Threats at boundary"
            options={threats.map((th) => ({
              ref: th['bom-ref'],
              label: th.name,
            }))}
            value={t.threatsAtBoundary ?? []}
            onChange={(values) =>
              updateTrustBoundary(t['bom-ref'], { threatsAtBoundary: values })
            }
          />
          <RefMultiSelect
            label="Controls at boundary"
            options={controls.map((c) => ({
              ref: c['bom-ref'],
              label: c.name,
            }))}
            value={t.controlsAtBoundary ?? []}
            onChange={(values) =>
              updateTrustBoundary(t['bom-ref'], { controlsAtBoundary: values })
            }
          />
        </>
      )}
    />
  )
}
