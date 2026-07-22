import type { RiskScoreLevel, StrideCategory, Threat } from '../types/cyclonedx'
import { bomRef } from './bom'

export const STRIDE_CATEGORIES: Array<{
  id: StrideCategory
  label: string
  letter: string
  description: string
}> = [
  {
    id: 'spoofing',
    label: 'Spoofing',
    letter: 'S',
    description: 'Impersonating something or someone, violating authenticity.',
  },
  {
    id: 'tampering',
    label: 'Tampering',
    letter: 'T',
    description: 'Modifying data or code, violating integrity.',
  },
  {
    id: 'repudiation',
    label: 'Repudiation',
    letter: 'R',
    description: 'Denying having performed an action, violating non-repudiation.',
  },
  {
    id: 'information-disclosure',
    label: 'Information Disclosure',
    letter: 'I',
    description: 'Exposing information to unauthorized parties.',
  },
  {
    id: 'denial-of-service',
    label: 'Denial of Service',
    letter: 'D',
    description: 'Denying or degrading service to legitimate users.',
  },
  {
    id: 'elevation-of-privilege',
    label: 'Elevation of Privilege',
    letter: 'E',
    description: 'Gaining capabilities without proper authorization.',
  },
]

export const ASSET_TYPES = [
  'actor',
  'agent',
  'api',
  'broker',
  'cache',
  'component',
  'container',
  'data',
  'data-store',
  'device',
  'endpoint',
  'function',
  'gateway',
  'infrastructure',
  'interface',
  'model',
  'module',
  'network',
  'process',
  'queue',
  'resource',
  'service',
  'stream',
  'subsystem',
  'system',
  'tool',
] as const

export const ZONE_TYPES = [
  'trust',
  'network',
  'data',
  'deployment',
  'logical',
  'physical',
  'compliance',
  'organizational',
] as const

export const FLOW_TYPES = [
  'data',
  'control',
  'message',
  'event',
  'process',
  'signal',
] as const

export const LIKELIHOOD_LEVELS = [
  'very-low',
  'low',
  'medium',
  'high',
  'very-high',
  'certain',
] as const

export const IMPACT_LEVELS = [
  'negligible',
  'low',
  'moderate',
  'major',
  'catastrophic',
] as const

export const RISK_SCORE_LEVELS = [
  'info',
  'low',
  'medium',
  'high',
  'critical',
] as const

export const RESPONSE_STRATEGIES = [
  'avoid',
  'reduce',
  'transfer',
  'accept',
  'exploit',
  'enhance',
] as const

const LIKELIHOOD_WEIGHT: Record<string, number> = {
  'very-low': 1,
  low: 2,
  medium: 3,
  high: 4,
  'very-high': 5,
  certain: 6,
}

const IMPACT_WEIGHT: Record<string, number> = {
  negligible: 1,
  low: 2,
  moderate: 3,
  major: 4,
  catastrophic: 5,
}

export function computeRiskLevel(
  likelihood?: string,
  impact?: string,
): RiskScoreLevel {
  const l = LIKELIHOOD_WEIGHT[likelihood ?? ''] ?? 0
  const i = IMPACT_WEIGHT[impact ?? ''] ?? 0
  const product = l * i
  if (product <= 2) return 'info'
  if (product <= 6) return 'low'
  if (product <= 12) return 'medium'
  if (product <= 20) return 'high'
  return 'critical'
}

/** Suggest common STRIDE threats for an asset type */
export function suggestStrideThreats(
  assetName: string,
  assetRef: string,
): Threat[] {
  const base = (category: StrideCategory, name: string, description: string): Threat => ({
    'bom-ref': bomRef('threat'),
    name,
    description,
    categories: [{ taxonomy: 'STRIDE', category }],
    affectedAssets: [assetRef],
    source: 'ThreatModeler STRIDE assistant',
  })

  return [
    base(
      'spoofing',
      `Spoof ${assetName} identity`,
      `An attacker impersonates ${assetName} or a trusted principal that interacts with it.`,
    ),
    base(
      'tampering',
      `Tamper with ${assetName} data or configuration`,
      `An attacker modifies inputs, stored data, or configuration of ${assetName}.`,
    ),
    base(
      'repudiation',
      `Repudiate actions against ${assetName}`,
      `Actors deny performing actions involving ${assetName} due to insufficient audit trails.`,
    ),
    base(
      'information-disclosure',
      `Disclose data from ${assetName}`,
      `Sensitive information processed or stored by ${assetName} is exposed to unauthorized parties.`,
    ),
    base(
      'denial-of-service',
      `Deny service via ${assetName}`,
      `${assetName} is overwhelmed or disabled, reducing availability for legitimate users.`,
    ),
    base(
      'elevation-of-privilege',
      `Elevate privilege through ${assetName}`,
      `An attacker gains unauthorized capabilities by abusing ${assetName}.`,
    ),
  ]
}

export function riskLevelColor(level?: string): string {
  switch (level) {
    case 'critical':
      return 'var(--risk-critical)'
    case 'high':
      return 'var(--risk-high)'
    case 'medium':
      return 'var(--risk-medium)'
    case 'low':
      return 'var(--risk-low)'
    default:
      return 'var(--risk-info)'
  }
}
