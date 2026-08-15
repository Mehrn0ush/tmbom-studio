/**
 * CycloneDX 2.0-dev-threatmodeling extended types.
 * Schema: /schemas/2.0/ (synced from specification @ 906c579)
 */
import type {
  ExternalReference,
  Property,
  RefLinkType,
  RefType,
} from './cyclonedx'

export type ThreatOrigin =
  | 'adversarial'
  | 'accidental'
  | 'structural'
  | 'environmental'
  | { name: string; description?: string }

export type TrustLevel =
  | 'untrusted'
  | 'semi-trusted'
  | 'trusted'
  | 'highly-trusted'

export type ControlCategory =
  | 'preventive'
  | 'detective'
  | 'corrective'
  | 'compensating'
  | 'deterrent'
  | 'recovery'
  | { name: string; description?: string }

export type ImplementationStatus =
  | 'planned'
  | 'in-progress'
  | 'implemented'
  | 'verified'
  | 'deprecated'
  | { name: string; description?: string }

export type RiskStatus =
  | 'identified'
  | 'assessed'
  | 'mitigated'
  | 'accepted'
  | 'transferred'
  | 'retired'
  | { name: string; description?: string }

export type AssumptionTopic =
  | 'availability'
  | 'business'
  | 'compliance'
  | 'operational'
  | 'performance'
  | 'security'
  | 'technical'
  | { name: string; description?: string }

export type AssumptionValidity =
  | 'invalid'
  | 'unknown'
  | 'unverified'
  | 'verified'

export interface PartyRef {
  ref?: RefLinkType
  name?: string
  description?: string
}

export interface BlueprintScope {
  'bom-ref'?: RefType
  name: string
  description?: string
  boundaries?: string[]
  includedComponents?: RefLinkType[]
  excludedComponents?: RefLinkType[]
  properties?: Property[]
}

export interface Assumption {
  'bom-ref'?: RefType
  description: string
  topic?: AssumptionTopic
  relatedAssets?: RefLinkType[]
  validity?: AssumptionValidity
  impact?: string
  owner?: PartyRef
  validationMethod?: string
  validationDate?: string
  properties?: Property[]
}

export interface Control {
  'bom-ref': RefType
  name: string
  description?: string
  category?: ControlCategory
  status?: ImplementationStatus
  appliesTo?: RefLinkType[]
  implementedBy?: RefLinkType[]
  satisfies?: RefLinkType[]
  owner?: PartyRef
  properties?: Property[]
  externalReferences?: ExternalReference[]
}

export interface TrustBoundary {
  'bom-ref': RefType
  boundary: RefLinkType
  name?: string
  description?: string
  trustLevel?: TrustLevel
  threatsAtBoundary?: RefLinkType[]
  controlsAtBoundary?: RefLinkType[]
  properties?: Property[]
}

export interface AttackPathStep {
  'bom-ref'?: RefType
  name?: string
  description: string
  /** ATT&CK (or similar) technique object — not a bom-ref string */
  technique?: import('./cyclonedx').AttackTechnique
  /** Link to threats.attackPatterns[] entry */
  attackPattern?: RefLinkType
  killChainPhase?: string
  source?: RefLinkType
  destination?: RefLinkType
  boundaryCrossed?: RefLinkType
  exploits?: RefLinkType[]
  mitigations?: RefLinkType[]
  properties?: Property[]
}

export interface AttackPath {
  'bom-ref': RefType
  name: string
  description?: string
  steps: AttackPathStep[]
  properties?: Property[]
}

export interface AbuseCaseStep {
  number?: number
  description: string
}

export interface AbuseCase {
  'bom-ref': RefType
  name: string
  description?: string
  abuser?: RefLinkType
  realizes?: RefLinkType[]
  targets?: RefLinkType[]
  mainFlow?: AbuseCaseStep[]
  properties?: Property[]
}

export interface Requirement {
  'bom-ref': RefType
  id?: string
  name: string
  description?: string
  priority?: string
  status?: string
  properties?: Property[]
}

export interface BusinessObjective {
  'bom-ref': RefType
  name: string
  description?: string
  criticality?: string
  properties?: Property[]
}

export interface UseCaseDefinition {
  'bom-ref': RefType
  name: string
  description?: string
  properties?: Property[]
}

export interface DefinitionsSection {
  standards?: unknown[]
  patents?: unknown[]
  useCases?: UseCaseDefinition[]
  requirements?: Requirement[]
  businessObjectives?: BusinessObjective[]
}

export interface ThreatProfile {
  'bom-ref': RefType
  name?: string
  description?: string
  sophistication?: string
  resources?: string
  skillSet?: string[]
  properties?: Property[]
}

export interface DataProfile {
  'bom-ref': RefType
  name: string
  description?: string
  properties?: Property[]
}

export interface ProfilesSection {
  dataProfiles?: DataProfile[]
  threatProfiles?: ThreatProfile[]
}

export interface RiskAssessment {
  'bom-ref'?: RefType
  name?: string
  scope?: string
  status?: string
  summary?: string
  assumptions?: string[]
  properties?: Property[]
}

export interface Component {
  'bom-ref'?: RefType
  type?: string
  name?: string
  version?: string
  description?: string
  scope?: 'required' | 'optional' | 'excluded'
  isExternal?: boolean
  properties?: Property[]
  externalReferences?: ExternalReference[]
}

/** Convention until spec adds a normative field (see ASF asf:in-scope) */
export const IN_SCOPE_PROPERTY = 'cyclonedx:in-scope'

export function readThreatInScope(
  properties?: Property[],
): boolean | undefined {
  const raw = properties?.find((p) => p.name === IN_SCOPE_PROPERTY)?.value
  if (raw === 'true') return true
  if (raw === 'false') return false
  const asf = properties?.find((p) => p.name === 'asf:in-scope')?.value
  if (asf === 'true') return true
  if (asf === 'false') return false
  return undefined
}

export function writeThreatInScope(
  properties: Property[] | undefined,
  inScope: boolean | undefined,
): Property[] | undefined {
  const rest = (properties ?? []).filter(
    (p) => p.name !== IN_SCOPE_PROPERTY && p.name !== 'asf:in-scope',
  )
  if (inScope === undefined) return rest.length ? rest : undefined
  return [...rest, { name: IN_SCOPE_PROPERTY, value: String(inScope) }]
}
