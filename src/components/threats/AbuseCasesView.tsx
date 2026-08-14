import { useThreatModelStore } from '../../store/useThreatModelStore'
import { EntityCrudView, Field, RefMultiSelect } from '../shared/EntityCrudView'
import type { AbuseCase } from '../../types/cyclonedx'

export function AbuseCasesView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addAbuseCase = useThreatModelStore((s) => s.addAbuseCase)
  const updateAbuseCase = useThreatModelStore((s) => s.updateAbuseCase)
  const removeAbuseCase = useThreatModelStore((s) => s.removeAbuseCase)

  const cases = bom.threats?.abuseCases ?? []
  const threats = bom.threats?.threats ?? []

  return (
    <EntityCrudView
      title="Abuse cases"
      description="Illustrative misuse flows (threats.abuseCases[])."
      items={cases}
      selectedRef={selectedRef}
      onSelect={setSelectedRef}
      getLabel={(c) => c.name}
      onAdd={() => addAbuseCase({ name: 'New abuse case' })}
      onRemove={removeAbuseCase}
      renderInspector={(c: AbuseCase) => (
        <>
          <h3>Abuse case</h3>
          <Field label="Name">
            <input
              value={c.name}
              onChange={(e) =>
                updateAbuseCase(c['bom-ref'], { name: e.target.value })
              }
            />
          </Field>
          <Field label="Description">
            <textarea
              value={c.description ?? ''}
              onChange={(e) =>
                updateAbuseCase(c['bom-ref'], { description: e.target.value })
              }
            />
          </Field>
          <RefMultiSelect
            label="Realizes threats"
            options={threats.map((t) => ({
              ref: t['bom-ref'],
              label: t.name,
            }))}
            value={c.realizes ?? []}
            onChange={(values) =>
              updateAbuseCase(c['bom-ref'], { realizes: values })
            }
          />
          <Field label="Main flow (one step per line)">
            <textarea
              value={(c.mainFlow ?? []).map((s) => s.description).join('\n')}
              onChange={(e) =>
                updateAbuseCase(c['bom-ref'], {
                  mainFlow: e.target.value
                    .split('\n')
                    .map((line, i) => ({ number: i + 1, description: line.trim() }))
                    .filter((s) => s.description),
                })
              }
            />
          </Field>
        </>
      )}
    />
  )
}
