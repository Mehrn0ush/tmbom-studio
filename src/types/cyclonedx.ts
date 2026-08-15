/**
 * CycloneDX 2.0 threat-modeling types aligned with
 * https://github.com/CycloneDX/specification/tree/2.0-dev-threatmodeling/schema/2.0
 */

export type RefType = string
export type RefLinkType = string

export type SpecFormat = 'CycloneDX'

export type Methodology =
  | 'STRIDE'
  | 'LINDDUN'
  | 'PASTA'
  | 'MAESTRO'
  | 'OWASP'
  | 'TRIKE'
  | 'VAST'
  | 'ATFAA'
  | 'attack-tree'
  | { name: string; description?: string }

export type ModelType =
  | 'architecture'
  | 'behavioral'
  | 'conceptual'
  | 'data-flow'
  | 'deployment'
  | 'logical'
  | 'network'
  | 'operational'
  | 'physical'
  | 'process'

export type AssetType =
  | 'actor'
  | 'agent'
  | 'api'
  | 'broker'
  | 'cache'
  | 'component'
  | 'container'
  | 'data'
  | 'data-store'
  | 'device'
  | 'endpoint'
  | 'function'
  | 'gateway'
  | 'infrastructure'
  | 'interface'
  | 'model'
  | 'module'
  | 'network'
  | 'process'
  | 'queue'
  | 'resource'
  | 'service'
  | 'stream'
  | 'subsystem'
  | 'system'
  | 'tool'

export type ZoneType =
  | 'availability'
  | 'compliance'
  | 'data'
  | 'deployment'
  | 'functional'
  | 'geographic'
  | 'logical'
  | 'network'
  | 'organizational'
  | 'physical'
  | 'process'
  | 'tenant'
  | 'trust'

export type BoundaryType =
  | 'data'
  | 'functional'
  | 'network'
  | 'organizational'
  | 'physical'
  | 'process'
  | 'trust'

export type FlowType =
  | 'control'
  | 'data'
  | 'energy'
  | 'event'
  | 'financial'
  | 'message'
  | 'physical'
  | 'process'
  | 'signal'

export type StrideCategory =
  | 'spoofing'
  | 'tampering'
  | 'repudiation'
  | 'information-disclosure'
  | 'denial-of-service'
  | 'elevation-of-privilege'

export type LinddunCategory =
  | 'linkability'
  | 'identifiability'
  | 'non-repudiation'
  | 'detectability'
  | 'disclosure-of-information'
  | 'unawareness'
  | 'non-compliance'

export type ThreatTaxonomy = 'STRIDE' | 'LINDDUN' | 'MAESTRO' | 'MITRE-ATTACK'

export interface ThreatCategory {
  taxonomy: ThreatTaxonomy
  category: string
}

export type LikelihoodLevel =
  | 'very-low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very-high'
  | 'certain'

export type ImpactLevel =
  | 'negligible'
  | 'low'
  | 'moderate'
  | 'major'
  | 'catastrophic'

export type RiskScoreLevel = 'info' | 'low' | 'medium' | 'high' | 'critical'

export type RiskResponseStrategy =
  | 'avoid'
  | 'reduce'
  | 'transfer'
  | 'accept'
  | 'exploit'
  | 'enhance'

export type RiskDomainType =
  | 'security'
  | 'privacy'
  | 'operational'
  | 'financial'
  | 'compliance'
  | 'strategic'
  | 'reputational'
  | 'safety'
  | 'environmental'
  | 'supply-chain'
  | 'technical'
  | 'project'
  | 'ethical'
  | 'societal'
  | 'human-rights'
  | 'health'
  | 'legal'

export type Intent = 'accidental' | 'opportunistic' | 'targeted' | 'persistent'
export type AccessLevel = 'none' | 'external' | 'internal' | 'privileged' | 'physical'

export interface Likelihood {
  level: LikelihoodLevel
  score?: number
  probability?: number
  rationale?: string
}

export interface Impact {
  level: ImpactLevel
  polarity?: 'harm' | 'benefit'
  score?: number
  description?: string
}

export interface RiskScore {
  level: RiskScoreLevel
  score?: number
  vector?: string
  methodology?: string | { name: string; description?: string }
}

export interface Rating {
  likelihood?: Likelihood
  impact?: Impact
  score?: RiskScore
  confidence?: number
  rationale?: string
}

