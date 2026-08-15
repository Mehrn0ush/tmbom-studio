import type { CycloneDxBom } from '../types/cyclonedx'
import { getPrimaryBlueprint } from '../lib/bom'

export function bumpVersion(bom: CycloneDxBom) {
  bom.version = (bom.version ?? 1) + 1
  if (bom.metadata) {
    bom.metadata.timestamp = new Date().toISOString()
  }
}

/** Clone BOM, mutate the primary blueprint, bump version. */
export function mutateBlueprint(
  bom: CycloneDxBom,
  fn: (bp: NonNullable<CycloneDxBom['blueprints']>[number]) => void,
): CycloneDxBom {
  const next = structuredClone(bom)
  fn(getPrimaryBlueprint(next))
  bumpVersion(next)
  return next
}
