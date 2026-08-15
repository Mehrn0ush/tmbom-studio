import { useMemo, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import {
  CAPEC_META,
  filterCapecCatalog,
  getCapecChildren,
  getCapecEntry,
  getCapecHierarchyRoots,
  getCapecParents,
  getCapecRelated,
  type CapecCatalogEntry,
  type CapecCatalogView,
} from '../../lib/capecCatalog'
import {
  CrossLinks,
  useAttackPatternCrossLinks,
} from '../shared/CrossLinks'

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
  const [browseId, setBrowseId] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())

  const filtered = useMemo(
    () => filterCapecCatalog(view === 'hierarchy' ? 'all' : view, query),
    [view, query],
  )

  const pick =
    filtered.find((c) => String(c.capecId) === capecPick) ?? filtered[0]

  const linkedThreats = threats.filter((t) =>
    t.attackPatterns?.includes(selected?.['bom-ref'] ?? ''),
  )

  const roots = useMemo(() => getCapecHierarchyRoots(), [])
  const browsing = browseId != null ? getCapecEntry(browseId) : null

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addFromCatalog = (entry: CapecCatalogEntry) => {
    addAttackPattern({
      name: entry.name,
      description: entry.description,
      capecId: entry.capecId,
      techniques: entry.techniques,
    })
  }

  return (
    <div className="split">
      <div className="stack">
        <div className="panel panel-pad stack">
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
            CAPEC attack patterns
          </h3>
          <p className="muted" style={{ margin: 0 }}>
            Catalog from{' '}
            <a href={CAPEC_META.source} target="_blank" rel="noreferrer">
              CAPEC List {CAPEC_META.version}
            </a>{' '}
            ({CAPEC_META.count} patterns). Hierarchy uses Related Attack Patterns
            (ChildOf) shared by Views 1000 / 3000 / 2000 in CAPEC 3.9 CSVs.
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
                <option value="owasp">OWASP Related (View 659)</option>
                <option value="all">Full dictionary (View 2000)</option>
                <option value="hierarchy">
                  Hierarchy browser (1000 / 3000)
                </option>
              </select>
            </div>
            {view !== 'hierarchy' && (
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
            )}
          </div>

          {view === 'hierarchy' ? (
            <div className="stack">
              <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                Expand Meta/Category roots, then add a pattern to the model.
              </p>
              <div className="capec-tree">
                {roots.map((r) => (
                  <CapecTreeNode
                    key={r.capecId}
                    entry={r}
                    depth={0}
                    expanded={expanded}
                    onToggle={toggleExpand}
                    onBrowse={setBrowseId}
                    onAdd={addFromCatalog}
                    activeId={browseId}
                  />
                ))}
              </div>
              {browsing && (
                <div className="panel panel-pad stack" style={{ marginTop: 8 }}>
                  <strong>
                    CAPEC-{browsing.capecId}: {browsing.name}
                  </strong>
                  <p className="muted" style={{ margin: 0 }}>
                    {browsing.description}
                  </p>
                  <p className="mono muted" style={{ margin: 0 }}>
                    {browsing.abstraction || '—'} · severity{' '}
                    {browsing.severity || '—'}
                  </p>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    Parents:{' '}
                    {getCapecParents(browsing.capecId)
                      .map((p) => `CAPEC-${p.capecId}`)
                      .join(', ') || '—'}
                  </div>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    Related:{' '}
                    {getCapecRelated(browsing.capecId)
                      .map((e) => `${e.nature}→${e.capecId}`)
                      .join(', ') || '—'}
                  </div>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => addFromCatalog(browsing)}
                  >
                    Add CAPEC-{browsing.capecId}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="btn-row" style={{ alignItems: 'end' }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Add from catalog ({filtered.length} shown)</label>
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
                  onClick={() => pick && addFromCatalog(pick)}
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
                      capecId:
                        Number.isFinite(id) && id >= 1 ? id : undefined,
                    })
                    setCustomName('')
                    setCustomCapec('')
                  }}
                >
                  Add custom
                </button>
              </div>
            </>
          )}
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
            {selected.capecId != null && (
              <div className="stack" style={{ gap: 4 }}>
                <strong>Hierarchy</strong>
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Parents:{' '}
                  {getCapecParents(selected.capecId)
                    .map((p) => `CAPEC-${p.capecId}`)
                    .join(', ') || '—'}
                </p>
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Children:{' '}
                  {getCapecChildren(selected.capecId)
                    .slice(0, 12)
                    .map((c) => `CAPEC-${c.capecId}`)
                    .join(', ') || '—'}
                  {getCapecChildren(selected.capecId).length > 12 ? '…' : ''}
                </p>
              </div>
            )}
            <div>
              <strong>Linked threats</strong>
              <p className="muted" style={{ marginTop: 4 }}>
                {linkedThreats.length === 0
                  ? 'None yet — link from Threats inspector or use cross-links.'
                  : linkedThreats.map((t) => t.name).join(', ')}
              </p>
            </div>
            <div className="field">
              <label>Cross-links</label>
              <PatternCrossLinksPanel patternRef={selected['bom-ref']} />
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

function CapecTreeNode({
  entry,
  depth,
  expanded,
  onToggle,
  onBrowse,
  onAdd,
  activeId,
}: {
  entry: CapecCatalogEntry
  depth: number
  expanded: Set<number>
  onToggle: (id: number) => void
  onBrowse: (id: number) => void
  onAdd: (e: CapecCatalogEntry) => void
  activeId: number | null
}) {
  const children = getCapecChildren(entry.capecId)
  const open = expanded.has(entry.capecId)
  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div className="capec-tree-row">
        {children.length > 0 ? (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.15rem 0.4rem', minWidth: '1.75rem' }}
            onClick={() => onToggle(entry.capecId)}
            aria-expanded={open}
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span style={{ width: '1.75rem', display: 'inline-block' }} />
        )}
        <button
          type="button"
          className={`btn${activeId === entry.capecId ? ' btn-primary' : ''}`}
          style={{ flex: 1, textAlign: 'left', fontSize: '0.82rem' }}
          onClick={() => onBrowse(entry.capecId)}
        >
          CAPEC-{entry.capecId} · {entry.name}
          {entry.abstraction ? ` (${entry.abstraction})` : ''}
        </button>
        <button
          type="button"
          className="btn"
          style={{ fontSize: '0.75rem' }}
          onClick={() => onAdd(entry)}
        >
          Add
        </button>
      </div>
      {open &&
        children.map((c) => (
          <CapecTreeNode
            key={c.capecId}
            entry={c}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onBrowse={onBrowse}
            onAdd={onAdd}
            activeId={activeId}
          />
        ))}
    </div>
  )
}

function PatternCrossLinksPanel({ patternRef }: { patternRef: string }) {
  const links = useAttackPatternCrossLinks(patternRef)
  return <CrossLinks links={links} />
}