export interface Property {
  name: string
  value?: string
}

export interface ExternalReference {
  type: string
  url: string
  comment?: string
}

export interface DiagramPosition {
  x: number
  y: number
}

export type AttackTreeOperator = 'and' | 'or'
export type AttackTreeCost =
  | 'negligible'
  | 'low'
  | 'moderate'
  | 'high'
  | 'prohibitive'
export type AttackTreeSkill =
  | 'none'
  | 'basic'
  | 'intermediate'
  | 'advanced'
  | 'expert'

export interface AttackTreeNode {
  'bom-ref': RefType
  name: string
  description?: string
  operator?: AttackTreeOperator
  children?: RefLinkType[]
  cost?: AttackTreeCost
  skill?: AttackTreeSkill
  mitigations?: RefLinkType[]
}

export interface AttackTree {
  'bom-ref': RefType
  name?: string
  description?: string
  root?: RefLinkType
  nodes: AttackTreeNode[]
}

export interface Asset {
  'bom-ref': RefType
  name?: string
  description?: string
  type?: AssetType | { name: string; description?: string }
  zone?: RefLinkType
  componentRef?: RefLinkType
  partyRef?: RefLinkType
  responsibilities?: string[]
  tags?: string[]
  properties?: Property[]
  externalReferences?: ExternalReference[]
  /** Tool-local layout (exported under properties) */
  _position?: DiagramPosition
}

export interface Zone {
  'bom-ref': RefType
  name: string
  description?: string
  type: ZoneType | { name: string; description?: string }
  parent?: RefLinkType
  properties?: Property[]
}

export interface Boundary {
  'bom-ref': RefType
  name?: string
  type?: BoundaryType | { name: string; description?: string }
  zones: RefLinkType[]
  properties?: Property[]
}

export interface Flow {
  'bom-ref': RefType
  name: string
  description?: string
  type: FlowType | { name: string; description?: string }
  source: RefLinkType
  destination: RefLinkType
  bidirectional?: boolean
  encrypted?: boolean
  protocols?: string[]
  sequence?: number
  properties?: Property[]
}

export interface ActorParty {
  name: string
  description?: string
}

export interface Actor {
  'bom-ref': RefType
  party: ActorParty | { ref: RefLinkType }
  description?: string
  zone?: RefLinkType
  properties?: Property[]
  _position?: DiagramPosition
}

export interface Blueprint {
  'bom-ref'?: RefType
  name: string
  description?: string
  modelTypes: ModelType[]
  scope?: import('./cyclonedx-extended').BlueprintScope
  assets?: Asset[]
  zones?: Zone[]
  boundaries?: Boundary[]
  flows?: Flow[]
  actors?: Actor[]
  assumptions?: import('./cyclonedx-extended').Assumption[]
  properties?: Property[]
  externalReferences?: ExternalReference[]
}

export type ThreatOrigin =
  import('./cyclonedx-extended').ThreatOrigin

export interface Threat {
  'bom-ref': RefType
  name: string
  description?: string
  source?: string
  origin?: ThreatOrigin
  categories?: ThreatCategory[]
  weaknesses?: Array<{ 'bom-ref'?: RefType; name?: string; description?: string; cweId?: number }>
  relatedVulnerabilities?: RefLinkType[]
  affectedAssets?: RefLinkType[]
  attackPatterns?: RefLinkType[]
  attackTrees?: RefLinkType[]
  abuseCases?: RefLinkType[]
  killChainPhase?: string
  relatedBusinessObjectives?: RefLinkType[]
  mitigations?: RefLinkType[]
  properties?: Property[]
  externalReferences?: ExternalReference[]
}

export interface AttackTechnique {
  id?: string
  name?: string
  tactic?: string
  procedure?: string
}

export interface AttackPattern {
  'bom-ref': RefType
  name: string
  description?: string
  capecId?: number
  prerequisites?: string[]
  techniques?: AttackTechnique[]
  mitigations?: RefLinkType[]
  examples?: string[]
}

