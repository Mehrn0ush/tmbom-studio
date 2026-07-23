import { useMemo, useState, type ReactNode } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import type { AttackTreeOperator } from '../../types/cyclonedx'

export function AttackTreesView() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addAttackTree = useThreatModelStore((s) => s.addAttackTree)
  const updateAttackTree = useThreatModelStore((s) => s.updateAttackTree)
  const removeAttackTree = useThreatModelStore((s) => s.removeAttackTree)
  const addAttackTreeNode = useThreatModelStore((s) => s.addAttackTreeNode)
  const updateAttackTreeNode = useThreatModelStore((s) => s.updateAttackTreeNode)
  const removeAttackTreeNode = useThreatModelStore((s) => s.removeAttackTreeNode)

  const trees = bom.threats?.attackTrees ?? []
  const selected =
    trees.find((t) => t['bom-ref'] === selectedRef) ??
    trees.find((t) => t.nodes.some((n) => n['bom-ref'] === selectedRef))

  const selectedNode = useMemo(() => {
    if (!selected) return null
    return (
      selected.nodes.find((n) => n['bom-ref'] === selectedRef) ??
      selected.nodes.find((n) => n['bom-ref'] === selected.root) ??
      null
    )
  }, [selected, selectedRef])

  const [treeName, setTreeName] = useState('')
  const [childName, setChildName] = useState('')

  const renderNode = (nodeRef: string, depth = 0): ReactNode => {
    if (!selected) return null
    const node = selected.nodes.find((n) => n['bom-ref'] === nodeRef)
    if (!node) return null
    return (
      <div key={nodeRef} style={{ marginLeft: depth * 16 }}>
        <button
          type="button"
          className={`list-item${selectedRef === nodeRef ? ' selected' : ''}`}
          onClick={() => setSelectedRef(nodeRef)}
          style={{ marginBottom: 6 }}
        >
          <div>
            <h4>
              {node.name}{' '}
              <span className="badge">{(node.operator ?? 'or').toUpperCase()}</span>
            </h4>
            <p className="mono">{node['bom-ref']}</p>
          </div>
        </button>
        {(node.children ?? []).map((c) => renderNode(c, depth + 1))}
      </div>
    )
  }

  return (
    <div className="split">
      <div className="stack">
        <div className="panel panel-pad btn-row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Attack tree name</label>
            <input
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              placeholder="e.g. Compromise checkout payments"
            />
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              addAttackTree({ name: treeName.trim() || 'Attack tree' })
              setTreeName('')
            }}
          >
            Add attack tree
          </button>
        </div>

        <div className="list">
          {trees.length === 0 && (
            <div className="panel empty">
              No attack trees yet. Decompose attacker goals into AND/OR child
              nodes (CycloneDX attackTree).
            </div>
          )}
          {trees.map((t) => (
            <button
              key={t['bom-ref']}
              type="button"
              className={`list-item${selected?.['bom-ref'] === t['bom-ref'] ? ' selected' : ''}`}
              onClick={() => setSelectedRef(t['bom-ref'])}
            >
              <div>
                <h4>{t.name ?? 'Attack tree'}</h4>
                <p>
                  {t.nodes.length} nodes · root{' '}
                  <span className="mono">{t.root}</span>
                </p>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="panel panel-pad">
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
              Tree structure
            </h3>
            {selected.root ? renderNode(selected.root) : (
              <p className="muted">No root node</p>
            )}
          </div>
        )}
      </div>

      <aside className="panel inspector">
        {!selected ? (
          <div className="empty">Select or create an attack tree</div>
        ) : (
          <div className="stack">
            <h3>Attack tree</h3>
            <div className="field">
              <label>Name</label>
              <input
                value={selected.name ?? ''}
                onChange={(e) =>
                  updateAttackTree(selected['bom-ref'], {
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                value={selected.description ?? ''}
                onChange={(e) =>
                  updateAttackTree(selected['bom-ref'], {
                    description: e.target.value,
                  })
                }
              />
            </div>

            {selectedNode && (
              <>
                <h3>Node</h3>
                <div className="field">
                  <label>Node name</label>
                  <input
                    value={selectedNode.name}
                    onChange={(e) =>
                      updateAttackTreeNode(
                        selected['bom-ref'],
                        selectedNode['bom-ref'],
                        { name: e.target.value },
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>Operator</label>
                  <select
                    value={selectedNode.operator ?? 'or'}
                    onChange={(e) =>
                      updateAttackTreeNode(
                        selected['bom-ref'],
                        selectedNode['bom-ref'],
                        {
                          operator: e.target.value as AttackTreeOperator,
                        },
                      )
                    }
                  >
                    <option value="or">OR — any child succeeds</option>
                    <option value="and">AND — all children required</option>
                  </select>
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    value={selectedNode.description ?? ''}
                    onChange={(e) =>
                      updateAttackTreeNode(
                        selected['bom-ref'],
                        selectedNode['bom-ref'],
                        { description: e.target.value },
                      )
                    }
                  />
                </div>
                <div className="btn-row" style={{ alignItems: 'end' }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Add child node</label>
                    <input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Sub-goal or technique"
                    />
                  </div>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      const ref = addAttackTreeNode(
                        selected['bom-ref'],
                        { name: childName.trim() || 'Child node' },
                        selectedNode['bom-ref'],
                      )
                      setChildName('')
                      setSelectedRef(ref)
                    }}
                  >
                    Add child
                  </button>
                </div>
                {selectedNode['bom-ref'] !== selected.root && (
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() =>
                      removeAttackTreeNode(
                        selected['bom-ref'],
                        selectedNode['bom-ref'],
                      )
                    }
                  >
                    Delete node
                  </button>
                )}
              </>
            )}

            <p className="mono muted">{selected['bom-ref']}</p>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => removeAttackTree(selected['bom-ref'])}
            >
              Delete tree
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
