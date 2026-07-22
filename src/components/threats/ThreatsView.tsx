import { useMemo, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { STRIDE_CATEGORIES } from '../../lib/catalog'
import { getPrimaryBlueprint } from '../../lib/bom'
import type { StrideCategory, Threat } from '../../types/cyclonedx'

export function ThreatsView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addThreat = useThreatModelStore((s) => s.addThreat)
  const updateThreat = useThreatModelStore((s) => s.updateThreat)
  const removeThreat = useThreatModelStore((s) => s.removeThreat)

  const threats = bom.threats?.threats ?? []
  const assets = getPrimaryBlueprint(bom).assets ?? []
  const selected = threats.find((t) => t['bom-ref'] === selectedRef)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<StrideCategory>('spoofing')

  const byStride = useMemo(() => {
    const map = Object.fromEntries(
      STRIDE_CATEGORIES.map((c) => [c.id, [] as Threat[]]),
    ) as Record<StrideCategory, Threat[]>
    for (const t of threats) {
      const cats =
        t.categories
          ?.filter((c) => c.taxonomy === 'STRIDE')
          .map((c) => c.category as StrideCategory) ?? []
      if (!cats.length) continue
      for (const c of cats) {
        map[c]?.push(t)
      }
    }
    return map
  }, [threats])

  return (
    <div className="stack">
      <div className="panel panel-pad">
        <div className="btn-row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Threat name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Credential stuffing against login"
            />
          </div>
          <div className="field">
            <label>STRIDE</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as StrideCategory)}
            >
              {STRIDE_CATEGORIES.map((c) => (
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
              addThreat({
                name: name.trim(),
                categories: [{ taxonomy: 'STRIDE', category }],
                description: STRIDE_CATEGORIES.find((c) => c.id === category)
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
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '0.75rem',
        }}
      >
        {STRIDE_CATEGORIES.map((c) => (
          <div key={c.id} className="panel panel-pad">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-stride">{c.letter}</span>
              <strong>{c.label}</strong>
              <span className="muted" style={{ marginLeft: 'auto' }}>
                {byStride[c.id].length}
              </span>
            </div>
            <p className="muted" style={{ fontSize: '0.8rem' }}>
              {c.description}
            </p>
            <div className="list">
              {byStride[c.id].map((t) => (
                <button
                  key={t['bom-ref']}
                  type="button"
                  className={`list-item${selectedRef === t['bom-ref'] ? ' selected' : ''}`}
                  onClick={() => setSelectedRef(t['bom-ref'])}
                >
                  <div>
                    <h4>{t.name}</h4>
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
            <label>STRIDE category</label>
            <select
              value={
                selected.categories?.find((c) => c.taxonomy === 'STRIDE')
                  ?.category ?? 'spoofing'
              }
              onChange={(e) =>
                updateThreat(selected['bom-ref'], {
                  categories: [
                    {
                      taxonomy: 'STRIDE',
                      category: e.target.value,
                    },
                  ],
                })
              }
            >
              {STRIDE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
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
