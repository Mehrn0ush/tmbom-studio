import { useEffect, useMemo, useRef, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import {
  PROJECTS_FOLDER_HINT,
  openProjectFileWithPicker,
  readProjectFromFile,
  saveProjectFile,
} from '../../lib/projectFiles'
import type { CycloneDxBom } from '../../types/cyclonedx'

const EXAMPLE_URL = `${import.meta.env.BASE_URL}examples/checkout-api.cdx.json`

async function fetchCheckoutExample(): Promise<CycloneDxBom> {
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

  const json = useMemo(
    () => JSON.stringify(exportBom(), null, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bom.version, exportBom],
  )

  const copy = async () => {
    await navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const onImportParsed = (parsed: unknown) => {
    setError(null)
    importBom(parsed)
    setStatus('Project loaded. Prefer committing the .cdx.json to Git.')
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
    try {
      const mode = await saveProjectFile(exportBom())
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
      setStatus('Loaded examples/checkout-api.cdx.json')
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
        {status && <p className="muted" style={{ marginBottom: 0 }}>{status}</p>}
        {error && (
          <p style={{ color: 'var(--danger)', marginBottom: 0 }}>{error}</p>
        )}
      </div>
      <pre className="code-block">{json}</pre>
    </div>
  )
}

/** Deep-link: ?example=checkout-api loads the bundled sample once. */
export function useExampleQueryBootstrap() {
  const importBom = useThreatModelStore((s) => s.importBom)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('example') !== 'checkout-api') return
    let cancelled = false
    void fetchCheckoutExample()
      .then((bom) => {
        if (!cancelled) importBom(bom)
      })
      .catch(() => {
        /* ignore bootstrap errors; user can load manually */
      })
    return () => {
      cancelled = true
    }
  }, [importBom])
}
