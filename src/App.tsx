import { lazy, Suspense } from 'react'
import { useThreatModelStore } from './store/useThreatModelStore'
import type { WorkspaceView } from './types/cyclonedx'
import { OverviewView } from './components/overview/OverviewView'
import { BlueprintView } from './components/blueprint/BlueprintView'
import { AssumptionsView } from './components/blueprint/AssumptionsView'
import { ThreatsView } from './components/threats/ThreatsView'
import { AttackTreesView } from './components/threats/AttackTreesView'
import { AttackPathsView } from './components/threats/AttackPathsView'
import { AbuseCasesView } from './components/threats/AbuseCasesView'
import { ScenariosView } from './components/risks/ScenariosView'
import { RisksView } from './components/risks/RisksView'
import { ControlsView } from './components/controls/ControlsView'
import { DefinitionsView } from './components/definitions/DefinitionsView'
import { ProfilesView } from './components/profiles/ProfilesView'
import { TrustBoundariesView } from './components/trust/TrustBoundariesView'
import { ComponentsView } from './components/components/ComponentsView'
import { AdvancedView } from './components/advanced/AdvancedView'
import { SessionView } from './components/session/SessionView'
import { LinksView } from './components/links/LinksView'
import { ReportView } from './components/report/ReportView'
import {
  ExportView,
  useExampleQueryBootstrap,
} from './components/export/ExportView'
import { getPrimaryBlueprint } from './lib/bom'

const AttackPatternsView = lazy(() =>
  import('./components/threats/AttackPatternsView').then((m) => ({
    default: m.AttackPatternsView,
  })),
)

const NAV: Array<{ id: WorkspaceView; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'assumptions', label: 'Scope & assumptions' },
  { id: 'threats', label: 'Threats' },
  { id: 'attack-patterns', label: 'CAPEC' },
  { id: 'attack-trees', label: 'Attack trees' },
  { id: 'attack-paths', label: 'Attack paths' },
  { id: 'abuse-cases', label: 'Abuse cases' },
  { id: 'trust-boundaries', label: 'Trust boundaries' },
  { id: 'controls', label: 'Controls' },
  { id: 'definitions', label: 'Definitions' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'risks', label: 'Risks' },
  { id: 'components', label: 'Components' },
  { id: 'session', label: 'Session' },
  { id: 'links', label: 'Links' },
  { id: 'advanced', label: 'Advanced BOM' },
  { id: 'report', label: 'Report' },
  { id: 'export', label: 'Projects' },
]

const TITLES: Record<WorkspaceView, string> = {
  overview: 'Overview',
  blueprint: 'Architecture blueprint',
  assumptions: 'Scope & assumptions',
  threats: 'Threat catalog',
  'attack-patterns': 'CAPEC attack patterns',
  'attack-trees': 'Attack trees',
  'attack-paths': 'Attack paths',
  'abuse-cases': 'Abuse cases',
  'trust-boundaries': 'Trust boundaries',
  controls: 'Controls',
  definitions: 'Definitions',
  profiles: 'Threat profiles',
  scenarios: 'Threat scenarios',
  risks: 'Risk register',
  components: 'SBOM components',
  session: 'Workshop session',
  links: 'BOM-Link & references',
  advanced: 'Advanced BOM sections',
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
              {bom.threats?.threats?.length ?? 0} threats ·{' '}
              {bom.controls?.length ?? 0} controls
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
          {view === 'assumptions' && <AssumptionsView />}
          {view === 'threats' && <ThreatsView />}
          {view === 'attack-patterns' && (
            <Suspense
              fallback={
                <div className="panel empty">Loading CAPEC catalog…</div>
              }
            >
              <AttackPatternsView />
            </Suspense>
          )}
          {view === 'attack-trees' && <AttackTreesView />}
          {view === 'attack-paths' && <AttackPathsView />}
          {view === 'abuse-cases' && <AbuseCasesView />}
          {view === 'trust-boundaries' && <TrustBoundariesView />}
          {view === 'controls' && <ControlsView />}
          {view === 'definitions' && <DefinitionsView />}
          {view === 'profiles' && <ProfilesView />}
          {view === 'scenarios' && <ScenariosView />}
          {view === 'risks' && <RisksView />}
          {view === 'components' && <ComponentsView />}
          {view === 'session' && <SessionView />}
          {view === 'links' && <LinksView />}
          {view === 'advanced' && <AdvancedView />}
          {view === 'report' && <ReportView />}
          {view === 'export' && <ExportView />}
        </main>
      </div>
    </div>
  )
}
