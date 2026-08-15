import type { StateCreator } from 'zustand'
import type {
  Asset,
  Actor,
  Blueprint,
  Boundary,
  Flow,
  Zone,
} from '../types/cyclonedx'
import {
  bomRef,
  createAsset,
  createBoundary,
  createFlow,
  createZone,
} from '../lib/bom'
import { mutateBlueprint } from './bomMutations'
import type { StoreHost } from './storeTypes'

export interface BlueprintStoreSlice {
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
  addActor: (partial: Partial<Actor> & { name: string }) => string
  updateActor: (ref: string, patch: Partial<Actor>) => void
  removeActor: (ref: string) => void
}

export const createBlueprintStoreSlice: StateCreator<
  StoreHost & BlueprintStoreSlice,
  [],
  [],
  BlueprintStoreSlice
> = (set, get) => ({
  updateBlueprint: (patch) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => Object.assign(bp, patch)),
    })),

  addAsset: (partial) => {
    const asset = createAsset(partial)
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.assets = [...(bp.assets ?? []), asset]
      }),
      selectedRef: asset['bom-ref'],
    }))
    return asset['bom-ref']
  },

  updateAsset: (ref, patch) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.assets = (bp.assets ?? []).map((a) =>
          a['bom-ref'] === ref ? { ...a, ...patch } : a,
        )
      }),
    })),

  removeAsset: (ref) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.assets = (bp.assets ?? []).filter((a) => a['bom-ref'] !== ref)
        bp.flows = (bp.flows ?? []).filter(
          (f) => f.source !== ref && f.destination !== ref,
        )
      }),
      selectedRef: s.selectedRef === ref ? null : s.selectedRef,
    })),

  addZone: (partial) => {
    const zone = createZone(partial)
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.zones = [...(bp.zones ?? []), zone]
      }),
    }))
    return zone['bom-ref']
  },

  updateZone: (ref, patch) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.zones = (bp.zones ?? []).map((z) =>
          z['bom-ref'] === ref ? { ...z, ...patch } : z,
        )
      }),
    })),

  removeZone: (ref) =>
    set((s) => ({
      ...s,
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
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.boundaries = [...(bp.boundaries ?? []), boundary]
      }),
    }))
    return boundary['bom-ref']
  },

  removeBoundary: (ref) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.boundaries = (bp.boundaries ?? []).filter(
          (b) => b['bom-ref'] !== ref,
        )
      }),
    })),

  addFlow: (partial) => {
    const flow = createFlow(partial)
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.flows = [...(bp.flows ?? []), flow]
      }),
      selectedRef: flow['bom-ref'],
    }))
    return flow['bom-ref']
  },

  updateFlow: (ref, patch) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.flows = (bp.flows ?? []).map((f) =>
          f['bom-ref'] === ref ? { ...f, ...patch } : f,
        )
      }),
    })),

  removeFlow: (ref) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.flows = (bp.flows ?? []).filter((f) => f['bom-ref'] !== ref)
      }),
      selectedRef: get().selectedRef === ref ? null : get().selectedRef,
    })),

  addActor: (partial) => {
    const actor: Actor = {
      'bom-ref': bomRef('actor'),
      party: { name: partial.name },
      description: partial.description,
      zone: partial.zone,
      properties: partial.properties,
      _position: partial._position ?? { x: 80, y: 80 },
    }
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.actors = [...(bp.actors ?? []), actor]
      }),
      selectedRef: actor['bom-ref'],
    }))
    return actor['bom-ref']
  },

  updateActor: (ref, patch) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.actors = (bp.actors ?? []).map((a) =>
          a['bom-ref'] === ref ? { ...a, ...patch } : a,
        )
      }),
    })),

  removeActor: (ref) =>
    set((s) => ({
      ...s,
      bom: mutateBlueprint(s.bom, (bp) => {
        bp.actors = (bp.actors ?? []).filter((a) => a['bom-ref'] !== ref)
      }),
      selectedRef: s.selectedRef === ref ? null : s.selectedRef,
    })),
})
