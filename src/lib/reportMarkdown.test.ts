import { describe, expect, it } from 'vitest'
import { emptyBom, createAsset, createThreat, createRisk } from './bom'
import { getPrimaryBlueprint } from './bom'
import { buildReportMarkdown, suggestedReportFileName } from './reportMarkdown'
import { writeThreatInScope } from '../types/cyclonedx'

describe('buildReportMarkdown', () => {
  it('includes system name and empty sections', () => {
    const bom = emptyBom('Payments API')
    const md = buildReportMarkdown(bom, new Date('2026-08-15T00:00:00Z'))
    expect(md).toContain('# Threat model report: Payments API')
    expect(md).toContain('2026-08-15T00:00:00.000Z')
    expect(md).toContain('_No assets documented._')
    expect(md).toContain('_No threats documented._')
    expect(md).toContain('_No risks documented._')
  })

  it('renders assets, threats, and risks', () => {
    const bom = emptyBom('Checkout')
    const bp = getPrimaryBlueprint(bom)
    const asset = createAsset({ name: 'Gateway', type: 'gateway' })
    bp.assets = [asset]
    bom.threats!.threats = [
      createThreat({
        name: 'Spoofing',
        description: 'Stolen keys',
        categories: [{ taxonomy: 'STRIDE', category: 'spoofing' }],
        affectedAssets: [asset['bom-ref']],
      }),
    ]
    bom.risks!.risks = [
      createRisk({
        name: 'Fraud',
        statement: 'If spoofing, then fraud.',
        inherentRisk: { score: { level: 'high' } },
        responses: [{ 'bom-ref': 'r1', strategy: 'reduce', description: 'mTLS' }],
      }),
    ]
    bom.controls = [
      {
        'bom-ref': 'c1',
        name: 'mTLS',
        category: 'preventive',
        status: 'implemented',
      },
    ]

    const md = buildReportMarkdown(bom)
    expect(md).toContain('| Gateway | gateway |')
    expect(md).toContain('### Spoofing')
    expect(md).toContain('STRIDE:spoofing')
    expect(md).toContain('| Fraud |')
    expect(md).toContain('reduce: mTLS')
    expect(md).toContain('| mTLS | preventive | implemented |')
  })

  it('separates out-of-scope threats when requested', () => {
    const bom = emptyBom('Lib')
    const inScope = createThreat({ name: 'In scope threat' })
    const out = createThreat({ name: 'Library-only threat' })
    out.properties = writeThreatInScope(out.properties, false)
    bom.threats!.threats = [inScope, out]
    const md = buildReportMarkdown(bom, new Date(), { separateOutOfScope: true })
    expect(md).toContain('## Threats (in scope)')
    expect(md).toContain('## Out-of-scope threats')
    expect(md).toContain('Library-only threat')
    expect(md).toContain('cyclonedx:in-scope=false')
  })
})

describe('suggestedReportFileName', () => {
  it('slugifies the system name', () => {
    const bom = emptyBom('Checkout API')
    expect(suggestedReportFileName(bom)).toBe('checkout-api-report.md')
  })
})
