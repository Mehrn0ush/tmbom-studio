import type { StateCreator } from 'zustand'
import type { Risk } from '../types/cyclonedx'
import type { RiskAssessment } from '../types/cyclonedx-extended'
import { bomRef, createRisk } from '../lib/bom'
import { bumpVersion } from './bomMutations'
import type { StoreHost } from './storeTypes'

export interface RiskStoreSlice {
  addRisk: (
    partial: Partial<Risk> & { name: string; statement: string },
  ) => string
  updateRisk: (ref: string, patch: Partial<Risk>) => void
  removeRisk: (ref: string) => void
  setRiskAssessmentsForScope: (
    scopeRef: string,
    summaries: string[],
    riskName: string,
  ) => void
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
      bom.risks.assessments = (bom.risks.assessments ?? []).filter(
        (a) => a.scope !== ref,
      )
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  setRiskAssessmentsForScope: (scopeRef, summaries, riskName) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.risks ??= { risks: [] }
      const other = (bom.risks.assessments ?? []).filter(
        (a) => a.scope !== scopeRef,
      )
      const next: RiskAssessment[] = summaries.map((summary) => ({
        'bom-ref': bomRef('assessment'),
        name: `Assessment for ${riskName}`,
        scope: scopeRef,
        status: 'draft',
        summary,
      }))
      bom.risks.assessments = [...other, ...next]
      bumpVersion(bom)
      return { ...s, bom }
    }),
})