export interface ThreatScenario {
  'bom-ref': RefType
  name: string
  description?: string
  threats: RefLinkType[]
  actor?: RefLinkType
  threatProfile?: RefLinkType
  motivation?: string[]
  intent?: Intent
  accessLevel?: AccessLevel
  attackVector?: {
    type?: 'network' | 'adjacent' | 'local' | 'physical'
    complexity?: 'low' | 'high'
  }
  likelihood?: Likelihood
  impact?: Impact
  riskScore?: RiskScore
  affectedAssets?: RefLinkType[]
  relatedRisks?: RefLinkType[]
  relatedVulnerabilities?: RefLinkType[]
  properties?: Property[]
  externalReferences?: ExternalReference[]
}

export interface RiskResponse {
  'bom-ref': RefType
  strategy: RiskResponseStrategy
  description?: string
  cost?: 'trivial' | 'low' | 'medium' | 'high' | 'extreme'
  controls?: RefLinkType[]
  addresses?: RefLinkType[]
  status?: string
  properties?: Property[]
}

export interface Risk {
  'bom-ref': RefType
  name: string
  statement: string
  description?: string
  domains?: Array<{ type: RiskDomainType | { name: string } }>
  relatedThreats?: RefLinkType[]
  relatedVulnerabilities?: RefLinkType[]
  relatedRequirements?: RefLinkType[]
  relatedBusinessObjectives?: RefLinkType[]
  affects?: RefLinkType[]
  inherentRisk?: Rating
  residualRisk?: Rating
  targetRisk?: Rating
  responses?: RiskResponse[]
  status?: import('./cyclonedx-extended').RiskStatus
  owner?: import('./cyclonedx-extended').PartyRef
  properties?: Property[]
}

export interface ThreatsSection {
  threats?: Threat[]
  scenarios?: ThreatScenario[]
  attackPatterns?: AttackPattern[]
  attackTrees?: AttackTree[]
  attackPaths?: import('./cyclonedx-extended').AttackPath[]
  abuseCases?: import('./cyclonedx-extended').AbuseCase[]
  trustBoundaries?: import('./cyclonedx-extended').TrustBoundary[]
  methodologies?: Methodology[]
  properties?: Property[]
}

export interface RisksSection {
  risks?: Risk[]
  assessments?: import('./cyclonedx-extended').RiskAssessment[]
  properties?: Property[]
}

export interface BomMetadata {
  timestamp?: string
  component?: {
    type?: string
    name?: string
    version?: string
    'bom-ref'?: string
  }
  authors?: Array<{ name?: string; email?: string }>
  tools?: {
    components?: Array<{
      type?: string
      name?: string
      version?: string
    }>
  }
}

export interface CycloneDxBom {
  $schema?: string
  $comment?: string
  specFormat: SpecFormat
  specVersion: string
  serialNumber?: string
  version?: number
  metadata?: BomMetadata
  components?: import('./cyclonedx-extended').Component[]
  services?: unknown[]
  dependencies?: unknown[]
  compositions?: unknown[]
  vulnerabilities?: unknown[]
  blueprints?: Blueprint[]
  threats?: ThreatsSection
  risks?: RisksSection
  controls?: import('./cyclonedx-extended').Control[]
  definitions?: import('./cyclonedx-extended').DefinitionsSection
  profiles?: import('./cyclonedx-extended').ProfilesSection
  annotations?: unknown[]
  formulation?: unknown
  declarations?: unknown
  citations?: unknown[]
  perspectives?: unknown[]
  properties?: Property[]
  externalReferences?: ExternalReference[]
  signatures?: unknown
}

export type WorkspaceView =
  | 'overview'
  | 'blueprint'
  | 'assumptions'
  | 'threats'
  | 'scenarios'
  | 'attack-patterns'
  | 'attack-trees'
  | 'attack-paths'
  | 'abuse-cases'
  | 'trust-boundaries'
  | 'controls'
  | 'definitions'
  | 'profiles'
  | 'risks'
  | 'components'
  | 'session'
  | 'links'
  | 'report'
  | 'advanced'
  | 'export'

export type {
  Assumption,
  AttackPath,
  AttackPathStep,
  AbuseCase,
  BlueprintScope,
  BusinessObjective,
  Component,
  Control,
  DataProfile,
  DefinitionsSection,
  ProfilesSection,
  Requirement,
  RiskStatus,
  ThreatProfile,
  TrustBoundary,
  UseCaseDefinition,
} from './cyclonedx-extended'

export {
  IN_SCOPE_PROPERTY,
  readThreatInScope,
  writeThreatInScope,
} from './cyclonedx-extended'
