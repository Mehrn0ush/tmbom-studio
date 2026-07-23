import { useThreatModelStore } from './store/useThreatModelStore'
import type { WorkspaceView } from './types/cyclonedx'
import { OverviewView } from './components/overview/OverviewView'
import { BlueprintView } from './components/blueprint/BlueprintView'
import { ThreatsView } from './components/threats/ThreatsView'
import { ScenariosView } from './components/risks/ScenariosView'
import { RisksView } from './components/risks/RisksView'
import { ReportView } from './components/report/ReportView'
import {
  ExportView,
  useExampleQueryBootstrap,
} from './components/export/ExportView'
import { getPrimaryBlueprint } from './lib/bom'

const NAV: Array<{ id: WorkspaceView; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'threats', label: 'Threats' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'risks', label: 'Risks' },
  { id: 'report', label: 'Report' },
  { id: 'export', label: 'Projects' },
]

const TITLES: Record<WorkspaceView, string> = {
  overview: 'Overview',
  blueprint: 'Architecture blueprint',
  threats: 'Threat catalog',
  scenarios: 'Threat scenarios',
  risks: 'Risk register',
  report: 'Risk report',
  export: 'Projects / Export',
}

export default function App() {
  useExampleQueryBootstrap()

  const view = useThreatModelStore((s) => s.view)
  const setView = useThreatModelStore((s) => s.setView)
  const bom = useThreatModelStore((s) => s.bom)
  const loadSample = useThreatModelStore((s) => s.loadSample)
  const newModel = useThreatModelStore((s) => s.newModel)

  const systemName = bom.metadata?.component?.name ?? 'Untitled'
  const bp = getPrimaryBlueprint(bom)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TM</div>
          <h1>tmbom-studio</h1>
          <p>ThreatModeler for CycloneDX 2.0 TM-BOMs</p>
        </div>

        <nav className="nav" aria-label="Primary">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'active' : ''}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          <button className="btn" type="button" onClick={() => loadSample()}>
            Sample model
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => setView('export')}
          >
            Save / open file
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              if (confirm('Discard current model and start fresh?')) newModel()
            }}
          >
            New model
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h2>{TITLES[view]}</h2>
            <div className="meta">
              {systemName} · v{bom.version} · {bp.assets?.length ?? 0} assets ·{' '}
              {bom.threats?.threats?.length ?? 0} threats
            </div>
          </div>
          <div className="btn-row">
            <button
              className="btn"
              type="button"
              onClick={() => setView('report')}
            >
              Report
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setView('export')}
            >
              Save project
            </button>
          </div>
        </header>

        <main className="content">
          {view === 'overview' && <OverviewView />}
          {view === 'blueprint' && <BlueprintView />}
          {view === 'threats' && <ThreatsView />}
          {view === 'scenarios' && <ScenariosView />}
          {view === 'risks' && <RisksView />}
          {view === 'report' && <ReportView />}
          {view === 'export' && <ExportView />}
        </main>
      </div>
    </div>
  )
}
