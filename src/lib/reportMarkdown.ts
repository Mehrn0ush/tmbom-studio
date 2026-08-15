import type { CycloneDxBom, Risk } from '../types/cyclonedx'
import { getPrimaryBlueprint } from './bom'

function esc(text: string | undefined | null): string {
  return (text ?? '').replace(/\r\n/g, '\n').trim()
}

function levelOf(risk: Risk, kind: 'inherent' | 'residual'): string {
  const rating = kind === 'inherent' ? risk.inherentRisk : risk.residualRisk
  return rating?.score?.level ?? rating?.likelihood?.level ?? '—'
}

/** Stakeholder-friendly Markdown summary derived from a TM-BOM. */
export function buildReportMarkdown(
  bom: CycloneDxBom,
  generatedAt = new Date(),
): string {
  const bp = getPrimaryBlueprint(bom)
  const name = bom.metadata?.component?.name ?? 'Untitled System'
  const threats = bom.threats?.threats ?? []
  const scenarios = bom.threats?.scenarios ?? []
  const risks = bom.risks?.risks ?? []
  const controls = bom.controls ?? []
  const methodologies = (bom.threats?.methodologies ?? [])
    .map((m) => (typeof m === 'string' ? m : m.name))
    .join(', ')

  const lines: string[] = [
    `# Threat model report: ${esc(name)}`,
    '',
    `Generated ${generatedAt.toISOString()} · CycloneDX ${bom.specVersion} TM-BOM · BOM v${bom.version ?? 1}`,
    '',
  ]

  if (methodologies) {
    lines.push(`**Methodologies:** ${methodologies}`, '')
  }

  lines.push(
    '## Architecture snapshot',
    '',
    `| | |`,
    `| --- | --- |`,
    `| Blueprint | ${esc(bp.name)} |`,
    `| Model types | ${(bp.modelTypes ?? []).join(', ') || '—'} |`,
    `| Assets | ${bp.assets?.length ?? 0} |`,
    `| Zones | ${bp.zones?.length ?? 0} |`,
    `| Flows | ${bp.flows?.length ?? 0} |`,
    `| Boundaries | ${bp.boundaries?.length ?? 0} |`,
    `| Threats | ${threats.length} |`,
    `| Scenarios | ${scenarios.length} |`,
    `| Risks | ${risks.length} |`,
    `| Controls | ${controls.length} |`,
    '',
    '## Assets',
    '',
  )

  if ((bp.assets ?? []).length === 0) {
    lines.push('_No assets documented._', '')
  } else {
    lines.push('| Name | Type | Zone | bom-ref |', '| --- | --- | --- | --- |')
    for (const a of bp.assets ?? []) {
      const type = typeof a.type === 'string' ? a.type : a.type?.name ?? '—'
      lines.push(
        `| ${esc(a.name)} | ${type} | ${a.zone ?? '—'} | \`${a['bom-ref']}\` |`,
      )
    }
    lines.push('')
  }

  lines.push('## Threats', '')
  if (threats.length === 0) {
    lines.push('_No threats documented._', '')
  } else {
    for (const t of threats) {
      const cats = (t.categories ?? [])
        .map((c) => `${c.taxonomy}:${c.category}`)
        .join(', ')
      lines.push(`### ${esc(t.name)}`, '')
      if (t.description) lines.push(esc(t.description), '')
      if (cats) lines.push(`- **Taxonomy:** ${cats}`)
      if (t.affectedAssets?.length) {
        lines.push(
          `- **Affected assets:** ${t.affectedAssets.map((r) => `\`${r}\``).join(', ')}`,
        )
      }
      lines.push('')
    }
  }

  lines.push('## Risk register', '')
  if (risks.length === 0) {
    lines.push('_No risks documented._', '')
  } else {
    lines.push(
      '| Risk | Statement | Inherent | Residual | Responses |',
      '| --- | --- | --- | --- | --- |',
    )
    for (const r of risks) {
      const responses =
        (r.responses ?? [])
          .map((resp) =>
            resp.description
              ? `${resp.strategy}: ${esc(resp.description)}`
              : resp.strategy,
          )
          .join('; ') || '—'
      lines.push(
        `| ${esc(r.name)} | ${esc(r.statement)} | ${levelOf(r, 'inherent')} | ${levelOf(r, 'residual')} | ${responses} |`,
      )
    }
    lines.push('')
  }

  if (controls.length > 0) {
    lines.push('## Controls', '')
    lines.push('| Name | Category | Status |', '| --- | --- | --- |')
    for (const c of controls) {
      const cat =
        typeof c.category === 'string' ? c.category : c.category?.name ?? '—'
      const status =
        typeof c.status === 'string' ? c.status : c.status?.name ?? '—'
      lines.push(`| ${esc(c.name)} | ${cat} | ${status} |`)
    }
    lines.push('')
  }

  lines.push(
    '---',
    '',
    `_Serial ${bom.serialNumber ?? '—'} · Derived from a CycloneDX TM-BOM; not a substitute for formal risk acceptance._`,
    '',
  )

  return lines.join('\n')
}

export function suggestedReportFileName(bom: CycloneDxBom): string {
  const name = (bom.metadata?.component?.name ?? 'threat-model')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${name || 'threat-model'}-report.md`
}
