import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CycloneDxBom,
  ExternalReference,
  WorkspaceView,
} from '../types/cyclonedx'
import {
  emptyBom,
  fromImportBom,
  getPrimaryBlueprint,
  toExportBom,
} from '../lib/bom'
import { createSampleBom } from '../lib/sample'
import { applySession, type WorkshopSession } from '../lib/session'
import {
  createBlueprintStoreSlice,
  type BlueprintStoreSlice,
} from './blueprintStoreSlice'
import {
  createRiskStoreSlice,
  type RiskStoreSlice,
} from './riskStoreSlice'
import {
  createSpecStoreSlice,
  type SpecStoreSlice,
} from './specStoreSlice'
import {
  createThreatStoreSlice,
  type ThreatStoreSlice,
} from './threatStoreSlice'
import { bumpVersion } from './bomMutations'

export type ThreatModelState = StoreHostActions &
  SpecStoreSlice &
  BlueprintStoreSlice &
  ThreatStoreSlice &
  RiskStoreSlice

interface StoreHostActions {
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
  updateSession: (session: WorkshopSession) => void
  setExternalReferences: (refs: ExternalReference[]) => void
  addExternalReference: (ref: ExternalReference) => void
  removeExternalReference: (index: number) => void
}

export const useThreatModelStore = create<ThreatModelState>()(
  persist(
    (set, get, api) => ({
      ...createSpecStoreSlice(set, get, api),
      ...createBlueprintStoreSlice(set, get, api),
      ...createThreatStoreSlice(set, get, api),
      ...createRiskStoreSlice(set, get, api),

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

      updateSession: (session) =>
        set((s) => {
          const bom = applySession(s.bom, session)
          bumpVersion(bom)
          return { bom }
        }),

      setExternalReferences: (refs) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          bom.externalReferences = refs
          bumpVersion(bom)
          return { bom }
        }),

      addExternalReference: (ref) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          bom.externalReferences = [...(bom.externalReferences ?? []), ref]
          bumpVersion(bom)
          return { bom }
        }),

      removeExternalReference: (index) =>
        set((s) => {
          const bom = structuredClone(s.bom)
          bom.externalReferences = (bom.externalReferences ?? []).filter(
            (_, i) => i !== index,
          )
          bumpVersion(bom)
          return { bom }
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
