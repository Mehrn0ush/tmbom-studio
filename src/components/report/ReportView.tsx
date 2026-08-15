import { useMemo, useState } from 'react'
import { getPrimaryBlueprint } from '../../lib/bom'
import { riskLevelColor } from '../../lib/catalog'
import {
  buildReportMarkdown,
  suggestedReportFileName,
} from '../../lib/reportMarkdown'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { readThreatInScope } from '../../types/cyclonedx'

export function ReportView() {
  const bom = useThreatModelStore((s) => s.bom)
  const bp = getPrimaryBlueprint(bom)
  const threats = bom.threats?.threats ?? []
  const scenarios = bom.threats?.scenarios ?? []
  const risks = bom.risks?.risks ?? []
  const name = bom.metadata?.component?.name ?? 'Untitled System'
  const methodologies = (bom.threats?.methodologies ?? [])
    .map((m) => (typeof m === 'string' ? m : m.name))
    .join(', ')

  const [copied, setCopied] = useState(false)
  const [mdError, setMdError] = useState<string | null>(null)
  const [hideOutOfScope, setHideOutOfScope] = useState(false)

  const markdown = useMemo(
    () =>
      buildReportMarkdown(bom, new Date(), {
        separateOutOfScope: true,
      }),
    [bom],
  )

  const threatsVisible = hideOutOfScope
    ? threats.filter((t) => readThreatInScope(t.properties) !== false)
    : threats
  const outOfScopeCount = threats.filter(
    (t) => readThreatInScope(t.properties) === false,
  ).length


  const copyMarkdown = async () => {
    setMdError(null)
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setMdError('Could not copy Markdown. Download the .md file instead.')
    }
  }

  const downloadMarkdown = () => {
    setMdError(null)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = suggestedReportFileName(bom)
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stack">
      <div className="panel panel-pad no-print btn-row">
        <p className="muted" style={{ margin: 0, flex: 1 }}>
          Printable risk summary for design reviews. Export Markdown for
          GitHub/Confluence, or use the browser print dialog (“Save as PDF”).
          Markdown separates out-of-scope threats (`cyclonedx:in-scope=false`).
        </p>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={hideOutOfScope}
            onChange={(e) => setHideOutOfScope(e.target.checked)}
          />
          Hide out-of-scope ({outOfScopeCount})
        </label>
        <button className="btn" type="button" onClick={() => void copyMarkdown()}>
          {copied ? 'Copied' : 'Copy Markdown'}
        </button>
        <button className="btn" type="button" onClick={downloadMarkdown}>
          Download .md
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>
      {mdError && (
        <p className="feedback feedback-error no-print" role="alert">
          {mdError}
        </p>
      )}

      <article className="panel panel-pad report-doc">
        <header className="report-header">
          <p className="mono muted" style={{ margin: 0 }}>
            CycloneDX {bom.specVersion} TM-BOM · tmbom-studio
          </p>
          <h1>{name}</h1>
          <p className="muted">
            Generated {new Date().toISOString()} · BOM v{bom.version} ·{' '}
            {methodologies || 'no methodology set'}
          </p>
        </header>

        <section>
          <h2>Architecture snapshot</h2>
          <table className="table">
            <tbody>
              <tr>
                <th>Blueprint</th>
                <td>{bp.name}</td>
              </tr>
              <tr>
                <th>Model types</th>
                <td className="mono">{(bp.modelTypes ?? []).join(', ')}</td>
              </tr>
              <tr>
                <th>Counts</th>
                <td>
                  {bp.assets?.length ?? 0} assets · {bp.zones?.length ?? 0} zones ·{' '}
                  {bp.flows?.length ?? 0} flows · {bp.boundaries?.length ?? 0}{' '}
                  boundaries
                </td>
              </tr>
              <tr>
                <th>Catalog</th>
                <td>
                  {threatsVisible.length} threats
                  {hideOutOfScope && outOfScopeCount > 0
                    ? ` (${outOfScopeCount} hidden)`
                    : ''}{' '}
                  · {scenarios.length} scenarios · {risks.length} risks
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Assets</h2>
          {(bp.assets ?? []).length === 0 ? (
            <p className="muted">No assets documented.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Zone</th>
                  <th>bom-ref</th>
                </tr>
              </thead>
              <tbody>
                {(bp.assets ?? []).map((a) => (
                  <tr key={a['bom-ref']}>
                    <td>{a.name}</td>
                    <td className="mono">
                      {typeof a.type === 'string' ? a.type : a.type?.name}
                    </td>
                    <td className="mono">{a.zone ?? '—'}</td>
                    <td className="mono">{a['bom-ref']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h2>Threats</h2>
          {threatsVisible.length === 0 ? (
            <p className="muted">No threats documented.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>STRIDE / taxonomy</th>
                  <th>Affected assets</th>
                </tr>
              </thead>
              <tbody>
                {threatsVisible.map((t) => (
                  <tr key={t['bom-ref']}>
                    <td>
                      <strong>
                        {readThreatInScope(t.properties) === false
                          ? '[out of scope] '
                          : ''}
                        {t.name}
                      </strong>
                      {t.description ? (
                        <div className="muted" style={{ fontSize: '0.85rem' }}>
                          {t.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="mono">
                      {(t.categories ?? [])
                        .map((c) => `${c.taxonomy}:${c.category}`)
                        .join(', ') || '—'}
                    </td>
                    <td className="mono">
                      {(t.affectedAssets ?? []).join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h2>Risk register</h2>
          {risks.length === 0 ? (
            <p className="muted">No risks documented.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Risk</th>
                  <th>Inherent</th>
                  <th>Residual</th>
                  <th>Responses</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => {
                  const inherent =
                    r.inherentRisk?.score?.level ??
                    r.inherentRisk?.likelihood?.level ??
                    '—'
                  const residual =
                    r.residualRisk?.score?.level ??
                    r.residualRisk?.likelihood?.level ??
                    '—'
                  return (
                    <tr key={r['bom-ref']}>
                      <td>
                        <strong>{r.name}</strong>
                        <div style={{ marginTop: 4 }}>{r.statement}</div>
                      </td>
                      <td>
                        <span
                          className="badge badge-risk"
                          style={{
                            background:
                              inherent === '—'
                                ? 'var(--ink-faint)'
                                : riskLevelColor(String(inherent)),
                          }}
                        >
                          {inherent}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge badge-risk"
                          style={{
                            background:
                              residual === '—'
                                ? 'var(--ink-faint)'
                                : riskLevelColor(String(residual)),
                          }}
                        >
                          {residual}
                        </span>
                      </td>
                      <td>
                        {(r.responses ?? []).length === 0
                          ? '—'
                          : (r.responses ?? [])
                              .map(
                                (resp) =>
                                  `${resp.strategy}${
                                    resp.description
                                      ? `: ${resp.description}`
                                      : ''
                                  }`,
                              )
                              .join(' · ')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <footer className="muted" style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
          Serial {bom.serialNumber ?? '—'} · This summary is derived from a
          CycloneDX TM-BOM and is not a substitute for formal risk acceptance.
        </footer>
      </article>
    </div>
  )
}
