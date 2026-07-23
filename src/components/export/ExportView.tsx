import { useEffect, useMemo, useRef, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import {
  PROJECTS_FOLDER_HINT,
  openProjectFileWithPicker,
  readProjectFromFile,
  saveProjectFile,
} from '../../lib/projectFiles'
import {
  BUNDLED_EXAMPLES,
  rememberRecentProject,
} from '../../lib/recentProjects'
import { validateTmbom } from '../../lib/validateBom'
import type { CycloneDxBom } from '../../types/cyclonedx'

const EXAMPLE_URL = `${import.meta.env.BASE_URL}examples/checkout-api.cdx.json`

export async function fetchCheckoutExample(): Promise<CycloneDxBom> {
  const res = await fetch(EXAMPLE_URL)
  if (!res.ok) {
    throw new Error(`Could not load ${EXAMPLE_URL} (${res.status})`)
  }
  return (await res.json()) as CycloneDxBom
}

export function ExportView() {
  const exportBom = useThreatModelStore((s) => s.exportBom)
  const importBom = useThreatModelStore((s) => s.importBom)
  const bom = useThreatModelStore((s) => s.bom)
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [forceSave, setForceSave] = useState(false)

  const json = useMemo(
    () => JSON.stringify(exportBom(), null, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bom.version, exportBom],
  )

  const validation = useMemo(() => validateTmbom(exportBom()), [bom.version, exportBom])

  const copy = async () => {
    await navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const onImportParsed = (parsed: unknown) => {
    setError(null)
    const result = validateTmbom(parsed)
    importBom(parsed)
    if (!result.ok) {
      setStatus(
        `Loaded with ${result.errors.length} validation error(s). Fix before relying on this file.`,
      )
    } else {
      setStatus('Project loaded. Prefer committing the .cdx.json to Git.')
    }
  }

  const onFile = async (file: File) => {
    try {
      onImportParsed(await readProjectFromFile(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import BOM')
    }
  }

  const save = async () => {
    setError(null)
    const doc = exportBom()
    const result = validateTmbom(doc)
    if (!result.ok && !forceSave) {
      setError(
        `Validation failed (${result.errors.length} error(s)). Fix issues below or enable “Allow save with errors”.`,
      )
      return
    }
    try {
      const mode = await saveProjectFile(doc)
      rememberRecentProject(doc)
      setStatus(
        mode === 'picker'
          ? `Saved. Suggested Git path: ${PROJECTS_FOLDER_HINT}`
          : `Downloaded. Move the file into ${PROJECTS_FOLDER_HINT} and commit it.`,
      )
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  const openPicker = async () => {
    setError(null)
    try {
      const parsed = await openProjectFileWithPicker()
      if (parsed) onImportParsed(parsed)
      else fileRef.current?.click()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Open failed')
    }
  }

  const loadBundledExample = async () => {
    setError(null)
    try {
      onImportParsed(await fetchCheckoutExample())
      setStatus(`Loaded ${BUNDLED_EXAMPLES[0].path}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load example')
    }
  }

  return (
    <div className="stack">
      <div className="panel panel-pad">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
          Projects &amp; TM-BOM files
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Browser storage is a draft cache only. Save a{' '}
          <span className="mono">.cdx.json</span> under{' '}
          <span className="mono">{PROJECTS_FOLDER_HINT}</span> (or your product
          repo) and commit it — that file is the system of record.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" type="button" onClick={() => void save()}>
            Save project file…
          </button>
          <button className="btn" type="button" onClick={() => void openPicker()}>
            Open project file…
          </button>
          <button className="btn" type="button" onClick={() => void loadBundledExample()}>
            Load examples/checkout-api.cdx.json
          </button>
          <button className="btn" type="button" onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,.cdx.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onFile(file)
              e.target.value = ''
            }}
          />
        </div>
        <label
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginTop: '0.75rem',
            fontSize: '0.85rem',
          }}
        >
          <input
            type="checkbox"
            checked={forceSave}
            onChange={(e) => setForceSave(e.target.checked)}
          />
          Allow save with validation errors
        </label>
        {status && <p className="muted" style={{ marginBottom: 0 }}>{status}</p>}
        {error && (
          <p style={{ color: 'var(--danger)', marginBottom: 0 }}>{error}</p>
        )}
      </div>

      <div className="panel panel-pad">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
          Validation
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Structural checks for CycloneDX 2.0 TM-BOM shape (spec fields,
          blueprint, threats, risks). Full JSON Schema validation runs in CI.
        </p>
        {validation.ok && validation.warnings.length === 0 && (
          <p style={{ color: 'var(--accent-ink)', marginBottom: 0 }}>
            Document looks good to save.
          </p>
        )}
        {validation.ok && validation.warnings.length > 0 && (
          <p style={{ color: 'var(--warn)', marginBottom: 0 }}>
            No blocking errors · {validation.warnings.length} warning(s)
          </p>
        )}
        {!validation.ok && (
          <p style={{ color: 'var(--danger)', marginBottom: 0 }}>
            {validation.errors.length} error(s) · {validation.warnings.length}{' '}
            warning(s)
          </p>
        )}
        <ul className="validation-list">
          {validation.errors.map((e) => (
            <li key={`e-${e.path}-${e.message}`} className="validation-error">
              <span className="mono">{e.path}</span> — {e.message}
            </li>
          ))}
          {validation.warnings.map((w) => (
            <li key={`w-${w.path}-${w.message}`} className="validation-warn">
              <span className="mono">{w.path}</span> — {w.message}
            </li>
          ))}
        </ul>
      </div>

      <pre className="code-block">{json}</pre>
    </div>
  )
}

/** Deep-link: ?example=checkout-api loads after zustand rehydration. */
export function useExampleQueryBootstrap() {
  const importBom = useThreatModelStore((s) => s.importBom)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('example') !== 'checkout-api') return

    let cancelled = false
    const load = () => {
      void fetchCheckoutExample()
        .then((doc) => {
          if (!cancelled) importBom(doc)
        })
        .catch(() => {
          /* ignore bootstrap errors; user can load manually */
        })
    }

    const persistApi = useThreatModelStore.persist
    if (persistApi.hasHydrated()) {
      load()
      return () => {
        cancelled = true
      }
    }

    const unsub = persistApi.onFinishHydration(() => {
      load()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [importBom])
}
