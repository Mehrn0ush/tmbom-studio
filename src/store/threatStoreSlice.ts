import type { StateCreator } from 'zustand'
import type {
  AttackPattern,
  AttackTree,
  AttackTreeNode,
  Methodology,
  Threat,
  ThreatScenario,
} from '../types/cyclonedx'
import {
  bomRef,
  createScenario,
  createThreat,
  getPrimaryBlueprint,
} from '../lib/bom'
import { suggestLinddunThreats, suggestStrideThreats } from '../lib/catalog'
import { bumpVersion } from './bomMutations'
import type { StoreHost } from './storeTypes'

export interface ThreatStoreSlice {
  setMethodologies: (methodologies: Methodology[]) => void
  addThreat: (partial: Partial<Threat> & { name: string }) => string
  updateThreat: (ref: string, patch: Partial<Threat>) => void
  removeThreat: (ref: string) => void
  suggestThreatsForAsset: (
    assetRef: string,
    taxonomy?: 'STRIDE' | 'LINDDUN',
  ) => number
  addScenario: (
    partial: Partial<ThreatScenario> & { name: string; threats: string[] },
  ) => string
  updateScenario: (ref: string, patch: Partial<ThreatScenario>) => void
  removeScenario: (ref: string) => void
  addAttackTree: (partial?: Partial<AttackTree> & { name?: string }) => string
  updateAttackTree: (ref: string, patch: Partial<AttackTree>) => void
  removeAttackTree: (ref: string) => void
  addAttackTreeNode: (
    treeRef: string,
    partial: Partial<AttackTreeNode> & { name: string },
    parentNodeRef?: string,
  ) => string
  updateAttackTreeNode: (
    treeRef: string,
    nodeRef: string,
    patch: Partial<AttackTreeNode>,
  ) => void
  removeAttackTreeNode: (treeRef: string, nodeRef: string) => void
  addAttackPattern: (
    partial: Partial<AttackPattern> & { name: string },
  ) => string
  updateAttackPattern: (ref: string, patch: Partial<AttackPattern>) => void
  removeAttackPattern: (ref: string) => void
}

export const createThreatStoreSlice: StateCreator<
  StoreHost & ThreatStoreSlice,
  [],
  [],
  ThreatStoreSlice
