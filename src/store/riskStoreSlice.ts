import type { StateCreator } from 'zustand'
import type { Risk } from '../types/cyclonedx'
import { createRisk } from '../lib/bom'
import { bumpVersion } from './bomMutations'
import type { StoreHost } from './storeTypes'

export interface RiskStoreSlice {
  addRisk: (
    partial: Partial<Risk> & { name: string; statement: string },
  ) => string
  updateRisk: (ref: string, patch: Partial<Risk>) => void
  removeRisk: (ref: string) => void
}

export const createRiskStoreSlice: StateCreator<
  StoreHost & RiskStoreSlice,
  [],
  [],
  RiskStoreSlice
> = (set) => ({
  addRisk: (partial) => {
    const risk = createRisk(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.risks ??= { risks: [] }
      bom.risks.risks = [...(bom.risks.risks ?? []), risk]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: risk['bom-ref'] }
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
      return { ...s, bom }
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
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),
})
