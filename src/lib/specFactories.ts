import { bomRef } from './bom'
import type {
  AbuseCase,
  Assumption,
  AttackPath,
  BlueprintScope,
  BusinessObjective,
  Control,
  Requirement,
  ThreatProfile,
  TrustBoundary,
  UseCaseDefinition,
} from '../types/cyclonedx'

export function createControl(partial: Partial<Control> & { name: string }): Control {
  return { 'bom-ref': bomRef('control'), status: 'planned', ...partial }
}

export function createTrustBoundary(
  partial: Partial<TrustBoundary> & { boundary: string },
): TrustBoundary {
  return { 'bom-ref': bomRef('trust-boundary'), trustLevel: 'untrusted', ...partial }
}

export function createAttackPath(
  partial: Partial<AttackPath> & { name: string },
): AttackPath {
  return {
    'bom-ref': bomRef('attack-path'),
    steps: [],
    ...partial,
  }
}

export function createAbuseCase(
  partial: Partial<AbuseCase> & { name: string },
): AbuseCase {
  return { 'bom-ref': bomRef('abuse-case'), ...partial }
}

export function createAssumption(
  partial: Partial<Assumption> & { description: string },
): Assumption {
  return {
    'bom-ref': bomRef('assumption'),
    validity: 'unknown',
    topic: 'security',
    ...partial,
  }
}

export function createBlueprintScope(name = 'Model scope'): BlueprintScope {
  return { 'bom-ref': bomRef('scope'), name, description: '' }
}

export function createRequirement(
  partial: Partial<Requirement> & { name: string },
): Requirement {
  return { 'bom-ref': bomRef('requirement'), ...partial }
}

export function createBusinessObjective(
  partial: Partial<BusinessObjective> & { name: string },
): BusinessObjective {
  return { 'bom-ref': bomRef('objective'), ...partial }
}

export function createUseCaseDefinition(
  partial: Partial<UseCaseDefinition> & { name: string },
): UseCaseDefinition {
  return { 'bom-ref': bomRef('use-case'), ...partial }
}

export function createThreatProfile(
  partial: Partial<ThreatProfile> & { name?: string },
): ThreatProfile {
  return { 'bom-ref': bomRef('threat-profile'), ...partial }
}
