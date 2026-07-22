import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Asset,
  Blueprint,
  Boundary,
  CycloneDxBom,
  Flow,
  Risk,
  Threat,
  ThreatScenario,
  WorkspaceView,
  Zone,
} from '../types/cyclonedx'
import {
  createAsset,
  createBoundary,
  createFlow,
  createRisk,
  createScenario,
  createThreat,
  createZone,
  emptyBom,
  fromImportBom,
  getPrimaryBlueprint,
  toExportBom,
} from '../lib/bom'
import { createSampleBom } from '../lib/sample'
import { suggestStrideThreats } from '../lib/catalog'

interface ThreatModelState {
  bom: CycloneDxBom
  view: WorkspaceView
  selectedRef: string | null
  setView: (view: WorkspaceView) => void
  setSelectedRef: (ref: string | null) => void
  newModel: (name?: string) => void
  loadSample: () => void
  importBom: (raw: unknown) => void
  exportBom: () => CycloneDxBom
  updateMetadataName: (name: string) => void
  updateBlueprint: (patch: Partial<Blueprint>) => void
  addAsset: (partial: Partial<Asset> & { name: string }) => string
  updateAsset: (ref: string, patch: Partial<Asset>) => void
  removeAsset: (ref: string) => void
  addZone: (partial: Partial<Zone> & { name: string }) => string
  updateZone: (ref: string, patch: Partial<Zone>) => void
  removeZone: (ref: string) => void
  addBoundary: (partial: Partial<Boundary> & { zones: string[] }) => string
  removeBoundary: (ref: string) => void
  addFlow: (
    partial: Partial<Flow> & {
      name: string
      source: string
      destination: string
    },
  ) => string
  updateFlow: (ref: string, patch: Partial<Flow>) => void
  removeFlow: (ref: string) => void
  addThreat: (partial: Partial<Threat> & { name: string }) => string
  updateThreat: (ref: string, patch: Partial<Threat>) => void
  removeThreat: (ref: string) => void
  suggestThreatsForAsset: (assetRef: string) => number
  addScenario: (
    partial: Partial<ThreatScenario> & { name: string; threats: string[] },
  ) => string
  updateScenario: (ref: string, patch: Partial<ThreatScenario>) => void
  removeScenario: (ref: string) => void
  addRisk: (
    partial: Partial<Risk> & { name: string; statement: string },
  ) => string
  updateRisk: (ref: string, patch: Partial<Risk>) => void
  removeRisk: (ref: string) => void
}

function mutateBlueprint(
  bom: CycloneDxBom,
  fn: (bp: NonNullable<CycloneDxBom['blueprints']>[number]) => void,
): CycloneDxBom {
  const next = structuredClone(bom)
  fn(getPrimaryBlueprint(next))
  bumpVersion(next)
  return next
}

function bumpVersion(bom: CycloneDxBom) {
  bom.version = (bom.version ?? 1) + 1
  if (bom.metadata) {
    bom.metadata.timestamp = new Date().toISOString()
  }
}

