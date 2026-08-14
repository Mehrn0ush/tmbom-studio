import { useThreatModelStore } from '../../store/useThreatModelStore'
import { EntityCrudView, Field } from '../shared/EntityCrudView'
import type { Component } from '../../types/cyclonedx'

export function ComponentsView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addComponent = useThreatModelStore((s) => s.addComponent)
  const updateComponent = useThreatModelStore((s) => s.updateComponent)
  const removeComponent = useThreatModelStore((s) => s.removeComponent)

  const components = bom.components ?? []

  return (
    <EntityCrudView
      title="Components (SBOM inventory)"
      description="CycloneDX components[] — link blueprint assets via componentRef."
      items={components.filter((c): c is Component & { 'bom-ref': string } =>
        Boolean(c['bom-ref']),
      )}
      selectedRef={selectedRef}
      onSelect={setSelectedRef}
      getLabel={(c) => `${c.name ?? 'component'}@${c.version ?? '?'}`}
      getSubtitle={(c) => `${c.type ?? 'library'} · ${c.scope ?? 'required'}`}
      onAdd={() =>
        addComponent({ name: 'new-component', version: '0.0.0', type: 'library' })
      }
      onRemove={removeComponent}
      renderInspector={(c: Component) => (
        <>
          <h3>Component</h3>
          <Field label="Name">
            <input
              value={c.name ?? ''}
              onChange={(e) =>
                updateComponent(c['bom-ref']!, { name: e.target.value })
              }
            />
          </Field>
          <Field label="Version">
            <input
              value={c.version ?? ''}
              onChange={(e) =>
                updateComponent(c['bom-ref']!, { version: e.target.value })
              }
            />
          </Field>
          <Field label="Type">
            <input
              value={c.type ?? ''}
              onChange={(e) =>
                updateComponent(c['bom-ref']!, { type: e.target.value })
              }
            />
          </Field>
          <Field label="Scope">
            <select
              value={c.scope ?? 'required'}
              onChange={(e) =>
                updateComponent(c['bom-ref']!, {
                  scope: e.target.value as Component['scope'],
                })
              }
            >
              <option value="required">required</option>
              <option value="optional">optional</option>
              <option value="excluded">excluded</option>
            </select>
          </Field>
          <Field label="External to assembly">
            <label>
              <input
                type="checkbox"
                checked={Boolean(c.isExternal)}
                onChange={(e) =>
                  updateComponent(c['bom-ref']!, {
                    isExternal: e.target.checked,
                  })
                }
              />{' '}
              isExternal
            </label>
          </Field>
        </>
      )}
    />
  )
}
