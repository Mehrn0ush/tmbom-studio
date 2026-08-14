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
import { describeIoError } from '../../lib/ioErrors'
import { validateTmbom } from '../../lib/validateBom'
import { toExportBom } from '../../lib/bom'
import { useBomValidation } from '../../hooks/useBomValidation'
import type { CycloneDxBom } from '../../types/cyclonedx'

const EXAMPLE_URL = `${import.meta.env.BASE_URL}examples/checkout-api.cdx.json`

export async function fetchCheckoutExample(): Promise<CycloneDxBom> {
  const res = await fetch(EXAMPLE_URL)
  if (!res.ok) {
    throw new Error(
      `Could not load the bundled sample at ${EXAMPLE_URL} (HTTP ${res.status}). Try Projects → Load examples/checkout-api.cdx.json after a refresh.`,
    )
  }
  let parsed: unknown
  try {
    parsed = await res.json()
  } catch {
    throw new Error(
      `The bundled sample at ${EXAMPLE_URL} is not valid JSON. Rebuild or redeploy the app.`,
    )
  }
  return parsed as CycloneDxBom
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

  const json = useMemo(() => JSON.stringify(toExportBom(bom), null, 2), [bom])

  const validation = useBomValidation()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy JSON to the clipboard. Select the preview below and copy manually.')
    }
  }

  const onImportParsed = (parsed: unknown) => {
    setError(null)
    const checked = validateTmbom(parsed)
    importBom(parsed)
    if (!checked.ok) {
      setStatus(
        `Loaded with ${checked.errors.length} validation error(s). Open the list below and fix before relying on this file.`,
      )
    } else if (checked.warnings.length > 0) {
      setStatus(
        `Project loaded with ${checked.warnings.length} warning(s). Prefer committing the .cdx.json to Git.`,
      )
    } else {
      setStatus('Project loaded. Prefer committing the .cdx.json to Git.')
    }
  }

  const onFile = async (file: File) => {
    try {
      onImportParsed(await readProjectFromFile(file))
    } catch (e) {
      setError(describeIoError(e, 'import') || 'Failed to import BOM')
    }
  }

  const save = async () => {
    setError(null)
    const doc = exportBom()
    if (!validation.ok && !forceSave) {
      setError(
        `Validation failed (${validation.errors.length} error(s)). Fix issues below or enable “Allow save with errors”.`,
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
      const msg = describeIoError(e, 'save')
      if (!msg) return
      setError(msg)
    }
  }

  const openPicker = async () => {
    setError(null)
    try {
      const parsed = await openProjectFileWithPicker()
      if (parsed) onImportParsed(parsed)
      else fileRef.current?.click()
    } catch (e) {
      const msg = describeIoError(e, 'open')
      if (!msg) return
      setError(msg)
    }
  }

  const loadBundledExample = async () => {
    setError(null)
    try {
      onImportParsed(await fetchCheckoutExample())
      setStatus(`Loaded ${BUNDLED_EXAMPLES[0].path}`)
    } catch (e) {
      setError(describeIoError(e, 'load example') || 'Failed to load example')
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
        {status && (
          <p className="feedback feedback-ok" style={{ marginBottom: 0 }}>
            {status}
          </p>
        )}
        {error && (
          <p className="feedback feedback-error" role="alert" style={{ marginBottom: 0 }}>
            {error}
          </p>
        )}
      </div>

      <div className="panel panel-pad">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
          Validation
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Structural checks for CycloneDX 2.0 TM-BOM shape (spec fields,
          blueprint, threats, risks). Full JSON Schema validation runs in CI.
          The same status appears in the top bar while you edit.
        </p>
        {validation.ok && validation.warnings.length === 0 && (
          <p className="feedback feedback-ok" style={{ marginBottom: 0 }}>
            Document looks good to save.
          </p>
        )}
        {validation.ok && validation.warnings.length > 0 && (
          <p className="feedback feedback-warn" style={{ marginBottom: 0 }}>
            No blocking errors · {validation.warnings.length} warning(s)
          </p>
        )}
        {!validation.ok && (
          <p className="feedback feedback-error" style={{ marginBottom: 0 }}>
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
export function useExampleQueryBootstrap(onError?: (message: string) => void) {
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
        .catch((e) => {
          if (cancelled) return
          const msg = describeIoError(e, 'load example')
          if (msg) onError?.(msg)
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
  }, [importBom, onError])
}
