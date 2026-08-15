import type { StateCreator } from 'zustand'
import type {
  AbuseCase,
  Assumption,
  AttackPath,
  AttackPathStep,
  BlueprintScope,
  BusinessObjective,
  Component,
  Control,
  CycloneDxBom,
  DataProfile,
  Requirement,
  ThreatProfile,
  TrustBoundary,
  UseCaseDefinition,
} from '../types/cyclonedx'
import { bomRef, getPrimaryBlueprint } from '../lib/bom'
import {
  createAbuseCase,
  createAssumption,
  createAttackPath,
  createBlueprintScope,
  createBusinessObjective,
  createControl,
  createDataProfile,
  createRequirement,
  createThreatProfile,
  createTrustBoundary,
  createUseCaseDefinition,
} from '../lib/specFactories'
import { bumpVersion } from './bomMutations'
import type { StoreHost } from './storeTypes'

export interface SpecStoreSlice {
  addControl: (partial: Partial<Control> & { name: string }) => string
  updateControl: (ref: string, patch: Partial<Control>) => void
  removeControl: (ref: string) => void
  addTrustBoundary: (
    partial: Partial<TrustBoundary> & { boundary: string },
  ) => string
  updateTrustBoundary: (ref: string, patch: Partial<TrustBoundary>) => void
  removeTrustBoundary: (ref: string) => void
  addAttackPath: (partial: Partial<AttackPath> & { name: string }) => string
  updateAttackPath: (ref: string, patch: Partial<AttackPath>) => void
  removeAttackPath: (ref: string) => void
  addAttackPathStep: (pathRef: string, step: AttackPathStep) => void
  addAbuseCase: (partial: Partial<AbuseCase> & { name: string }) => string
  updateAbuseCase: (ref: string, patch: Partial<AbuseCase>) => void
  removeAbuseCase: (ref: string) => void
  addAssumption: (partial: Partial<Assumption> & { description: string }) => string
  updateAssumption: (ref: string, patch: Partial<Assumption>) => void
  removeAssumption: (ref: string) => void
  updateBlueprintScope: (patch: Partial<BlueprintScope>) => void
  addRequirement: (partial: Partial<Requirement> & { name: string }) => string
  updateRequirement: (ref: string, patch: Partial<Requirement>) => void
  removeRequirement: (ref: string) => void
  addBusinessObjective: (
    partial: Partial<BusinessObjective> & { name: string },
  ) => string
  updateBusinessObjective: (
    ref: string,
    patch: Partial<BusinessObjective>,
  ) => void
  removeBusinessObjective: (ref: string) => void
  addUseCaseDefinition: (
    partial: Partial<UseCaseDefinition> & { name: string },
  ) => string
  updateUseCaseDefinition: (
    ref: string,
    patch: Partial<UseCaseDefinition>,
  ) => void
  removeUseCaseDefinition: (ref: string) => void
  addThreatProfile: (partial: Partial<ThreatProfile>) => string
  updateThreatProfile: (ref: string, patch: Partial<ThreatProfile>) => void
  removeThreatProfile: (ref: string) => void
  addDataProfile: (partial: Partial<DataProfile> & { name: string }) => string
  updateDataProfile: (ref: string, patch: Partial<DataProfile>) => void
  removeDataProfile: (ref: string) => void
  setDefinitionCatalog: (
    key: 'standards' | 'patents',
    items: Array<{ 'bom-ref': string; name: string; description?: string }>,
  ) => void
  addComponent: (partial: Partial<Component> & { name: string }) => string
  updateComponent: (ref: string, patch: Partial<Component>) => void
  removeComponent: (ref: string) => void
  updateAdvancedSection: (
    key:
      | 'services'
      | 'dependencies'
      | 'compositions'
      | 'vulnerabilities'
      | 'annotations'
      | 'citations'
      | 'perspectives'
      | 'formulation'
      | 'declarations',
    value: unknown,
  ) => void
}

/** @deprecated Use StoreHost from storeTypes — kept for existing imports. */
export type SpecStoreHost = StoreHost & SpecStoreSlice

export const createSpecStoreSlice: StateCreator<
  StoreHost & SpecStoreSlice,
  [],
  [],
  SpecStoreSlice
