import { useMemo, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import {
  CAPEC_META,
  filterCapecCatalog,
  type CapecCatalogView,
} from '../../lib/capecCatalog'

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

  const [view, setView] = useState<CapecCatalogView>('owasp')
  const [query, setQuery] = useState('')
  const [capecPick, setCapecPick] = useState('')
  const [customName, setCustomName] = useState('')
  const [customCapec, setCustomCapec] = useState('')

  const filtered = useMemo(
    () => filterCapecCatalog(view, query),
    [view, query],
  )

  const pick =
    filtered.find((c) => String(c.capecId) === capecPick) ?? filtered[0]

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
            Catalog from{' '}
            <a
              href={CAPEC_META.source}
              target="_blank"
              rel="noreferrer"
            >
              CAPEC List {CAPEC_META.version}
            </a>{' '}
            ({CAPEC_META.count} patterns). Default view is OWASP Related
            Patterns (View 659, {CAPEC_META.owaspRelatedCount} entries). Full
            dictionary is View 2000; Mechanisms (1000) / Domains (3000) CSVs are
            vendored under <span className="mono">data/capec/</span>.
          </p>
          <div className="btn-row" style={{ alignItems: 'end' }}>
            <div className="field">
              <label>CAPEC view</label>
              <select
                value={view}
                onChange={(e) => {
                  setView(e.target.value as CapecCatalogView)
                  setCapecPick('')
                }}
              >
                <option value="owasp">
                  OWASP Related (View 659)
                </option>
                <option value="all">
                  Full dictionary (View 2000)
                </option>
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Search</label>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setCapecPick('')
                }}
                placeholder="ID, name, or description"
              />
            </div>
          </div>
          <div className="btn-row" style={{ alignItems: 'end' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>
                Add from catalog ({filtered.length} shown)
              </label>
              <select
                value={pick ? String(pick.capecId) : ''}
                onChange={(e) => setCapecPick(e.target.value)}
                disabled={filtered.length === 0}
              >
                {filtered.length === 0 && (
                  <option value="">No matches</option>
                )}
                {filtered.map((c) => (
                  <option key={c.capecId} value={c.capecId}>
                    CAPEC-{c.capecId} — {c.name}
                    {c.owaspRelated ? ' · OWASP' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!pick}
              onClick={() => {
                if (!pick) return
                addAttackPattern({
                  name: pick.name,
                  description: pick.description,
                  capecId: pick.capecId,
                  techniques: pick.techniques,
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
                      const [id, name, tactic] = line
                        .split('|')
                        .map((s) => s.trim())
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
