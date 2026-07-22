import { useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import {
  IMPACT_LEVELS,
  LIKELIHOOD_LEVELS,
  computeRiskLevel,
  riskLevelColor,
} from '../../lib/catalog'
import { getPrimaryBlueprint } from '../../lib/bom'
import type {
  AccessLevel,
  ImpactLevel,
  Intent,
  LikelihoodLevel,
} from '../../types/cyclonedx'

export function ScenariosView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addScenario = useThreatModelStore((s) => s.addScenario)
  const updateScenario = useThreatModelStore((s) => s.updateScenario)
  const removeScenario = useThreatModelStore((s) => s.removeScenario)

  const scenarios = bom.threats?.scenarios ?? []
  const threats = bom.threats?.threats ?? []
  const assets = getPrimaryBlueprint(bom).assets ?? []
  const selected = scenarios.find((s) => s['bom-ref'] === selectedRef)

  const [name, setName] = useState('')
  const [threatRef, setThreatRef] = useState(threats[0]?.['bom-ref'] ?? '')

  return (
    <div className="split">
      <div className="stack">
        <div className="panel panel-pad btn-row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Scenario name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How the threat is realized"
            />
          </div>
          <div className="field">
            <label>Primary threat</label>
            <select
              value={threatRef}
              onChange={(e) => setThreatRef(e.target.value)}
            >
              {threats.map((t) => (
                <option key={t['bom-ref']} value={t['bom-ref']}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!threats.length}
            onClick={() => {
              if (!name.trim() || !threatRef) return
              const likelihood: LikelihoodLevel = 'medium'
              const impact: ImpactLevel = 'moderate'
              addScenario({
                name: name.trim(),
                threats: [threatRef],
                intent: 'targeted',
                accessLevel: 'external',
                likelihood: { level: likelihood },
                impact: { level: impact, polarity: 'harm' },
                riskScore: {
                  level: computeRiskLevel(likelihood, impact),
                  methodology: 'qualitative-matrix',
                },
              })
              setName('')
            }}
          >
            Add scenario
          </button>
        </div>

        <div className="list">
          {scenarios.length === 0 && (
            <div className="panel empty">
              No scenarios yet. Scenarios realize one or more threats with actor
              context, likelihood, and impact (CycloneDX threatScenario).
            </div>
          )}
          {scenarios.map((sc) => (
            <button
              key={sc['bom-ref']}
              type="button"
              className={`list-item${selectedRef === sc['bom-ref'] ? ' selected' : ''}`}
              onClick={() => setSelectedRef(sc['bom-ref'])}
            >
              <div>
                <h4>{sc.name}</h4>
                <p>{sc.description || 'No description'}</p>
              </div>
              {sc.riskScore?.level && (
                <span
                  className="badge badge-risk"
                  style={{ background: riskLevelColor(sc.riskScore.level) }}
                >
                  {sc.riskScore.level}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <aside className="panel inspector">
        {!selected ? (
          <div className="empty">Select a scenario to edit</div>
        ) : (
          <div className="stack">
            <h3>Scenario</h3>
            <div className="field">
              <label>Name</label>
              <input
                value={selected.name}
                onChange={(e) =>
                  updateScenario(selected['bom-ref'], { name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                value={selected.description ?? ''}
                onChange={(e) =>
                  updateScenario(selected['bom-ref'], {
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="field">
              <label>Threats</label>
              <select
                multiple
                value={selected.threats}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  )
                  updateScenario(selected['bom-ref'], { threats: values })
                }}
                style={{ minHeight: 90 }}
              >
                {threats.map((t) => (
                  <option key={t['bom-ref']} value={t['bom-ref']}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Intent</label>
              <select
                value={selected.intent ?? 'targeted'}
                onChange={(e) =>
                  updateScenario(selected['bom-ref'], {
                    intent: e.target.value as Intent,
                  })
                }
              >
                {(
                  [
                    'accidental',
                    'opportunistic',
                    'targeted',
                    'persistent',
                  ] as Intent[]
                ).map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Access level</label>
              <select
                value={selected.accessLevel ?? 'external'}
                onChange={(e) =>
                  updateScenario(selected['bom-ref'], {
                    accessLevel: e.target.value as AccessLevel,
                  })
                }
              >
                {(
                  [
                    'none',
                    'external',
                    'internal',
                    'privileged',
                    'physical',
                  ] as AccessLevel[]
                ).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Likelihood</label>
              <select
                value={selected.likelihood?.level ?? 'medium'}
                onChange={(e) => {
                  const level = e.target.value as LikelihoodLevel
                  const impact = selected.impact?.level ?? 'moderate'
                  updateScenario(selected['bom-ref'], {
                    likelihood: { level },
                    riskScore: {
                      level: computeRiskLevel(level, impact),
                      methodology: 'qualitative-matrix',
                    },
                  })
                }}
              >
                {LIKELIHOOD_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Impact</label>
              <select
                value={selected.impact?.level ?? 'moderate'}
                onChange={(e) => {
                  const level = e.target.value as ImpactLevel
                  const likelihood = selected.likelihood?.level ?? 'medium'
                  updateScenario(selected['bom-ref'], {
                    impact: { level, polarity: 'harm' },
                    riskScore: {
                      level: computeRiskLevel(likelihood, level),
                      methodology: 'qualitative-matrix',
                    },
                  })
                }}
              >
                {IMPACT_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Affected assets</label>
              <select
                multiple
                value={selected.affectedAssets ?? []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  )
                  updateScenario(selected['bom-ref'], {
                    affectedAssets: values,
                  })
                }}
                style={{ minHeight: 90 }}
              >
                {assets.map((a) => (
                  <option key={a['bom-ref']} value={a['bom-ref']}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="mono muted">{selected['bom-ref']}</p>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => removeScenario(selected['bom-ref'])}
            >
              Delete scenario
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