> = (set, _get) => ({
  addControl: (partial) => {
    const control = createControl(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.controls = [...(bom.controls ?? []), control]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: control['bom-ref'] }
    })
    return control['bom-ref']
  },
  updateControl: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.controls = (bom.controls ?? []).map((c) =>
        c['bom-ref'] === ref ? { ...c, ...patch } : c,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeControl: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.controls = (bom.controls ?? []).filter((c) => c['bom-ref'] !== ref)
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addTrustBoundary: (partial) => {
    const tb = createTrustBoundary(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.threats ??= {}
      bom.threats.trustBoundaries = [...(bom.threats.trustBoundaries ?? []), tb]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: tb['bom-ref'] }
    })
    return tb['bom-ref']
  },
  updateTrustBoundary: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats?.trustBoundaries) return s
      bom.threats.trustBoundaries = bom.threats.trustBoundaries.map((t) =>
        t['bom-ref'] === ref ? { ...t, ...patch } : t,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeTrustBoundary: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats) return s
      bom.threats.trustBoundaries = (bom.threats.trustBoundaries ?? []).filter(
        (t) => t['bom-ref'] !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addAttackPath: (partial) => {
    const path = createAttackPath(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.threats ??= {}
      bom.threats.attackPaths = [...(bom.threats.attackPaths ?? []), path]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: path['bom-ref'] }
    })
    return path['bom-ref']
  },
  updateAttackPath: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats?.attackPaths) return s
      bom.threats.attackPaths = bom.threats.attackPaths.map((p) =>
        p['bom-ref'] === ref ? { ...p, ...patch } : p,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeAttackPath: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats) return s
      bom.threats.attackPaths = (bom.threats.attackPaths ?? []).filter(
        (p) => p['bom-ref'] !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),
  addAttackPathStep: (pathRef, step) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats?.attackPaths) return s
      bom.threats.attackPaths = bom.threats.attackPaths.map((p) =>
        p['bom-ref'] === pathRef
          ? {
              ...p,
              steps: [
                ...p.steps,
                { ...step, 'bom-ref': step['bom-ref'] ?? bomRef('path-step') },
              ],
            }
          : p,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),

  addAbuseCase: (partial) => {
    const ac = createAbuseCase(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.threats ??= {}
      bom.threats.abuseCases = [...(bom.threats.abuseCases ?? []), ac]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: ac['bom-ref'] }
    })
    return ac['bom-ref']
  },
  updateAbuseCase: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats?.abuseCases) return s
      bom.threats.abuseCases = bom.threats.abuseCases.map((a) =>
        a['bom-ref'] === ref ? { ...a, ...patch } : a,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeAbuseCase: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats) return s
      bom.threats.abuseCases = (bom.threats.abuseCases ?? []).filter(
        (a) => a['bom-ref'] !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addAssumption: (partial) => {
    const assumption = createAssumption(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      const bp = getPrimaryBlueprint(bom)
      bp.assumptions = [...(bp.assumptions ?? []), assumption]
      if (!bp.scope) bp.scope = createBlueprintScope()
      bumpVersion(bom)
      return { ...s, bom, selectedRef: assumption['bom-ref']! }
    })
    return assumption['bom-ref']!
  },
  updateAssumption: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      const bp = getPrimaryBlueprint(bom)
      if (!bp.assumptions) return s
      bp.assumptions = bp.assumptions.map((a) =>
        a['bom-ref'] === ref ? { ...a, ...patch } : a,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeAssumption: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      const bp = getPrimaryBlueprint(bom)
      bp.assumptions = (bp.assumptions ?? []).filter(
        (a) => a['bom-ref'] !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),
  updateBlueprintScope: (patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      const bp = getPrimaryBlueprint(bom)
      bp.scope = { ...(bp.scope ?? createBlueprintScope()), ...patch }
      bumpVersion(bom)
      return { ...s, bom }
    }),

  addRequirement: (partial) => {
    const req = createRequirement(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.definitions ??= {}
      bom.definitions.requirements = [
        ...(bom.definitions.requirements ?? []),
        req,
      ]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: req['bom-ref'] }
    })
    return req['bom-ref']
  },
  updateRequirement: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.definitions?.requirements) return s
      bom.definitions.requirements = bom.definitions.requirements.map((r) =>
        r['bom-ref'] === ref ? { ...r, ...patch } : r,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeRequirement: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.definitions) return s
      bom.definitions.requirements = (
        bom.definitions.requirements ?? []
      ).filter((r) => r['bom-ref'] !== ref)
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addBusinessObjective: (partial) => {
    const obj = createBusinessObjective(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.definitions ??= {}
      bom.definitions.businessObjectives = [
        ...(bom.definitions.businessObjectives ?? []),
        obj,
      ]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: obj['bom-ref'] }
    })
    return obj['bom-ref']
  },
  updateBusinessObjective: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.definitions?.businessObjectives) return s
      bom.definitions.businessObjectives =
        bom.definitions.businessObjectives.map((o) =>
          o['bom-ref'] === ref ? { ...o, ...patch } : o,
        )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeBusinessObjective: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.definitions) return s
      bom.definitions.businessObjectives = (
        bom.definitions.businessObjectives ?? []
      ).filter((o) => o['bom-ref'] !== ref)
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addUseCaseDefinition: (partial) => {
    const uc = createUseCaseDefinition(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.definitions ??= {}
      bom.definitions.useCases = [...(bom.definitions.useCases ?? []), uc]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: uc['bom-ref'] }
    })
    return uc['bom-ref']
  },
  updateUseCaseDefinition: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.definitions?.useCases) return s
      bom.definitions.useCases = bom.definitions.useCases.map((u) =>
        u['bom-ref'] === ref ? { ...u, ...patch } : u,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeUseCaseDefinition: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.definitions) return s
      bom.definitions.useCases = (bom.definitions.useCases ?? []).filter(
        (u) => u['bom-ref'] !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addThreatProfile: (partial) => {
    const profile = createThreatProfile(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.profiles ??= {}
      bom.profiles.threatProfiles = [
        ...(bom.profiles.threatProfiles ?? []),
        profile,
      ]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: profile['bom-ref'] }
    })
    return profile['bom-ref']
  },
  updateThreatProfile: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.profiles?.threatProfiles) return s
      bom.profiles.threatProfiles = bom.profiles.threatProfiles.map((p) =>
        p['bom-ref'] === ref ? { ...p, ...patch } : p,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeThreatProfile: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.profiles) return s
      bom.profiles.threatProfiles = (bom.profiles.threatProfiles ?? []).filter(
        (p) => p['bom-ref'] !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addDataProfile: (partial) => {
    const profile = createDataProfile(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.profiles ??= {}
      bom.profiles.dataProfiles = [
        ...(bom.profiles.dataProfiles ?? []),
        profile,
      ]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: profile['bom-ref'] }
    })
    return profile['bom-ref']
  },
  updateDataProfile: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.profiles?.dataProfiles) return s
      bom.profiles.dataProfiles = bom.profiles.dataProfiles.map((p) =>
        p['bom-ref'] === ref ? { ...p, ...patch } : p,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeDataProfile: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.profiles) return s
      bom.profiles.dataProfiles = (bom.profiles.dataProfiles ?? []).filter(
        (p) => p['bom-ref'] !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  setDefinitionCatalog: (key, items) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.definitions ??= {}
      bom.definitions[key] = items
      bumpVersion(bom)
      return { ...s, bom }
    }),

  addComponent: (partial) => {
    const component: Component = {
      'bom-ref': bomRef('component'),
      type: 'library',
      scope: 'required',
      ...partial,
    }
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.components = [...(bom.components ?? []), component]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: component['bom-ref']! }
    })
    return component['bom-ref']!
  },
  updateComponent: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.components = (bom.components ?? []).map((c) =>
        c['bom-ref'] === ref ? { ...c, ...patch } : c,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),
  removeComponent: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.components = (bom.components ?? []).filter(
        (c) => c['bom-ref'] !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  updateAdvancedSection: (key, value) =>
    set((s) => {
      const bom = structuredClone(s.bom) as CycloneDxBom &
        Record<string, unknown>
      bom[key] = value as never
      bumpVersion(bom)
      return { ...s, bom }
    }),
})
