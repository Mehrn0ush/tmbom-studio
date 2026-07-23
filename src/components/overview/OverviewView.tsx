import { useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { getPrimaryBlueprint } from '../../lib/bom'
import { riskLevelColor } from '../../lib/catalog'
import {
  BUNDLED_EXAMPLES,
  clearRecentProjects,
  listRecentProjects,
  type RecentProject,
} from '../../lib/recentProjects'
import { fetchCheckoutExample } from '../export/ExportView'

export function OverviewView() {
  const bom = useThreatModelStore((s) => s.bom)
  const setView = useThreatModelStore((s) => s.setView)
  const updateMetadataName = useThreatModelStore((s) => s.updateMetadataName)
  const loadSample = useThreatModelStore((s) => s.loadSample)
  const newModel = useThreatModelStore((s) => s.newModel)
  const importBom = useThreatModelStore((s) => s.importBom)

  const [recent, setRecent] = useState<RecentProject[]>(() => listRecentProjects())
  const [projectError, setProjectError] = useState<string | null>(null)

  const bp = getPrimaryBlueprint(bom)
  const threats = bom.threats?.threats ?? []
  const scenarios = bom.threats?.scenarios ?? []
  const risks = bom.risks?.risks ?? []
  const name = bom.metadata?.component?.name ?? 'Untitled System'

  const openRecent = (item: RecentProject) => {
    if (!item.snapshot) {
      setProjectError('This recent entry has no snapshot. Open the file from Projects.')
      return
    }
    importBom(item.snapshot)
    setProjectError(null)
  }

  const openBundled = async () => {
    setProjectError(null)
    try {
      importBom(await fetchCheckoutExample())
    } catch (e) {
      setProjectError(e instanceof Error ? e.message : 'Failed to load example')
    }
  }

  return (
    <div className="stack">
      <div className="panel hero-card">
        <h3>CycloneDX 2.0 Threat Model</h3>
        <p>
          Model system architecture as a blueprint, catalog STRIDE threats,
          capture scenarios, and score risks — then save a standards-aligned
          TM-BOM file to Git. Browser storage is only a draft.
        </p>
        <div className="field" style={{ maxWidth: 420 }}>
          <label>System name</label>
          <input
            value={name}
            onChange={(e) => updateMetadataName(e.target.value)}
          />
        </div>
        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setView('blueprint')}
          >
            Open blueprint
          </button>
          <button className="btn" type="button" onClick={() => setView('report')}>
            Risk report
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => setView('export')}
          >
            Open / save project file
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              if (confirm('Start a new empty threat model?')) newModel()
            }}
          >
            New model
          </button>
        </div>
      </div>

      <div className="panel panel-pad">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            alignItems: 'baseline',
          }}
        >
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
            Projects
          </h3>
          {recent.length > 0 && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                clearRecentProjects()
                setRecent([])
              }}
            >
              Clear recent
            </button>
          )}
        </div>
        <p className="muted" style={{ marginTop: '0.35rem' }}>
          Bundled examples and recently saved drafts (local only). Commit{' '}
          <span className="mono">.cdx.json</span> files for durable storage.
        </p>

        <h4 style={{ marginBottom: '0.5rem' }}>Bundled examples</h4>
        <div className="list" style={{ marginBottom: '1rem' }}>
          {BUNDLED_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="list-item"
              onClick={() => void openBundled()}
            >
              <div>
                <h4>{ex.name}</h4>
                <p>
                  {ex.description} · <span className="mono">{ex.path}</span>
                </p>
              </div>
              <span className="badge">Open</span>
            </button>
          ))}
          <button
            type="button"
            className="list-item"
            onClick={() => loadSample()}
          >
            <div>
              <h4>Checkout API (built-in generator)</h4>
              <p>Same sample via in-app generator (no network fetch).</p>
            </div>
            <span className="badge">Open</span>
          </button>
        </div>

        <h4 style={{ marginBottom: '0.5rem' }}>Recent drafts</h4>
        <div className="list">
          {recent.length === 0 && (
            <div className="empty">
              No recent saves yet. Use Projects → Save project file…
            </div>
          )}
          {recent.map((item) => (
            <button
              key={`${item.id}-${item.savedAt}`}
              type="button"
              className="list-item"
              onClick={() => openRecent(item)}
            >
              <div>
                <h4>{item.name}</h4>
                <p>
                  <span className="mono">{item.fileName}</span> ·{' '}
                  {item.assets} assets · {item.threats} threats · {item.risks}{' '}
                  risks · {new Date(item.savedAt).toLocaleString()}
                </p>
              </div>
              <span className="badge">Reopen</span>
            </button>
          ))}
        </div>
        {projectError && (
          <p style={{ color: 'var(--danger)', marginBottom: 0 }}>{projectError}</p>
        )}
      </div>

      <div className="grid-stats">
        <div className="stat">
          <div className="label">Assets</div>
          <div className="value">{bp.assets?.length ?? 0}</div>
        </div>
        <div className="stat">
          <div className="label">Threats</div>
          <div className="value">{threats.length}</div>
        </div>
        <div className="stat">
          <div className="label">Scenarios</div>
          <div className="value">{scenarios.length}</div>
        </div>
        <div className="stat">
          <div className="label">Risks</div>
          <div className="value">{risks.length}</div>
        </div>
      </div>

      <div className="panel panel-pad">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
          Model summary
        </h3>
        <table className="table">
          <tbody>
            <tr>
              <th>Spec</th>
              <td className="mono">
                {bom.specFormat} {bom.specVersion}
              </td>
            </tr>
            <tr>
              <th>Serial</th>
              <td className="mono">{bom.serialNumber}</td>
            </tr>
            <tr>
              <th>Version</th>
              <td className="mono">{bom.version}</td>
            </tr>
            <tr>
              <th>Blueprint</th>
              <td>
                {bp.name}{' '}
                <span className="muted">
                  ({(bp.modelTypes ?? []).join(', ')})
                </span>
              </td>
            </tr>
            <tr>
              <th>Methodologies</th>
              <td className="mono">
                {(bom.threats?.methodologies ?? [])
                  .map((m) => (typeof m === 'string' ? m : m.name))
                  .join(', ') || '—'}
              </td>
            </tr>
            <tr>
              <th>Zones / flows</th>
              <td>
                {bp.zones?.length ?? 0} zones · {bp.flows?.length ?? 0} flows ·{' '}
                {bp.boundaries?.length ?? 0} boundaries
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {risks.length > 0 && (
        <div className="panel panel-pad">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
            Top risks
          </h3>
          <div className="list">
            {risks.slice(0, 5).map((r) => {
              const level =
                r.residualRisk?.score?.level ??
                r.inherentRisk?.score?.level ??
                'info'
              return (
                <div
                  key={r['bom-ref']}
                  className="list-item"
                  style={{ cursor: 'default' }}
                >
                  <div>
                    <h4>{r.name}</h4>
                    <p>{r.statement}</p>
                  </div>
                  <span
                    className="badge badge-risk"
                    style={{ background: riskLevelColor(level) }}
                  >
                    {level}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