> = (set, get) => ({
  setMethodologies: (methodologies) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.threats ??= { methodologies: [], threats: [], scenarios: [] }
      bom.threats.methodologies = methodologies
      bumpVersion(bom)
      return { ...s, bom }
    }),

  addThreat: (partial) => {
    const threat = createThreat(partial)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.threats ??= { methodologies: ['STRIDE'], threats: [], scenarios: [] }
      bom.threats.threats = [...(bom.threats.threats ?? []), threat]
      bumpVersion(bom)
      return { ...s, bom, selectedRef: threat['bom-ref'] }
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
      return { ...s, bom }
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
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  suggestThreatsForAsset: (assetRef, taxonomy = 'STRIDE') => {
    const bp = getPrimaryBlueprint(get().bom)
    const asset = bp.assets?.find((a) => a['bom-ref'] === assetRef)
    if (!asset?.name) return 0
    const suggested =
      taxonomy === 'LINDDUN'
        ? suggestLinddunThreats(asset.name, assetRef)
        : suggestStrideThreats(asset.name, assetRef)
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.threats ??= { methodologies: ['STRIDE'], threats: [], scenarios: [] }
      const methods = new Set(
        (bom.threats.methodologies ?? []).map((m) =>
          typeof m === 'string' ? m : m.name,
        ),
      )
      methods.add(taxonomy)
      bom.threats.methodologies = [...methods] as Methodology[]
      bom.threats.threats = [...(bom.threats.threats ?? []), ...suggested]
      bumpVersion(bom)
      return { ...s, bom, view: 'threats' }
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
      return { ...s, bom, selectedRef: scenario['bom-ref'] }
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
      return { ...s, bom }
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
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addAttackTree: (partial) => {
    const rootRef = bomRef('at-node')
    const rootNode: AttackTreeNode = {
      'bom-ref': rootRef,
      name: partial?.name ?? 'Attacker goal',
      operator: 'or',
      children: [],
    }
    const tree: AttackTree = {
      'bom-ref': bomRef('attack-tree'),
      name: partial?.name ?? 'Attack tree',
      description: partial?.description,
      root: rootRef,
      nodes: partial?.nodes?.length ? partial.nodes : [rootNode],
    }
    if (partial?.['bom-ref']) tree['bom-ref'] = partial['bom-ref']
    if (!tree.root) tree.root = tree.nodes[0]?.['bom-ref']
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.threats ??= {
        methodologies: ['STRIDE', 'attack-tree'],
        threats: [],
        scenarios: [],
        attackTrees: [],
      }
      const methods = new Set(
        (bom.threats.methodologies ?? []).map((m) =>
          typeof m === 'string' ? m : m.name,
        ),
      )
      methods.add('attack-tree')
      bom.threats.methodologies = [...methods] as Methodology[]
      bom.threats.attackTrees = [...(bom.threats.attackTrees ?? []), tree]
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: tree['bom-ref'],
        view: 'attack-trees',
      }
    })
    return tree['bom-ref']
  },

  updateAttackTree: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats?.attackTrees) return s
      bom.threats.attackTrees = bom.threats.attackTrees.map((t) =>
        t['bom-ref'] === ref ? { ...t, ...patch } : t,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),

  removeAttackTree: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats) return s
      bom.threats.attackTrees = (bom.threats.attackTrees ?? []).filter(
        (t) => t['bom-ref'] !== ref,
      )
      bom.threats.threats = (bom.threats.threats ?? []).map((th) => ({
        ...th,
        attackTrees: th.attackTrees?.filter((r) => r !== ref),
      }))
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),

  addAttackTreeNode: (treeRef, partial, parentNodeRef) => {
    const node: AttackTreeNode = {
      'bom-ref': bomRef('at-node'),
      operator: 'or',
      children: [],
      ...partial,
    }
    set((s) => {
      const bom = structuredClone(s.bom)
      const trees = bom.threats?.attackTrees ?? []
      bom.threats ??= { threats: [], scenarios: [], attackTrees: [] }
      bom.threats.attackTrees = trees.map((t) => {
        if (t['bom-ref'] !== treeRef) return t
        const parent = parentNodeRef ?? t.root
        const nodes = [
          ...t.nodes.map((n) =>
            n['bom-ref'] === parent
              ? {
                  ...n,
                  children: [...(n.children ?? []), node['bom-ref']],
                }
              : n,
          ),
          node,
        ]
        return {
          ...t,
          nodes,
          root: t.root ?? node['bom-ref'],
        }
      })
      bumpVersion(bom)
      return { ...s, bom, selectedRef: node['bom-ref'] }
    })
    return node['bom-ref']
  },

  updateAttackTreeNode: (treeRef, nodeRef, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats?.attackTrees) return s
      bom.threats.attackTrees = bom.threats.attackTrees.map((t) =>
        t['bom-ref'] !== treeRef
          ? t
          : {
              ...t,
              nodes: t.nodes.map((n) =>
                n['bom-ref'] === nodeRef ? { ...n, ...patch } : n,
              ),
            },
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),

  removeAttackTreeNode: (treeRef, nodeRef) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats?.attackTrees) return s
      bom.threats.attackTrees = bom.threats.attackTrees.map((t) => {
        if (t['bom-ref'] !== treeRef) return t
        return {
          ...t,
          root:
            t.root === nodeRef
              ? t.nodes.find((n) => n['bom-ref'] !== nodeRef)?.['bom-ref']
              : t.root,
          nodes: t.nodes
            .filter((n) => n['bom-ref'] !== nodeRef)
            .map((n) => ({
              ...n,
              children: (n.children ?? []).filter((c) => c !== nodeRef),
            })),
        }
      })
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === nodeRef ? null : s.selectedRef,
      }
    }),

  addAttackPattern: (partial) => {
    const pattern: AttackPattern = {
      'bom-ref': bomRef('capec'),
      ...partial,
    }
    set((s) => {
      const bom = structuredClone(s.bom)
      bom.threats ??= { threats: [], scenarios: [], attackPatterns: [] }
      bom.threats.attackPatterns = [
        ...(bom.threats.attackPatterns ?? []),
        pattern,
      ]
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: pattern['bom-ref'],
        view: 'attack-patterns',
      }
    })
    return pattern['bom-ref']
  },

  updateAttackPattern: (ref, patch) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats?.attackPatterns) return s
      bom.threats.attackPatterns = bom.threats.attackPatterns.map((p) =>
        p['bom-ref'] === ref ? { ...p, ...patch } : p,
      )
      bumpVersion(bom)
      return { ...s, bom }
    }),

  removeAttackPattern: (ref) =>
    set((s) => {
      const bom = structuredClone(s.bom)
      if (!bom.threats) return s
      bom.threats.attackPatterns = (bom.threats.attackPatterns ?? []).filter(
        (p) => p['bom-ref'] !== ref,
      )
      bom.threats.threats = (bom.threats.threats ?? []).map((th) => ({
        ...th,
        attackPatterns: th.attackPatterns?.filter((r) => r !== ref),
      }))
      bumpVersion(bom)
      return {
        ...s,
        bom,
        selectedRef: s.selectedRef === ref ? null : s.selectedRef,
      }
    }),
})
