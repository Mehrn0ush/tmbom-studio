import type { CycloneDxBom, WorkspaceView } from '../types/cyclonedx'

/** Minimal host shape shared by all Zustand slices (avoids circular ThreatModelState). */
export type StoreHost = {
  bom: CycloneDxBom
  selectedRef: string | null
  view: WorkspaceView
}
