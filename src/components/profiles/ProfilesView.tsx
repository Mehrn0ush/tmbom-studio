import { useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { EntityCrudView, Field } from '../shared/EntityCrudView'
import type { DataProfile, ThreatProfile } from '../../types/cyclonedx'

type Tab = 'threat' | 'data'

export function ProfilesView() {
  const [tab, setTab] = useState<Tab>('threat')
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addThreatProfile = useThreatModelStore((s) => s.addThreatProfile)
  const updateThreatProfile = useThreatModelStore((s) => s.updateThreatProfile)
  const removeThreatProfile = useThreatModelStore((s) => s.removeThreatProfile)
  const addDataProfile = useThreatModelStore((s) => s.addDataProfile)
  const updateDataProfile = useThreatModelStore((s) => s.updateDataProfile)
  const removeDataProfile = useThreatModelStore((s) => s.removeDataProfile)

  const threatProfiles = bom.profiles?.threatProfiles ?? []
  const dataProfiles = bom.profiles?.dataProfiles ?? []

  return (
    <div className="stack">
      <div className="panel panel-pad btn-row">
        <button
          type="button"
          className={`btn${tab === 'threat' ? ' btn-primary' : ''}`}
          onClick={() => {
            setTab('threat')
            setSelectedRef(null)
          }}
        >
          Threat profiles
        </button>
        <button
          type="button"
          className={`btn${tab === 'data' ? ' btn-primary' : ''}`}
          onClick={() => {
            setTab('data')
            setSelectedRef(null)
          }}
        >
          Data profiles
        </button>
      </div>

      {tab === 'threat' && (
        <EntityCrudView
          title="Threat profiles"
          description="Reusable actor capability profiles (profiles.threatProfiles[])."
          items={threatProfiles}
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
                    updateThreatProfile(p['bom-ref'], {
                      resources: e.target.value,
                    })
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
      )}

      {tab === 'data' && (
        <EntityCrudView
          title="Data profiles"
          description="profiles.dataProfiles[] — classify data handled by the system."
          items={dataProfiles}
          selectedRef={selectedRef}
          onSelect={setSelectedRef}
          getLabel={(p) => p.name}
          getSubtitle={(p) => p.description ?? ''}
          onAdd={() => addDataProfile({ name: 'New data profile' })}
          onRemove={removeDataProfile}
          renderInspector={(p: DataProfile) => (
            <>
              <h3>Data profile</h3>
              <Field label="Name">
                <input
                  value={p.name}
                  onChange={(e) =>
                    updateDataProfile(p['bom-ref'], { name: e.target.value })
                  }
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={p.description ?? ''}
                  onChange={(e) =>
                    updateDataProfile(p['bom-ref'], {
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
