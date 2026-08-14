import type {
  LinddunCategory,
  RiskScoreLevel,
  StrideCategory,
  Threat,
} from '../types/cyclonedx'
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

export const LINDDUN_CATEGORIES: Array<{
  id: LinddunCategory
  label: string
  letter: string
  description: string
}> = [
  {
    id: 'linkability',
    label: 'Linkability',
    letter: 'L',
    description: 'Linking data items to learn more about an individual.',
  },
  {
    id: 'identifiability',
    label: 'Identifiability',
    letter: 'I',
    description: 'Identifying an individual from data.',
  },
  {
    id: 'non-repudiation',
    label: 'Non-repudiation',
    letter: 'N',
    description: 'Being unable to deny a claim, harming plausible deniability.',
  },
  {
    id: 'detectability',
    label: 'Detectability',
    letter: 'D',
    description: 'Detecting that an item of interest exists.',
  },
  {
    id: 'disclosure-of-information',
    label: 'Disclosure of information',
    letter: 'D2',
    description: 'Revealing personal data, violating confidentiality.',
  },
  {
    id: 'unawareness',
    label: 'Unawareness',
    letter: 'U',
    description: 'Individuals being unaware of the processing of their data.',
  },
  {
    id: 'non-compliance',
    label: 'Non-compliance',
    letter: 'N2',
    description: 'Deviating from policy, regulation, or best practice.',
  },
]

/** MITRE ATT&CK Enterprise tactics (CycloneDX MITRE-ATTACK threat categories) */
export const MITRE_ATTACK_CATEGORIES: Array<{
  id: string
  label: string
  letter: string
  description: string
}> = [
  { id: 'reconnaissance', label: 'Reconnaissance', letter: 'TA0043', description: 'Gather information to plan future operations.' },
  { id: 'resource-development', label: 'Resource Development', letter: 'TA0042', description: 'Establish resources to support operations.' },
  { id: 'initial-access', label: 'Initial Access', letter: 'TA0001', description: 'Gain an initial foothold.' },
  { id: 'execution', label: 'Execution', letter: 'TA0002', description: 'Run malicious code.' },
  { id: 'persistence', label: 'Persistence', letter: 'TA0003', description: 'Maintain foothold.' },
  { id: 'privilege-escalation', label: 'Privilege Escalation', letter: 'TA0004', description: 'Gain higher-level permissions.' },
  { id: 'defense-evasion', label: 'Defense Evasion', letter: 'TA0005', description: 'Avoid detection.' },
  { id: 'credential-access', label: 'Credential Access', letter: 'TA0006', description: 'Steal account credentials.' },
  { id: 'discovery', label: 'Discovery', letter: 'TA0007', description: 'Learn the environment.' },
  { id: 'lateral-movement', label: 'Lateral Movement', letter: 'TA0008', description: 'Move through the environment.' },
  { id: 'collection', label: 'Collection', letter: 'TA0009', description: 'Gather data of interest.' },
  { id: 'command-and-control', label: 'Command and Control', letter: 'TA0011', description: 'Communicate with compromised systems.' },
  { id: 'exfiltration', label: 'Exfiltration', letter: 'TA0010', description: 'Steal data.' },
  { id: 'impact', label: 'Impact', letter: 'TA0040', description: 'Manipulate, interrupt, or destroy systems/data.' },
]

/** Common CycloneDX external reference types for supply-chain linkage */
export const LINK_REFERENCE_TYPES = [
  { id: 'bom', label: 'BOM / SBOM', hint: 'Link to another CycloneDX BOM (often via BOM-Link URN)' },
  {
    id: 'vulnerability-assertion',
    label: 'VEX / vulnerability assertion',
    hint: 'Vulnerability Exploitability eXchange or similar assertion',
  },
  {
    id: 'adversary-model',
    label: 'Adversary model',
    hint: 'External adversary or threat-actor model',
  },
  {
    id: 'risk-assessment',
    label: 'Risk assessment',
    hint: 'Related risk assessment artifact',
  },
  {
    id: 'threat-model',
    label: 'Threat model',
    hint: 'Another threat model document',
  },
  {
    id: 'documentation',
    label: 'Documentation',
    hint: 'Design docs, ADRs, architecture notes',
  },
  { id: 'website', label: 'Website', hint: 'Product or security page' },
  { id: 'other', label: 'Other', hint: 'Custom reference' },
] as const


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

/** Suggest common LINDDUN privacy threats for an asset */
export function suggestLinddunThreats(
  assetName: string,
  assetRef: string,
): Threat[] {
  const base = (
    category: LinddunCategory,
    name: string,
    description: string,
  ): Threat => ({
    'bom-ref': bomRef('threat'),
    name,
    description,
    categories: [{ taxonomy: 'LINDDUN', category }],
    affectedAssets: [assetRef],
    source: 'ThreatModeler LINDDUN assistant',
  })

  return [
    base(
      'linkability',
      `Link identities via ${assetName}`,
      `Data flows through ${assetName} enable linking records to the same individual.`,
    ),
    base(
      'identifiability',
      `Identify individuals from ${assetName}`,
      `${assetName} exposes attributes that uniquely identify a person.`,
    ),
    base(
      'disclosure-of-information',
      `Disclose personal data from ${assetName}`,
      `Unauthorized parties obtain personal data processed by ${assetName}.`,
    ),
    base(
      'unawareness',
      `Process data in ${assetName} without notice`,
      `Individuals are not informed about processing performed by ${assetName}.`,
    ),
    base(
      'non-compliance',
      `Non-compliant processing in ${assetName}`,
      `${assetName} processing may violate policy or regulation.`,
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
