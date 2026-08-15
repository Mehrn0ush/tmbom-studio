import { useThreatModelStore } from '../../store/useThreatModelStore'
import { EntityCrudView, Field } from '../shared/EntityCrudView'
import type { AttackPath } from '../../types/cyclonedx'

export function AttackPathsView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addAttackPath = useThreatModelStore((s) => s.addAttackPath)
  const updateAttackPath = useThreatModelStore((s) => s.updateAttackPath)
  const removeAttackPath = useThreatModelStore((s) => s.removeAttackPath)
  const addAttackPathStep = useThreatModelStore((s) => s.addAttackPathStep)

  const paths = bom.threats?.attackPaths ?? []

  return (
    <EntityCrudView
      title="Attack paths"
      description="Ordered attack steps (threats.attackPaths[])."
      items={paths}
      selectedRef={selectedRef}
      onSelect={setSelectedRef}
      getLabel={(p) => p.name}
      getSubtitle={(p) => `${p.steps.length} step(s)`}
      onAdd={() => addAttackPath({ name: 'New attack path' })}
      onRemove={removeAttackPath}
      renderInspector={(p: AttackPath) => (
        <>
          <h3>Attack path</h3>
          <Field label="Name">
            <input
              value={p.name}
              onChange={(e) =>
                updateAttackPath(p['bom-ref'], { name: e.target.value })
              }
            />
          </Field>
          <Field label="Description">
            <textarea
              value={p.description ?? ''}
              onChange={(e) =>
                updateAttackPath(p['bom-ref'], { description: e.target.value })
              }
            />
          </Field>
          <Field label="Steps">
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {p.steps.map((s, i) => (
                <li key={s['bom-ref'] ?? i}>{s.description}</li>
              ))}
            </ol>
            <button
              className="btn"
              type="button"
              style={{ marginTop: 8 }}
              onClick={() =>
                addAttackPathStep(p['bom-ref'], {
                  description: 'New step',
                })
              }
            >
              Add step
            </button>
          </Field>
        </>
      )}
    />
  )
}
