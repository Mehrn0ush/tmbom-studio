import { useThreatModelStore } from '../../store/useThreatModelStore'
import { EntityCrudView, Field } from '../shared/EntityCrudView'
import type { ThreatProfile } from '../../types/cyclonedx'

export function ProfilesView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addThreatProfile = useThreatModelStore((s) => s.addThreatProfile)
  const updateThreatProfile = useThreatModelStore((s) => s.updateThreatProfile)
  const removeThreatProfile = useThreatModelStore((s) => s.removeThreatProfile)

  const profiles = bom.profiles?.threatProfiles ?? []

  return (
    <EntityCrudView
      title="Threat profiles"
      description="Reusable actor capability profiles (profiles.threatProfiles[]), linkable from scenarios."
      items={profiles}
      selectedRef={selectedRef}
      onSelect={setSelectedRef}
      getLabel={(p) => p.name ?? p['bom-ref']}
      getSubtitle={(p) =>
        [p.sophistication, p.resources].filter(Boolean).join(' · ')
      }
      onAdd={() => addThreatProfile({ name: 'New threat profile' })}
      onRemove={removeThreatProfile}
      renderInspector={(p: ThreatProfile) => (
        <>
          <h3>Threat profile</h3>
          <Field label="Name">
            <input
              value={p.name ?? ''}
              onChange={(e) =>
                updateThreatProfile(p['bom-ref'], { name: e.target.value })
              }
            />
          </Field>
          <Field label="Sophistication">
            <input
              value={p.sophistication ?? ''}
              onChange={(e) =>
                updateThreatProfile(p['bom-ref'], {
                  sophistication: e.target.value,
                })
              }
            />
          </Field>
          <Field label="Resources">
            <input
              value={p.resources ?? ''}
              onChange={(e) =>
                updateThreatProfile(p['bom-ref'], { resources: e.target.value })
              }
            />
          </Field>
          <Field label="Skill set (one per line)">
            <textarea
              value={(p.skillSet ?? []).join('\n')}
              onChange={(e) =>
                updateThreatProfile(p['bom-ref'], {
                  skillSet: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </>
      )}
    />
  )
}
