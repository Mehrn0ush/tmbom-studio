import { useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import {
  IMPACT_LEVELS,
  LIKELIHOOD_LEVELS,
  RESPONSE_STRATEGIES,
  computeRiskLevel,
  riskLevelColor,
} from '../../lib/catalog'
import { bomRef } from '../../lib/bom'
import type {
  ImpactLevel,
  LikelihoodLevel,
  RiskResponseStrategy,
  RiskStatus,
} from '../../types/cyclonedx'
import { CrossLinks, useRiskCrossLinks } from '../shared/CrossLinks'

export function RisksView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addRisk = useThreatModelStore((s) => s.addRisk)
  const updateRisk = useThreatModelStore((s) => s.updateRisk)
  const removeRisk = useThreatModelStore((s) => s.removeRisk)
  const setRiskAssessmentsForScope = useThreatModelStore(
    (s) => s.setRiskAssessmentsForScope,
  )

  const risks = bom.risks?.risks ?? []
  const threats = bom.threats?.threats ?? []
  const controls = bom.controls ?? []
  const selected = risks.find((r) => r['bom-ref'] === selectedRef)

  const [name, setName] = useState('')
  const [statement, setStatement] = useState('')

  return (
    <div className="split">
      <div className="stack">
        <div className="panel panel-pad stack">
          <div className="field">
            <label>Risk name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Short risk title"
            />
          </div>
          <div className="field">
            <label>Risk statement</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="If … then … resulting in …"
            />
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              if (!name.trim() || !statement.trim()) return
              const likelihood: LikelihoodLevel = 'medium'
              const impact: ImpactLevel = 'major'
              addRisk({
                name: name.trim(),
                statement: statement.trim(),
                inherentRisk: {
                  likelihood: { level: likelihood },
                  impact: { level: impact, polarity: 'harm' },
                  score: {
                    level: computeRiskLevel(likelihood, impact),
                    methodology: 'qualitative-matrix',
                  },
                },
              })
              setName('')
              setStatement('')
            }}
          >
            Add risk
          </button>
        </div>

        <div className="list">
          {risks.length === 0 && (
            <div className="panel empty">
              No risks yet. Risks link threats to inherent/residual ratings and
              responses (avoid, reduce, transfer, accept).
            </div>
          )}
          {risks.map((r) => {
            const level =
              r.residualRisk?.score?.level ??
              r.inherentRisk?.score?.level ??
              'info'
            return (
              <button
                key={r['bom-ref']}
                type="button"
                className={`list-item${selectedRef === r['bom-ref'] ? ' selected' : ''}`}
                onClick={() => setSelectedRef(r['bom-ref'])}
              >
                <div>
                  <h4>{r.name}</h4>
                  <p>{r.statement}</p>
                </div>
                <span
                  className="badge badge-risk"
                  style={{ background: riskLevelColor(level) }}
                >
                  {level}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <aside className="panel inspector">
        {!selected ? (
          <div className="empty">Select a risk to edit</div>
        ) : (
          <div className="stack">
            <h3>Risk</h3>
            <div className="field">
              <label>Name</label>
              <input
                value={selected.name}
                onChange={(e) =>
                  updateRisk(selected['bom-ref'], { name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Statement</label>
              <textarea
                value={selected.statement}
                onChange={(e) =>
                  updateRisk(selected['bom-ref'], {
                    statement: e.target.value,
                  })
                }
              />
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={
                  typeof selected.status === 'string' ? selected.status : ''
                }
                onChange={(e) =>
                  updateRisk(selected['bom-ref'], {
                    status: (e.target.value || undefined) as RiskStatus | undefined,
                  })
                }
              >
                <option value="">—</option>
                {[
                  'identified',
                  'assessed',
                  'mitigated',
                  'accepted',
                  'transferred',
                  'retired',
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Owner name</label>
              <input
                value={selected.owner?.name ?? ''}
                onChange={(e) =>
                  updateRisk(selected['bom-ref'], {
                    owner: {
                      ...selected.owner,
                      name: e.target.value || undefined,
                    },
                  })
                }
                placeholder="Accountable party"
              />
            </div>
            <div className="field">
              <label>Target likelihood</label>
              <select
                value={selected.targetRisk?.likelihood?.level ?? ''}
                onChange={(e) => {
                  const level = e.target.value as LikelihoodLevel
                  if (!level) {
                    updateRisk(selected['bom-ref'], { targetRisk: undefined })
                    return
                  }
                  const impact =
                    selected.targetRisk?.impact?.level ?? 'moderate'
                  updateRisk(selected['bom-ref'], {
                    targetRisk: {
                      ...selected.targetRisk,
                      likelihood: { level },
                      impact: { level: impact, polarity: 'harm' },
                      score: {
                        level: computeRiskLevel(level, impact),
                        methodology: 'qualitative-matrix',
                      },
                    },
                  })
                }}
              >
                <option value="">—</option>
                {LIKELIHOOD_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Target impact</label>
              <select
                value={selected.targetRisk?.impact?.level ?? ''}
                onChange={(e) => {
                  const level = e.target.value as ImpactLevel
                  if (!level) return
                  const likelihood =
                    selected.targetRisk?.likelihood?.level ?? 'low'
                  updateRisk(selected['bom-ref'], {
                    targetRisk: {
                      ...selected.targetRisk,
                      likelihood: { level: likelihood },
                      impact: { level, polarity: 'harm' },
                      score: {
                        level: computeRiskLevel(likelihood, level),
                        methodology: 'qualitative-matrix',
                      },
                    },
                  })
                }}
              >
                <option value="">—</option>
                {IMPACT_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Assessments (summary lines)</label>
              <textarea
                value={(bom.risks?.assessments ?? [])
                  .filter((a) => a.scope === selected['bom-ref'])
                  .map((a) => a.summary ?? a.name ?? '')
                  .filter(Boolean)
                  .join('\n')}
                onChange={(e) => {
                  const lines = e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                  setRiskAssessmentsForScope(
                    selected['bom-ref'],
                    lines,
                    selected.name,
                  )
                }}
                placeholder="Workshop conclusion…"
              />
            </div>
            <div className="field">
              <label>Related threats</label>
              <select
                multiple
                value={selected.relatedThreats ?? []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  )
                  updateRisk(selected['bom-ref'], { relatedThreats: values })
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
              <label>Inherent likelihood</label>
              <select
                value={selected.inherentRisk?.likelihood?.level ?? 'medium'}
                onChange={(e) => {
                  const level = e.target.value as LikelihoodLevel
                  const impact =
                    selected.inherentRisk?.impact?.level ?? 'major'
                  updateRisk(selected['bom-ref'], {
                    inherentRisk: {
                      ...selected.inherentRisk,
                      likelihood: { level },
                      impact: {
                        level: impact,
                        polarity: 'harm',
                      },
                      score: {
                        level: computeRiskLevel(level, impact),
                        methodology: 'qualitative-matrix',
                      },
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
              <label>Inherent impact</label>
              <select
                value={selected.inherentRisk?.impact?.level ?? 'major'}
                onChange={(e) => {
                  const level = e.target.value as ImpactLevel
                  const likelihood =
                    selected.inherentRisk?.likelihood?.level ?? 'medium'
                  updateRisk(selected['bom-ref'], {
                    inherentRisk: {
                      ...selected.inherentRisk,
                      likelihood: { level: likelihood },
                      impact: { level, polarity: 'harm' },
                      score: {
                        level: computeRiskLevel(likelihood, level),
                        methodology: 'qualitative-matrix',
                      },
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
              <label>Residual likelihood</label>
              <select
                value={selected.residualRisk?.likelihood?.level ?? ''}
                onChange={(e) => {
                  const level = e.target.value as LikelihoodLevel
                  if (!level) return
                  const impact =
                    selected.residualRisk?.impact?.level ?? 'moderate'
                  updateRisk(selected['bom-ref'], {
                    residualRisk: {
                      ...selected.residualRisk,
                      likelihood: { level },
                      impact: { level: impact, polarity: 'harm' },
                      score: {
                        level: computeRiskLevel(level, impact),
                        methodology: 'qualitative-matrix',
                      },
                    },
                  })
                }}
              >
                <option value="">—</option>
                {LIKELIHOOD_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Residual impact</label>
              <select
                value={selected.residualRisk?.impact?.level ?? ''}
                onChange={(e) => {
                  const level = e.target.value as ImpactLevel
                  if (!level) return
                  const likelihood =
                    selected.residualRisk?.likelihood?.level ?? 'medium'
                  updateRisk(selected['bom-ref'], {
                    residualRisk: {
                      ...selected.residualRisk,
                      likelihood: { level: likelihood },
                      impact: { level, polarity: 'harm' },
                      score: {
                        level: computeRiskLevel(likelihood, level),
                        methodology: 'qualitative-matrix',
                      },
                    },
                  })
                }}
              >
                <option value="">—</option>
                {IMPACT_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Add response</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const strategy = e.target.value as RiskResponseStrategy
                  if (!strategy) return
                  updateRisk(selected['bom-ref'], {
                    responses: [
                      ...(selected.responses ?? []),
                      {
                        'bom-ref': bomRef('response'),
                        strategy,
                        description: '',
                        cost: 'medium',
                      },
                    ],
                  })
                  e.target.value = ''
                }}
              >
                <option value="">Choose strategy…</option>
                {RESPONSE_STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {(selected.responses ?? []).map((resp, idx) => (
              <div
                key={resp['bom-ref']}
                className="panel panel-pad stack"
                style={{ boxShadow: 'none' }}
              >
                <strong>{resp.strategy}</strong>
                <textarea
                  value={resp.description ?? ''}
                  placeholder="Response description"
                  onChange={(e) => {
                    const responses = [...(selected.responses ?? [])]
                    responses[idx] = {
                      ...resp,
                      description: e.target.value,
                    }
                    updateRisk(selected['bom-ref'], { responses })
                  }}
                />
                <label>Linked controls</label>
                <select
                  multiple
                  value={resp.controls ?? []}
                  onChange={(e) => {
                    const responses = [...(selected.responses ?? [])]
                    responses[idx] = {
                      ...resp,
                      controls: Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      ),
                    }
                    updateRisk(selected['bom-ref'], { responses })
                  }}
                  style={{ minHeight: 70 }}
                >
                  {controls.map((c) => (
                    <option key={c['bom-ref']} value={c['bom-ref']}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => {
                    updateRisk(selected['bom-ref'], {
                      responses: (selected.responses ?? []).filter(
                        (_, i) => i !== idx,
                      ),
                    })
                  }}
                >
                  Remove response
                </button>
              </div>
            ))}
            <div className="field">
              <label>Cross-links</label>
              <RiskCrossLinksPanel riskRef={selected['bom-ref']} />
            </div>
            <p className="mono muted">{selected['bom-ref']}</p>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => removeRisk(selected['bom-ref'])}
            >
              Delete risk
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

function RiskCrossLinksPanel({ riskRef }: { riskRef: string }) {
  const links = useRiskCrossLinks(riskRef)
  return <CrossLinks links={links} />
}
