import { useThreatModelStore } from '../../store/useThreatModelStore'
import { getPrimaryBlueprint } from '../../lib/bom'
import { EntityCrudView, Field } from '../shared/EntityCrudView'
import type { Assumption } from '../../types/cyclonedx'

const TOPICS = [
  'security',
  'operational',
  'technical',
  'compliance',
  'business',
  'availability',
  'performance',
] as const

export function AssumptionsView() {
  const bom = useThreatModelStore((s) => s.bom)
  const bp = getPrimaryBlueprint(bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addAssumption = useThreatModelStore((s) => s.addAssumption)
  const updateAssumption = useThreatModelStore((s) => s.updateAssumption)
  const removeAssumption = useThreatModelStore((s) => s.removeAssumption)
  const updateBlueprintScope = useThreatModelStore((s) => s.updateBlueprintScope)

  const assumptions = bp.assumptions ?? []
  const scope = bp.scope

  return (
    <div className="stack">
      <div className="panel panel-pad stack">
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
          Blueprint scope
        </h3>
        <p className="muted" style={{ margin: 0 }}>
          Model-level in/out of scope (blueprints[].scope). Use assumptions below
          for responsibility boundaries (e.g. deployer vs producer).
        </p>
        <Field label="Scope name">
          <input
            value={scope?.name ?? ''}
            onChange={(e) => updateBlueprintScope({ name: e.target.value })}
            placeholder="Model scope"
          />
        </Field>
        <Field label="Included / excluded description">
          <textarea
            value={scope?.description ?? ''}
            onChange={(e) =>
              updateBlueprintScope({ description: e.target.value })
            }
            placeholder="What is in scope for this component vs downstream consumers…"
          />
        </Field>
      </div>

      <EntityCrudView
        title="Assumptions"
        description="Preconditions and responsibility boundaries (blueprints[].assumptions[])."
        items={assumptions.filter(
          (a): a is Assumption & { 'bom-ref': string } => Boolean(a['bom-ref']),
        )}
        selectedRef={selectedRef}
        onSelect={setSelectedRef}
        getLabel={(a) => a.description.slice(0, 80)}
        getSubtitle={(a) =>
          typeof a.topic === 'string' ? a.topic : 'assumption'
        }
        onAdd={() =>
          addAssumption({
            description:
              'Untrusted parties do not control configuration or log destinations (deployer responsibility).',
            topic: 'security',
          })
        }
        onRemove={removeAssumption}
        addLabel="Add assumption"
        renderInspector={(a) => (
          <>
            <h3>Assumption</h3>
            <Field label="Description">
              <textarea
                value={a.description}
                onChange={(e) =>
                  updateAssumption(a['bom-ref'], {
                    description: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Topic">
              <select
                value={typeof a.topic === 'string' ? a.topic : 'security'}
                onChange={(e) =>
                  updateAssumption(a['bom-ref'], {
                    topic: e.target.value as Assumption['topic'],
                  })
                }
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Validity">
              <select
                value={a.validity ?? 'unknown'}
                onChange={(e) =>
                  updateAssumption(a['bom-ref']!, {
                    validity: e.target.value as Assumption['validity'],
                  })
                }
              >
                {['unknown', 'unverified', 'verified', 'invalid'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Impact if false">
              <textarea
                value={a.impact ?? ''}
                onChange={(e) =>
                  updateAssumption(a['bom-ref']!, { impact: e.target.value })
                }
              />
            </Field>
          </>
        )}
      />
    </div>
  )
}
