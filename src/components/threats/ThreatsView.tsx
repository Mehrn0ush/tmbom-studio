import { useMemo, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import {
  LINDDUN_CATEGORIES,
  MITRE_ATTACK_CATEGORIES,
  STRIDE_CATEGORIES,
} from '../../lib/catalog'
import { getPrimaryBlueprint } from '../../lib/bom'
import type { Methodology, Threat, ThreatTaxonomy } from '../../types/cyclonedx'
import {
  readThreatInScope,
  writeThreatInScope,
} from '../../types/cyclonedx'
import { CrossLinks, useThreatCrossLinks } from '../shared/CrossLinks'
import { bomRef } from '../../lib/bom'

function categoriesFor(taxonomy: ThreatTaxonomy) {
  if (taxonomy === 'LINDDUN') return LINDDUN_CATEGORIES
  if (taxonomy === 'MITRE-ATTACK') return MITRE_ATTACK_CATEGORIES
  return STRIDE_CATEGORIES
}

function defaultCategory(taxonomy: ThreatTaxonomy): string {
  if (taxonomy === 'LINDDUN') return 'linkability'
  if (taxonomy === 'MITRE-ATTACK') return 'initial-access'
  return 'spoofing'
}

export function ThreatsView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addThreat = useThreatModelStore((s) => s.addThreat)
  const updateThreat = useThreatModelStore((s) => s.updateThreat)
  const removeThreat = useThreatModelStore((s) => s.removeThreat)
  const setMethodologies = useThreatModelStore((s) => s.setMethodologies)

  const threats = bom.threats?.threats ?? []
  const assets = getPrimaryBlueprint(bom).assets ?? []
  const trees = bom.threats?.attackTrees ?? []
  const patterns = bom.threats?.attackPatterns ?? []
  const controls = bom.controls ?? []
  const selected = threats.find((t) => t['bom-ref'] === selectedRef)
  const selectedInScope = selected
    ? readThreatInScope(selected.properties)
    : undefined

  const [taxonomy, setTaxonomy] = useState<ThreatTaxonomy>('STRIDE')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('spoofing')

  const categories = categoriesFor(taxonomy)

  const byCategory = useMemo(() => {
    const map: Record<string, Threat[]> = Object.fromEntries(
      categories.map((c) => [c.id, [] as Threat[]]),
    )
    for (const t of threats) {
      const cats =
        t.categories
          ?.filter((c) => c.taxonomy === taxonomy)
          .map((c) => c.category) ?? []
      for (const c of cats) map[c]?.push(t)
    }
    return map
  }, [threats, taxonomy, categories])

  const ensureMethodology = (value: Methodology) => {
    const current = bom.threats?.methodologies ?? []
    const names = current.map((m) => (typeof m === 'string' ? m : m.name))
    const label = typeof value === 'string' ? value : value.name
    if (!names.includes(label)) {
      setMethodologies([...current, value])
    }
  }

  return (
    <div className="stack">
      <div className="panel panel-pad">
        <div className="btn-row" style={{ alignItems: 'end' }}>
          <div className="field">
            <label>Taxonomy</label>
            <select
              value={taxonomy}
              onChange={(e) => {
                const next = e.target.value as ThreatTaxonomy
                setTaxonomy(next)
                setCategory(defaultCategory(next))
              }}
            >
              <option value="STRIDE">STRIDE (security)</option>
              <option value="LINDDUN">LINDDUN (privacy)</option>
              <option value="MITRE-ATTACK">MITRE ATT&amp;CK (tactics)</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Threat name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                taxonomy === 'MITRE-ATTACK'
                  ? 'e.g. Valid account reuse for API access'
                  : taxonomy === 'LINDDUN'
                    ? 'e.g. Cross-service identity correlation'
                    : 'e.g. Credential stuffing against login'
              }
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.letter} — {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              if (!name.trim()) return
              if (taxonomy === 'STRIDE' || taxonomy === 'LINDDUN') {
                ensureMethodology(taxonomy)
              }
              addThreat({
                name: name.trim(),
                categories: [{ taxonomy, category }],
                description: categories.find((c) => c.id === category)
                  ?.description,
              })
              setName('')
            }}
          >
            Add threat
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {categories.map((c) => (
          <div key={c.id} className="panel panel-pad">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-stride">{c.letter}</span>
              <strong>{c.label}</strong>
              <span className="muted" style={{ marginLeft: 'auto' }}>
                {byCategory[c.id]?.length ?? 0}
              </span>
            </div>
            <p className="muted" style={{ fontSize: '0.8rem' }}>
              {c.description}
            </p>
            <div className="list">
              {(byCategory[c.id] ?? []).map((t) => (
                <button
                  key={t['bom-ref']}
                  type="button"
                  className={`list-item${selectedRef === t['bom-ref'] ? ' selected' : ''}`}
                  onClick={() => setSelectedRef(t['bom-ref'])}
                >
                  <div>
                    <h4>
                      {readThreatInScope(t.properties) === false
                        ? '⌀ '
                        : ''}
                      {t.name}
                    </h4>
                    <p>{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="panel panel-pad stack">
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
            Edit threat
          </h3>
          <div className="field">
            <label>Name</label>
            <input
              value={selected.name}
              onChange={(e) =>
                updateThreat(selected['bom-ref'], { name: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              value={selected.description ?? ''}
              onChange={(e) =>
                updateThreat(selected['bom-ref'], {
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="field">
            <label>Source</label>
            <input
              value={selected.source ?? ''}
              onChange={(e) =>
                updateThreat(selected['bom-ref'], { source: e.target.value })
              }
              placeholder="Workshop, security doc, reporter ticket…"
            />
          </div>
          <div className="field">
            <label>Origin (NIST SP 800-30)</label>
            <select
              value={
                typeof selected.origin === 'string' ? selected.origin : ''
              }
              onChange={(e) =>
                updateThreat(selected['bom-ref'], {
                  origin: e.target.value
                    ? (e.target.value as Threat['origin'])
                    : undefined,
                })
              }
            >
              <option value="">—</option>
              <option value="adversarial">adversarial</option>
              <option value="accidental">accidental</option>
              <option value="structural">structural</option>
              <option value="environmental">environmental</option>
            </select>
          </div>
          <div className="field">
            <label>In scope for this component</label>
            <select
              value={
                selectedInScope === undefined
                  ? ''
                  : selectedInScope
                    ? 'true'
                    : 'false'
              }
              onChange={(e) => {
                const v = e.target.value
                updateThreat(selected['bom-ref'], {
                  properties: writeThreatInScope(
                    selected.properties,
                    v === '' ? undefined : v === 'true',
                  ),
                })
              }}
            >
              <option value="">unspecified</option>
              <option value="true">in scope (producer responsibility)</option>
              <option value="false">
                out of scope (documented exclusion)
              </option>
            </select>
            <p className="muted" style={{ marginTop: 4 }}>
              Stored as <span className="mono">cyclonedx:in-scope</span> in
              threat properties (interoperable with ASF{' '}
              <span className="mono">asf:in-scope</span>).
            </p>
          </div>
          <div className="field">
            <label>Primary taxonomy category</label>
            <select
              value={
                selected.categories?.[0]
                  ? `${selected.categories[0].taxonomy}:${selected.categories[0].category}`
                  : 'STRIDE:spoofing'
              }
              onChange={(e) => {
                const [tax, cat] = e.target.value.split(':')
                updateThreat(selected['bom-ref'], {
                  categories: [
                    {
                      taxonomy: tax as ThreatTaxonomy,
                      category: cat,
                    },
                  ],
                })
              }}
            >
              <optgroup label="STRIDE">
                {STRIDE_CATEGORIES.map((c) => (
                  <option key={c.id} value={`STRIDE:${c.id}`}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="LINDDUN">
                {LINDDUN_CATEGORIES.map((c) => (
                  <option key={c.id} value={`LINDDUN:${c.id}`}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="MITRE ATT&CK">
                {MITRE_ATTACK_CATEGORIES.map((c) => (
                  <option key={c.id} value={`MITRE-ATTACK:${c.id}`}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="field">
            <label>Kill chain phase</label>
            <input
              value={selected.killChainPhase ?? ''}
              onChange={(e) =>
                updateThreat(selected['bom-ref'], {
                  killChainPhase: e.target.value || undefined,
                })
              }
              placeholder="e.g. exploitation, installation, C2"
            />
          </div>
          <div className="field">
            <label>Weaknesses / CWE (one per line: optionalId|name)</label>
            <textarea
              value={(selected.weaknesses ?? [])
                .map((w) =>
                  w.cweId != null
                    ? `${w.cweId}|${w.name ?? ''}`
                    : (w.name ?? ''),
                )
                .join('\n')}
              onChange={(e) => {
                const weaknesses = e.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [a, b] = line.split('|').map((s) => s.trim())
                    const idNum = Number(a)
                    if (b !== undefined && Number.isFinite(idNum)) {
                      return {
                        'bom-ref': bomRef('weakness'),
                        cweId: idNum,
                        name: b || `CWE-${idNum}`,
                      }
                    }
                    return {
                      'bom-ref': bomRef('weakness'),
                      name: a,
                    }
                  })
                updateThreat(selected['bom-ref'], {
                  weaknesses: weaknesses.length ? weaknesses : undefined,
                })
              }}
              placeholder={'79|XSS\n89|SQL Injection'}
            />
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
                updateThreat(selected['bom-ref'], { affectedAssets: values })
              }}
              style={{ minHeight: 100 }}
            >
              {assets.map((a) => (
                <option key={a['bom-ref']} value={a['bom-ref']}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>CAPEC attack patterns</label>
            <select
              multiple
              value={selected.attackPatterns ?? []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map(
                  (o) => o.value,
                )
                updateThreat(selected['bom-ref'], { attackPatterns: values })
              }}
              style={{ minHeight: 90 }}
            >
              {patterns.map((p) => (
                <option key={p['bom-ref']} value={p['bom-ref']}>
                  {p.capecId != null ? `CAPEC-${p.capecId}: ` : ''}
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Mitigating controls</label>
            <select
              multiple
              value={selected.mitigations ?? []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map(
                  (o) => o.value,
                )
                updateThreat(selected['bom-ref'], { mitigations: values })
              }}
              style={{ minHeight: 80 }}
            >
              {controls.map((c) => (
                <option key={c['bom-ref']} value={c['bom-ref']}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Linked attack trees</label>
            <select
              multiple
              value={selected.attackTrees ?? []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map(
                  (o) => o.value,
                )
                updateThreat(selected['bom-ref'], { attackTrees: values })
              }}
              style={{ minHeight: 80 }}
            >
              {trees.map((t) => (
                <option key={t['bom-ref']} value={t['bom-ref']}>
                  {t.name ?? t['bom-ref']}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cross-links</label>
            <ThreatCrossLinksPanel threatRef={selected['bom-ref']} />
          </div>
          <p className="mono muted">{selected['bom-ref']}</p>
          <button
            className="btn btn-danger"
            type="button"
            onClick={() => removeThreat(selected['bom-ref'])}
          >
            Delete threat
          </button>
        </div>
      )}
    </div>
  )
}

function ThreatCrossLinksPanel({ threatRef }: { threatRef: string }) {
  const links = useThreatCrossLinks(threatRef)
  return <CrossLinks links={links} />
}
