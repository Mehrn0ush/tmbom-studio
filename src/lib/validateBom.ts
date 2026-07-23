import type { CycloneDxBom } from '../types/cyclonedx'
import { getPrimaryBlueprint } from './bom'

export interface ValidationIssue {
  path: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  ok: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

/**
 * Lightweight structural validation for TM-BOM documents.
 * Full AJV against the evolving 2.0 bundled schema is CI-only;
 * the UI uses these checks so save/export fails early on broken docs.
 */
export function validateTmbom(raw: unknown): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      errors: [{ path: '/', message: 'Expected a JSON object', severity: 'error' }],
      warnings,
    }
  }

  const bom = raw as CycloneDxBom

  if (bom.specFormat !== 'CycloneDX') {
    errors.push({
      path: '/specFormat',
      message: 'Must be "CycloneDX"',
      severity: 'error',
    })
  }
  if (!bom.specVersion) {
    errors.push({
      path: '/specVersion',
      message: 'Missing specVersion',
      severity: 'error',
    })
  } else if (bom.specVersion !== '2.0') {
    warnings.push({
      path: '/specVersion',
      message: `Expected "2.0", found "${bom.specVersion}"`,
      severity: 'warning',
    })
  }

  if (!Array.isArray(bom.blueprints) || bom.blueprints.length === 0) {
    errors.push({
      path: '/blueprints',
      message: 'At least one blueprint is required',
      severity: 'error',
    })
  } else {
    bom.blueprints.forEach((bp, i) => {
      if (!bp.name) {
        errors.push({
          path: `/blueprints/${i}/name`,
          message: 'Blueprint name is required',
          severity: 'error',
        })
      }
      if (!bp.modelTypes?.length) {
        errors.push({
          path: `/blueprints/${i}/modelTypes`,
          message: 'modelTypes is required',
          severity: 'error',
        })
      }
      for (const [j, asset] of (bp.assets ?? []).entries()) {
        if (!asset['bom-ref']) {
          errors.push({
            path: `/blueprints/${i}/assets/${j}/bom-ref`,
            message: 'Asset bom-ref is required',
            severity: 'error',
          })
        }
      }
      for (const [j, flow] of (bp.flows ?? []).entries()) {
        if (!flow['bom-ref'] || !flow.name || !flow.source || !flow.destination) {
          errors.push({
            path: `/blueprints/${i}/flows/${j}`,
            message: 'Flow requires bom-ref, name, source, and destination',
            severity: 'error',
          })
        }
      }
    })
  }

  if (!bom.threats) {
    warnings.push({
      path: '/threats',
      message: 'No threats section yet',
      severity: 'warning',
    })
  } else {
    for (const [i, t] of (bom.threats.threats ?? []).entries()) {
      if (!t['bom-ref'] || !t.name) {
        errors.push({
          path: `/threats/threats/${i}`,
          message: 'Threat requires bom-ref and name',
          severity: 'error',
        })
      }
    }
    for (const [i, s] of (bom.threats.scenarios ?? []).entries()) {
      if (!s['bom-ref'] || !s.name || !s.threats?.length) {
        errors.push({
          path: `/threats/scenarios/${i}`,
          message: 'Scenario requires bom-ref, name, and threats[]',
          severity: 'error',
        })
      }
    }
  }

  if (!bom.risks) {
    warnings.push({
      path: '/risks',
      message: 'No risks section yet',
      severity: 'warning',
    })
  } else {
    for (const [i, r] of (bom.risks.risks ?? []).entries()) {
      if (!r['bom-ref'] || !r.name || !r.statement) {
        errors.push({
          path: `/risks/risks/${i}`,
          message: 'Risk requires bom-ref, name, and statement',
          severity: 'error',
        })
      }
    }
  }

  try {
    const bp = getPrimaryBlueprint(bom)
    if ((bp.assets?.length ?? 0) === 0) {
      warnings.push({
        path: '/blueprints/0/assets',
        message: 'Blueprint has no assets yet',
        severity: 'warning',
      })
    }
  } catch {
    /* ignore */
  }

  return { ok: errors.length === 0, errors, warnings }
}
