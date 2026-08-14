import { useThreatModelStore } from '../../store/useThreatModelStore'
import { EntityCrudView, Field, RefMultiSelect } from '../shared/EntityCrudView'
import type { Control } from '../../types/cyclonedx'

const CATEGORIES = [
  'preventive',
  'detective',
  'corrective',
  'compensating',
  'deterrent',
  'recovery',
] as const

const STATUSES = [
  'planned',
  'in-progress',
  'implemented',
  'verified',
  'deprecated',
] as const

export function ControlsView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addControl = useThreatModelStore((s) => s.addControl)
  const updateControl = useThreatModelStore((s) => s.updateControl)
  const removeControl = useThreatModelStore((s) => s.removeControl)

  const controls = bom.controls ?? []
  const threats = bom.threats?.threats ?? []
  const boundaries = bom.blueprints?.[0]?.boundaries ?? []
  const assets = bom.blueprints?.[0]?.assets ?? []
  const applyOptions = [
    ...assets.map((a) => ({
      ref: a['bom-ref'],
      label: `Asset: ${a.name ?? a['bom-ref']}`,
    })),
    ...boundaries.map((b) => ({
      ref: b['bom-ref'],
      label: `Boundary: ${b.name ?? b['bom-ref']}`,
    })),
  ]

  const renderInspector = (c: Control) => (
    <>
      <h3>Control</h3>
      <Field label="Name">
        <input
          value={c.name}
          onChange={(e) =>
            updateControl(c['bom-ref'], { name: e.target.value })
          }
        />
      </Field>
      <Field label="Description">
        <textarea
          value={c.description ?? ''}
          onChange={(e) =>
            updateControl(c['bom-ref'], { description: e.target.value })
          }
        />
      </Field>
      <Field label="Category">
        <select
          value={typeof c.category === 'string' ? c.category : ''}
          onChange={(e) =>
            updateControl(c['bom-ref'], {
              category: e.target.value as Control['category'],
            })
          }
        >
          <option value="">—</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select
          value={typeof c.status === 'string' ? c.status : 'planned'}
          onChange={(e) =>
            updateControl(c['bom-ref'], {
              status: e.target.value as Control['status'],
            })
          }
        >
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </Field>
      <RefMultiSelect
        label="Applies to"
        options={applyOptions}
        value={c.appliesTo ?? []}
        onChange={(values) =>
          updateControl(c['bom-ref'], { appliesTo: values })
        }
      />
      <Field label="Linked from threats">
        <p className="muted" style={{ margin: 0 }}>
          {(threats.filter((t) => t.mitigations?.includes(c['bom-ref'])) ?? [])
            .map((t) => t.name)
            .join(', ') || 'None — link from Threats inspector'}
        </p>
      </Field>
      <p className="mono muted">{c['bom-ref']}</p>
    </>
  )

  return (
    <EntityCrudView
      title="Controls"
      description="Safeguards referenced from threats, trust boundaries, and risk responses (CycloneDX controls[])."
      items={controls}
      selectedRef={selectedRef}
      onSelect={setSelectedRef}
      getLabel={(c) => c.name}
      getSubtitle={(c) =>
        `${typeof c.category === 'string' ? c.category : 'control'} · ${typeof c.status === 'string' ? c.status : 'planned'}`
      }
      onAdd={() => addControl({ name: 'New control' })}
      onRemove={removeControl}
      renderInspector={renderInspector}
      addLabel="Add control"
    />
  )
}
