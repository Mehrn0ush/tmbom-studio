import { useEffect, useMemo, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'

const SECTIONS = [
  'services',
  'dependencies',
  'compositions',
  'vulnerabilities',
  'annotations',
  'citations',
  'perspectives',
  'formulation',
  'declarations',
] as const

type SectionKey = (typeof SECTIONS)[number]

export function AdvancedView() {
  const bom = useThreatModelStore((s) => s.bom)
  const updateAdvancedSection = useThreatModelStore(
    (s) => s.updateAdvancedSection,
  )
  const [section, setSection] = useState<SectionKey>('vulnerabilities')
  const [error, setError] = useState<string | null>(null)

  const text = useMemo(() => {
    const value = (bom as unknown as Record<string, unknown>)[section]
    return JSON.stringify(value ?? null, null, 2)
  }, [bom, section])

  const [draft, setDraft] = useState(text)
  useEffect(() => {
    setDraft(text)
    setError(null)
  }, [text, section])

  return (
    <div className="panel panel-pad stack">
      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
        Advanced BOM sections
      </h3>
      <p className="muted" style={{ margin: 0 }}>
        Edit remaining CycloneDX 2.0 root sections as JSON for full round-trip
        with the spec. Prefer dedicated views when available.
      </p>
      <div className="field">
        <label>Section</label>
        <select
          value={section}
          onChange={(e) => {
            setSection(e.target.value as SectionKey)
            setError(null)
          }}
        >
          {SECTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>JSON</label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={18}
          className="mono"
          spellCheck={false}
        />
      </div>
      {error && <p className="muted">{error}</p>}
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => {
          try {
            const parsed = JSON.parse(draft || 'null')
            if (
              section !== 'formulation' &&
              section !== 'declarations' &&
              parsed !== null &&
              !Array.isArray(parsed) &&
              typeof parsed !== 'object'
            ) {
              throw new Error('Expected array or object')
            }
            updateAdvancedSection(section, parsed)
            setError(null)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid JSON')
          }
        }}
      >
        Apply JSON
      </button>
    </div>
  )
}
