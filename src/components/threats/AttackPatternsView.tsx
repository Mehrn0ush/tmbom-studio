import { useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { CAPEC_CATALOG } from '../../lib/catalog'

export function AttackPatternsView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addAttackPattern = useThreatModelStore((s) => s.addAttackPattern)
  const updateAttackPattern = useThreatModelStore((s) => s.updateAttackPattern)
  const removeAttackPattern = useThreatModelStore((s) => s.removeAttackPattern)

  const patterns = bom.threats?.attackPatterns ?? []
  const threats = bom.threats?.threats ?? []
  const selected = patterns.find((p) => p['bom-ref'] === selectedRef)

  const [capecPick, setCapecPick] = useState(String(CAPEC_CATALOG[0].capecId))
  const [customName, setCustomName] = useState('')
  const [customCapec, setCustomCapec] = useState('')

  const linkedThreats = threats.filter((t) =>
    t.attackPatterns?.includes(selected?.['bom-ref'] ?? ''),
  )

  return (
    <div className="split">
      <div className="stack">
        <div className="panel panel-pad stack">
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
            CAPEC attack patterns
          </h3>
          <p className="muted" style={{ margin: 0 }}>
            First-class CycloneDX <span className="mono">attackPatterns</span>{' '}
            with <span className="mono">capecId</span>. Techniques can carry
            MITRE ATT&amp;CK IDs. Link patterns to threats from the Threats
            inspector.
          </p>
          <div className="btn-row" style={{ alignItems: 'end' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Add from CAPEC catalog</label>
              <select
                value={capecPick}
                onChange={(e) => setCapecPick(e.target.value)}
              >
                {CAPEC_CATALOG.map((c) => (
                  <option key={c.capecId} value={c.capecId}>
                    CAPEC-{c.capecId} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                const entry = CAPEC_CATALOG.find(
                  (c) => String(c.capecId) === capecPick,
                )
                if (!entry) return
                addAttackPattern({
                  name: entry.name,
                  description: entry.description,
                  capecId: entry.capecId,
                  techniques: entry.techniques,
                })
              }}
            >
              Add CAPEC
            </button>
          </div>
          <div className="btn-row" style={{ alignItems: 'end' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Custom pattern name</label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Pattern name"
              />
            </div>
            <div className="field">
              <label>CAPEC ID</label>
              <input
                value={customCapec}
                onChange={(e) => setCustomCapec(e.target.value)}
                placeholder="e.g. 242"
                inputMode="numeric"
              />
            </div>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!customName.trim()) return
                const id = Number(customCapec)
                addAttackPattern({
                  name: customName.trim(),
                  capecId: Number.isFinite(id) && id >= 1 ? id : undefined,
                })
                setCustomName('')
                setCustomCapec('')
              }}
            >
              Add custom
            </button>
          </div>
        </div>

        <div className="list">
          {patterns.length === 0 && (
            <div className="panel empty">
              No attack patterns yet. Add a CAPEC entry to build a reusable
              library.
            </div>
          )}
          {patterns.map((p) => (
            <button
              key={p['bom-ref']}
              type="button"
              className={`list-item${selectedRef === p['bom-ref'] ? ' selected' : ''}`}
              onClick={() => setSelectedRef(p['bom-ref'])}
            >
              <div>
                <h4>
                  {p.capecId != null ? `CAPEC-${p.capecId}: ` : ''}
                  {p.name}
                </h4>
                <p>{p.description || 'No description'}</p>
              </div>
              <span className="badge">
                {(p.techniques ?? []).length} ATT&amp;CK
              </span>
            </button>
          ))}
        </div>
      </div>

      <aside className="panel inspector">
        {!selected ? (
          <div className="empty">Select an attack pattern</div>
        ) : (
          <div className="stack">
            <h3>Attack pattern</h3>
            <div className="field">
              <label>Name</label>
              <input
                value={selected.name}
                onChange={(e) =>
                  updateAttackPattern(selected['bom-ref'], {
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="field">
              <label>CAPEC ID</label>
              <input
                value={selected.capecId ?? ''}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  updateAttackPattern(selected['bom-ref'], {
                    capecId:
                      e.target.value.trim() && Number.isFinite(n) && n >= 1
                        ? n
                        : undefined,
                  })
                }}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                value={selected.description ?? ''}
                onChange={(e) =>
                  updateAttackPattern(selected['bom-ref'], {
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="field">
              <label>ATT&amp;CK techniques (id | name | tactic)</label>
              <textarea
                value={(selected.techniques ?? [])
                  .map(
                    (t) =>
                      `${t.id ?? ''}|${t.name ?? ''}|${t.tactic ?? ''}`,
                  )
                  .join('\n')}
                onChange={(e) => {
                  const techniques = e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [id, name, tactic] = line.split('|').map((s) => s.trim())
                      return { id, name, tactic }
                    })
                  updateAttackPattern(selected['bom-ref'], { techniques })
                }}
                placeholder={'T1078|Valid Accounts|initial-access'}
              />
            </div>
            <div>
              <strong>Linked threats</strong>
              <p className="muted" style={{ marginTop: 4 }}>
                {linkedThreats.length === 0
                  ? 'None yet — link from Threats inspector.'
                  : linkedThreats.map((t) => t.name).join(', ')}
              </p>
            </div>
            {selected.capecId != null && (
              <p className="muted">
                Spec:{' '}
                <a
                  href={`https://capec.mitre.org/data/definitions/${selected.capecId}.html`}
                  target="_blank"
                  rel="noreferrer"
                >
                  CAPEC-{selected.capecId}
                </a>
              </p>
            )}
            <p className="mono muted">{selected['bom-ref']}</p>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => removeAttackPattern(selected['bom-ref'])}
            >
              Delete pattern
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
