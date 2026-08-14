import { useMemo } from 'react'
import { useThreatModelStore } from '../store/useThreatModelStore'
import { toExportBom } from '../lib/bom'
import { validateTmbom, type ValidationResult } from '../lib/validateBom'

/** Structural TM-BOM validation for the current working document. */
export function useBomValidation(): ValidationResult {
  const bom = useThreatModelStore((s) => s.bom)
  return useMemo(() => validateTmbom(toExportBom(bom)), [bom])
}
