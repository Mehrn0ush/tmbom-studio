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
import { validateBomSchema } from '../../lib/schemaValidate'
import { importSbomToTmbom, parseSbomJson } from '../../lib/sbomImport'
import {
  applyDiagramImport,
  importDrawio,
  importThreatDragon,
} from '../../lib/diagramImport'
import { toExportBom } from '../../lib/bom'
import { useBomValidation } from '../../hooks/useBomValidation'
import {
  filterBomByInScope,
  type InScopeExportMode,
} from '../../lib/inScopeFilter'
import type { CycloneDxBom } from '../../types/cyclonedx'
import { readThreatInScope } from '../../types/cyclonedx'

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
  const importBom = useThreatModelStore((s) => s.importBom)
  const bom = useThreatModelStore((s) => s.bom)
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [forceSave, setForceSave] = useState(false)
  const [schemaStatus, setSchemaStatus] = useState<string | null>(null)
  const [exportMode, setExportMode] = useState<InScopeExportMode>('all')
  const sbomRef = useRef<HTMLInputElement>(null)
  const diagramRef = useRef<HTMLInputElement>(null)

  const exportDoc = useMemo(() => {
    const base = toExportBom(bom)
    return filterBomByInScope(base, exportMode)
  }, [bom, exportMode])

  const json = useMemo(() => JSON.stringify(exportDoc, null, 2), [exportDoc])

  const validation = useBomValidation()
  const outOfScopeCount = (bom.threats?.threats ?? []).filter(
    (t) => readThreatInScope(t.properties) === false,
  ).length

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
    const doc = exportDoc
    if (!validation.ok && !forceSave) {
      setError(
        `Validation failed (${validation.errors.length} error(s)). Fix issues below or enable “Allow save with errors”.`,
      )
      return
    }
    const schema = await validateBomSchema(doc)
    if (!schema.ok && !forceSave) {
      setSchemaStatus(
        `JSON Schema: ${schema.errors.length} issue(s). Enable force-save to proceed.`,
      )
      setError(
        schema.errors[0]
          ? `${schema.errors[0].path} — ${schema.errors[0].message}`
          : 'JSON Schema validation failed',
      )
      return
    }
    setSchemaStatus(
      schema.ok
        ? 'JSON Schema validation passed'
        : `JSON Schema: ${schema.errors.length} issue(s) (forced save)`,
    )
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

  const runSchemaCheck = async () => {
    setError(null)
    const result = await validateBomSchema(exportDoc)
    if (result.ok) {
      setSchemaStatus('JSON Schema validation passed against bundled 2.0 schema')
    } else {
      setSchemaStatus(
        `JSON Schema: ${result.errors.length} issue(s) — see first error below`,
      )
      setError(
        result.errors
          .slice(0, 3)
          .map((e) => `${e.path} — ${e.message}`)
          .join('\n'),
      )
    }
  }

  const onSbomFile = async (file: File) => {
    try {
      const text = await file.text()
      const { bom: next, mapped } = importSbomToTmbom(parseSbomJson(text), bom)
      importBom(next)
      setStatus(
        `Imported SBOM “${file.name}”: linked ${mapped} component(s)/service(s) as blueprint assets.`,
      )
      setError(null)
    } catch (e) {
      setError(describeIoError(e, 'import') || 'SBOM import failed')
    }
  }

  const onDiagramFile = async (file: File) => {
    try {
      const text = await file.text()
      let result
      if (file.name.endsWith('.xml') || text.includes('<mxfile') || text.includes('<mxGraphModel')) {
        result = importDrawio(text)
      } else {
        result = importThreatDragon(JSON.parse(text))
      }
      const next = applyDiagramImport(bom, result)
      importBom(next)
      setStatus(
        `Imported diagram “${file.name}”: ${result.assets.length} assets, ${result.flows.length} flows (lossy).`,
      )
      setError(null)
    } catch (e) {
      setError(describeIoError(e, 'import') || 'Diagram import failed')
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
          <button className="btn" type="button" onClick={() => void runSchemaCheck()}>
            Run JSON Schema check
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
        <div className="btn-row" style={{ marginTop: '0.65rem' }}>
          <button
            className="btn"
            type="button"
            onClick={() => sbomRef.current?.click()}
          >
            Import SBOM…
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => diagramRef.current?.click()}
          >
            Import Threat Dragon / draw.io…
          </button>
          <input
            ref={sbomRef}
            type="file"
            accept="application/json,.json,.cdx.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onSbomFile(file)
              e.target.value = ''
            }}
          />
          <input
            ref={diagramRef}
            type="file"
            accept="application/json,.json,.xml,text/xml"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onDiagramFile(file)
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
          <span>Export scope</span>
          <select
            value={exportMode}
            onChange={(e) =>
              setExportMode(e.target.value as InScopeExportMode)
            }
          >
            <option value="all">All threats</option>
            <option value="in-scope-only">
              In-scope only (drop cyclonedx:in-scope=false)
            </option>
            <option value="flag-out-of-scope">
              All (flag out-of-scope in report)
            </option>
          </select>
          {outOfScopeCount > 0 && (
            <span className="muted">{outOfScopeCount} out of scope</span>
          )}
        </label>
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
        {schemaStatus && (
          <p className="feedback feedback-warn" style={{ marginBottom: 0 }}>
            {schemaStatus}
          </p>
        )}
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
          Structural checks run continuously. Use “Run JSON Schema check” for
          bundled CycloneDX 2.0 schema validation before save.
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