export const useThreatModelStore = create<ThreatModelState>()(
  persist(
    (set, get) => ({
      bom: emptyBom('Untitled System'),
      view: 'overview',
      selectedRef: null,

      setView: (view) => set({ view }),
      setSelectedRef: (selectedRef) => set({ selectedRef }),

      newModel: (name) =>
        set({
          bom: emptyBom(name ?? 'Untitled System'),
          selectedRef: null,
          view: 'overview',
        }),

      loadSample: () =>
        set({
          bom: createSampleBom(),
          selectedRef: null,
          view: 'overview',
        }),

      importBom: (raw) =>
        set({
          bom: fromImportBom(raw),
          selectedRef: null,
          view: 'overview',
        }),

      exportBom: () => toExportBom(get().bom),

      updateMetadataName: (name) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          if (bom.metadata?.component) bom.metadata.component.name = name
          const bp = getPrimaryBlueprint(bom)
          bp.name = `${name} Architecture`
          bumpVersion(bom)
          return { bom }
        }),

      updateBlueprint: (patch) =>
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => Object.assign(bp, patch)),
        })),

      addAsset: (partial) => {
        const asset = createAsset(partial)
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.assets = [...(bp.assets ?? []), asset]
          }),
          selectedRef: asset['bom-ref'],
        }))
        return asset['bom-ref']
      },

      updateAsset: (ref, patch) =>
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.assets = (bp.assets ?? []).map((a) =>
              a['bom-ref'] === ref ? { ...a, ...patch } : a,
            )
          }),
        })),

      removeAsset: (ref) =>
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.assets = (bp.assets ?? []).filter((a) => a['bom-ref'] !== ref)
            bp.flows = (bp.flows ?? []).filter(
              (f) => f.source !== ref && f.destination !== ref,
            )
          }),
          selectedRef: get().selectedRef === ref ? null : get().selectedRef,
        })),

      addZone: (partial) => {
        const zone = createZone(partial)
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.zones = [...(bp.zones ?? []), zone]
          }),
        }))
        return zone['bom-ref']
      },

      updateZone: (ref, patch) =>
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.zones = (bp.zones ?? []).map((z) =>
              z['bom-ref'] === ref ? { ...z, ...patch } : z,
            )
          }),
        })),

      removeZone: (ref) =>
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.zones = (bp.zones ?? []).filter((z) => z['bom-ref'] !== ref)
            bp.assets = (bp.assets ?? []).map((a) =>
              a.zone === ref ? { ...a, zone: undefined } : a,
            )
            bp.boundaries = (bp.boundaries ?? [])
              .map((b) => ({
                ...b,
                zones: b.zones.filter((z) => z !== ref),
              }))
              .filter((b) => b.zones.length >= 1)
          }),
        })),

      addBoundary: (partial) => {
        const boundary = createBoundary(partial)
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.boundaries = [...(bp.boundaries ?? []), boundary]
          }),
        }))
        return boundary['bom-ref']
      },

      removeBoundary: (ref) =>
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.boundaries = (bp.boundaries ?? []).filter(
              (b) => b['bom-ref'] !== ref,
            )
          }),
        })),

      addFlow: (partial) => {
        const flow = createFlow(partial)
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.flows = [...(bp.flows ?? []), flow]
          }),
          selectedRef: flow['bom-ref'],
        }))
        return flow['bom-ref']
      },

      updateFlow: (ref, patch) =>
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.flows = (bp.flows ?? []).map((f) =>
              f['bom-ref'] === ref ? { ...f, ...patch } : f,
            )
          }),
        })),

      removeFlow: (ref) =>
        set((s) => ({
          bom: mutateBlueprint(s.bom, (bp) => {
            bp.flows = (bp.flows ?? []).filter((f) => f['bom-ref'] !== ref)
          }),
          selectedRef: get().selectedRef === ref ? null : get().selectedRef,
        })),

      addThreat: (partial) => {
        const threat = createThreat(partial)
        set((s) => {
          const bom = structuredClone(s.bom)
          bom.threats ??= { methodologies: ['STRIDE'], threats: [], scenarios: [] }
          bom.threats.threats = [...(bom.threats.threats ?? []), threat]
          bumpVersion(bom)
          return { bom, selectedRef: threat['bom-ref'] }
        })
        return threat['bom-ref']
      },

      updateThreat: (ref, patch) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          if (!bom.threats?.threats) return s
          bom.threats.threats = bom.threats.threats.map((t) =>
            t['bom-ref'] === ref ? { ...t, ...patch } : t,
          )
          bumpVersion(bom)
          return { bom }
        }),

      removeThreat: (ref) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          if (!bom.threats) return s
          bom.threats.threats = (bom.threats.threats ?? []).filter(
            (t) => t['bom-ref'] !== ref,
          )
          bom.threats.scenarios = (bom.threats.scenarios ?? [])
            .map((sc) => ({
              ...sc,
              threats: sc.threats.filter((t) => t !== ref),
            }))
            .filter((sc) => sc.threats.length > 0)
          bumpVersion(bom)
          return {
            bom,
            selectedRef: get().selectedRef === ref ? null : get().selectedRef,
          }
        }),

      suggestThreatsForAsset: (assetRef) => {
        const bp = getPrimaryBlueprint(get().bom)
        const asset = bp.assets?.find((a) => a['bom-ref'] === assetRef)
        if (!asset?.name) return 0
        const suggested = suggestStrideThreats(asset.name, assetRef)
        set((s) => {
          const bom = structuredClone(s.bom)
          bom.threats ??= { methodologies: ['STRIDE'], threats: [], scenarios: [] }
          bom.threats.threats = [...(bom.threats.threats ?? []), ...suggested]
          bumpVersion(bom)
          return { bom, view: 'threats' }
        })
        return suggested.length
      },

      addScenario: (partial) => {
        const scenario = createScenario(partial)
        set((s) => {
          const bom = structuredClone(s.bom)
          bom.threats ??= { methodologies: ['STRIDE'], threats: [], scenarios: [] }
          bom.threats.scenarios = [...(bom.threats.scenarios ?? []), scenario]
          bumpVersion(bom)
          return { bom, selectedRef: scenario['bom-ref'] }
        })
        return scenario['bom-ref']
      },

      updateScenario: (ref, patch) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          if (!bom.threats?.scenarios) return s
          bom.threats.scenarios = bom.threats.scenarios.map((sc) =>
            sc['bom-ref'] === ref ? { ...sc, ...patch } : sc,
          )
          bumpVersion(bom)
          return { bom }
        }),

      removeScenario: (ref) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          if (!bom.threats) return s
          bom.threats.scenarios = (bom.threats.scenarios ?? []).filter(
            (sc) => sc['bom-ref'] !== ref,
          )
          bumpVersion(bom)
          return {
            bom,
            selectedRef: get().selectedRef === ref ? null : get().selectedRef,
          }
        }),

      addRisk: (partial) => {
        const risk = createRisk(partial)
        set((s) => {
          const bom = structuredClone(s.bom)
          bom.risks ??= { risks: [] }
          bom.risks.risks = [...(bom.risks.risks ?? []), risk]
          bumpVersion(bom)
          return { bom, selectedRef: risk['bom-ref'] }
        })
        return risk['bom-ref']
      },

      updateRisk: (ref, patch) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          if (!bom.risks?.risks) return s
          bom.risks.risks = bom.risks.risks.map((r) =>
            r['bom-ref'] === ref ? { ...r, ...patch } : r,
          )
          bumpVersion(bom)
          return { bom }
        }),

      removeRisk: (ref) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          if (!bom.risks) return s
          bom.risks.risks = (bom.risks.risks ?? []).filter(
            (r) => r['bom-ref'] !== ref,
          )
          bumpVersion(bom)
          return {
            bom,
            selectedRef: get().selectedRef === ref ? null : get().selectedRef,
          }
        }),
    }),
    {
      name: 'threatmodeler-cdx-v1',
      partialize: (s) => ({ bom: toExportBom(s.bom) }),
      merge: (persisted, current) => {
        try {
          const p = persisted as { bom?: unknown }
          if (p?.bom) {
            return { ...current, bom: fromImportBom(p.bom) }
          }
        } catch {
          /* keep current */
        }
        return current
      },
    },
  ),
)
