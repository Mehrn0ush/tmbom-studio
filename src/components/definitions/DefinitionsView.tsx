import { useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { EntityCrudView, Field } from '../shared/EntityCrudView'
import type {
  BusinessObjective,
  Requirement,
  UseCaseDefinition,
} from '../../types/cyclonedx'

type DefTab = 'requirements' | 'objectives' | 'useCases'

export function DefinitionsView() {
  const [tab, setTab] = useState<DefTab>('requirements')
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)

  const addRequirement = useThreatModelStore((s) => s.addRequirement)
  const updateRequirement = useThreatModelStore((s) => s.updateRequirement)
  const removeRequirement = useThreatModelStore((s) => s.removeRequirement)
  const addBusinessObjective = useThreatModelStore((s) => s.addBusinessObjective)
  const updateBusinessObjective = useThreatModelStore(
    (s) => s.updateBusinessObjective,
  )
  const removeBusinessObjective = useThreatModelStore(
    (s) => s.removeBusinessObjective,
  )
  const addUseCaseDefinition = useThreatModelStore((s) => s.addUseCaseDefinition)
  const updateUseCaseDefinition = useThreatModelStore(
    (s) => s.updateUseCaseDefinition,
  )
  const removeUseCaseDefinition = useThreatModelStore(
    (s) => s.removeUseCaseDefinition,
  )

  const requirements = bom.definitions?.requirements ?? []
  const objectives = bom.definitions?.businessObjectives ?? []
  const useCases = bom.definitions?.useCases ?? []

  return (
    <div className="stack">
      <div className="panel panel-pad btn-row">
        {(
          [
            ['requirements', 'Requirements'],
            ['objectives', 'Business objectives'],
            ['useCases', 'Use cases'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn${tab === id ? ' btn-primary' : ''}`}
            onClick={() => {
              setTab(id)
              setSelectedRef(null)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'requirements' && (
        <EntityCrudView
          title="Requirements"
          description="Reusable security/privacy requirements (definitions.requirements[])."
          items={requirements}
          selectedRef={selectedRef}
          onSelect={setSelectedRef}
          getLabel={(r) => r.name}
          getSubtitle={(r) => r.id ?? r.priority ?? ''}
          onAdd={() => addRequirement({ name: 'New requirement' })}
          onRemove={removeRequirement}
          renderInspector={(r: Requirement) => (
            <>
              <h3>Requirement</h3>
              <Field label="Name">
                <input
                  value={r.name}
                  onChange={(e) =>
                    updateRequirement(r['bom-ref'], { name: e.target.value })
                  }
                />
              </Field>
              <Field label="ID">
                <input
                  value={r.id ?? ''}
                  onChange={(e) =>
                    updateRequirement(r['bom-ref'], { id: e.target.value })
                  }
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={r.description ?? ''}
                  onChange={(e) =>
                    updateRequirement(r['bom-ref'], {
                      description: e.target.value,
                    })
                  }
                />
              </Field>
            </>
          )}
        />
      )}

      {tab === 'objectives' && (
        <EntityCrudView
          title="Business objectives"
          items={objectives}
          selectedRef={selectedRef}
          onSelect={setSelectedRef}
          getLabel={(o) => o.name}
          onAdd={() => addBusinessObjective({ name: 'New objective' })}
          onRemove={removeBusinessObjective}
          renderInspector={(o: BusinessObjective) => (
            <>
              <h3>Business objective</h3>
              <Field label="Name">
                <input
                  value={o.name}
                  onChange={(e) =>
                    updateBusinessObjective(o['bom-ref'], {
                      name: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Criticality">
                <input
                  value={o.criticality ?? ''}
                  onChange={(e) =>
                    updateBusinessObjective(o['bom-ref'], {
                      criticality: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={o.description ?? ''}
                  onChange={(e) =>
                    updateBusinessObjective(o['bom-ref'], {
                      description: e.target.value,
                    })
                  }
                />
              </Field>
            </>
          )}
        />
      )}

      {tab === 'useCases' && (
        <EntityCrudView
          title="Use cases"
          items={useCases}
          selectedRef={selectedRef}
          onSelect={setSelectedRef}
          getLabel={(u) => u.name}
          onAdd={() => addUseCaseDefinition({ name: 'New use case' })}
          onRemove={removeUseCaseDefinition}
          renderInspector={(u: UseCaseDefinition) => (
            <>
              <h3>Use case</h3>
              <Field label="Name">
                <input
                  value={u.name}
                  onChange={(e) =>
                    updateUseCaseDefinition(u['bom-ref'], {
                      name: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={u.description ?? ''}
                  onChange={(e) =>
                    updateUseCaseDefinition(u['bom-ref'], {
                      description: e.target.value,
                    })
                  }
                />
              </Field>
            </>
          )}
        />
      )}
    </div>
  )
}
