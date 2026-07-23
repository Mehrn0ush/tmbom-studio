import { useEffect, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import {
  buildSessionPackage,
  downloadJson,
  parseSessionPackage,
  readSession,
  type WorkshopSession,
} from '../../lib/session'
import { suggestedFileName } from '../../lib/projectFiles'

export function SessionView() {
  const bom = useThreatModelStore((s) => s.bom)
  const exportBom = useThreatModelStore((s) => s.exportBom)
  const updateSession = useThreatModelStore((s) => s.updateSession)
  const importBom = useThreatModelStore((s) => s.importBom)

  const [session, setSession] = useState<WorkshopSession>(() => readSession(bom))
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setSession(readSession(bom))
  }, [bom.version, bom.serialNumber])

  const save = () => {
    updateSession(session)
    setStatus('Session details saved into the TM-BOM metadata/properties.')
  }

  const exportPackage = () => {
    updateSession(session)
    const pkg = buildSessionPackage(exportBom(), session)
    const base = suggestedFileName(pkg.bom).replace(/\.cdx\.json$/, '')
    downloadJson(`${base}.session.json`, pkg)
    setStatus('Downloaded workshop session package (.session.json).')
  }

  const onImport = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text())
      const parsed = parseSessionPackage(raw)
      importBom(parsed.bom)
      if (parsed.session) {
        updateSession(parsed.session)
        setSession(parsed.session)
      }
      setStatus('Imported session package / TM-BOM.')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Import failed')
    }
  }

  return (
    <div className="stack">
      <div className="panel panel-pad">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
          Workshop session
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Capture facilitators and participants for a multi-person threat
          modeling session. Export a <span className="mono">.session.json</span>{' '}
          package to share the TM-BOM plus attendance notes.
        </p>
        <div className="stack">
          <div className="field">
            <label>Session title</label>
            <input
              value={session.title}
              onChange={(e) =>
                setSession((s) => ({ ...s, title: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={session.date}
              onChange={(e) =>
                setSession((s) => ({ ...s, date: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Notes / decisions</label>
            <textarea
              value={session.notes}
              onChange={(e) =>
                setSession((s) => ({ ...s, notes: e.target.value }))
              }
              placeholder="Assumptions, out-of-scope items, follow-ups…"
            />
          </div>
        </div>
      </div>

      <div className="panel panel-pad stack">
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
          Participants
        </h3>
        {session.participants.map((p, idx) => (
          <div key={idx} className="btn-row" style={{ alignItems: 'end' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Name</label>
              <input
                value={p.name}
                onChange={(e) => {
                  const participants = [...session.participants]
                  participants[idx] = { ...p, name: e.target.value }
                  setSession({ ...session, participants })
                }}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Email</label>
              <input
                value={p.email ?? ''}
                onChange={(e) => {
                  const participants = [...session.participants]
                  participants[idx] = { ...p, email: e.target.value }
                  setSession({ ...session, participants })
                }}
              />
            </div>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() =>
                setSession({
                  ...session,
                  participants: session.participants.filter((_, i) => i !== idx),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="btn"
          type="button"
          onClick={() =>
            setSession({
              ...session,
              participants: [
                ...session.participants,
                { name: '', email: '' },
              ],
            })
          }
        >
          Add participant
        </button>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" type="button" onClick={save}>
          Save session to BOM
        </button>
        <button className="btn" type="button" onClick={exportPackage}>
          Export session package
        </button>
        <label className="btn" style={{ display: 'inline-flex', alignItems: 'center' }}>
          Import session / BOM
          <input
            type="file"
            accept="application/json,.json,.session.json,.cdx.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onImport(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {status && <p className="muted">{status}</p>}
    </div>
  )
}
