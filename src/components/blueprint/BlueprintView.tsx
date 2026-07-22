import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { getPrimaryBlueprint } from '../../lib/bom'
import { ASSET_TYPES, FLOW_TYPES, ZONE_TYPES } from '../../lib/catalog'
import { AssetNode, type AssetNodeData } from './AssetNode'
import type { Asset, AssetType, FlowType, ZoneType } from '../../types/cyclonedx'

const nodeTypes = { asset: AssetNode }

function assetTypeLabel(type: Asset['type']): string {
  if (!type) return 'asset'
  if (typeof type === 'string') return type
  return type.name
}

export function BlueprintView() {
  return (
    <ReactFlowProvider>
      <BlueprintViewInner />
    </ReactFlowProvider>
  )
}

function BlueprintViewInner() {
  const bom = useThreatModelStore((s) => s.bom)
  const selectedRef = useThreatModelStore((s) => s.selectedRef)
  const setSelectedRef = useThreatModelStore((s) => s.setSelectedRef)
  const addAsset = useThreatModelStore((s) => s.addAsset)
  const updateAsset = useThreatModelStore((s) => s.updateAsset)
  const removeAsset = useThreatModelStore((s) => s.removeAsset)
  const addFlow = useThreatModelStore((s) => s.addFlow)
  const updateFlow = useThreatModelStore((s) => s.updateFlow)
  const removeFlow = useThreatModelStore((s) => s.removeFlow)
  const addZone = useThreatModelStore((s) => s.addZone)
  const removeZone = useThreatModelStore((s) => s.removeZone)
  const addBoundary = useThreatModelStore((s) => s.addBoundary)
  const removeBoundary = useThreatModelStore((s) => s.removeBoundary)
  const suggestThreatsForAsset = useThreatModelStore(
    (s) => s.suggestThreatsForAsset,
  )

  const bp = getPrimaryBlueprint(bom)
  const assets = bp.assets ?? []
  const flows = bp.flows ?? []
  const zones = bp.zones ?? []
  const boundaries = bp.boundaries ?? []

  const initialNodes: Node<AssetNodeData>[] = useMemo(
    () =>
      assets.map((a) => ({
        id: a['bom-ref'],
        type: 'asset',
        position: a._position ?? { x: 100, y: 100 },
        data: {
          label: a.name ?? a['bom-ref'],
          assetType: assetTypeLabel(a.type),
        },
        selected: a['bom-ref'] === selectedRef,
      })),
    // intentionally rebuild when asset set identity/content changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bom.version, selectedRef],
  )

  const initialEdges: Edge[] = useMemo(
    () =>
      flows.map((f) => ({
        id: f['bom-ref'],
        source: f.source,
        target: f.destination,
        label: f.name,
        animated: f.type === 'data',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#1a2332' },
        selected: f['bom-ref'] === selectedRef,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bom.version, selectedRef],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const name = `Flow ${flows.length + 1}`
      addFlow({
        name,
        source: connection.source,
        destination: connection.target,
        type: 'data',
      })
      setEdges((eds) => addEdge(connection, eds))
    },
    [addFlow, flows.length, setEdges],
  )

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateAsset(node.id, {
        _position: { x: node.position.x, y: node.position.y },
      })
    },
    [updateAsset],
  )

  const selectedAsset = assets.find((a) => a['bom-ref'] === selectedRef)
  const selectedFlow = flows.find((f) => f['bom-ref'] === selectedRef)

  const [newAssetName, setNewAssetName] = useState('New Service')
  const [newAssetType, setNewAssetType] = useState<AssetType>('service')
  const [newZoneName, setNewZoneName] = useState('Trust Zone')
  const [newZoneType, setNewZoneType] = useState<ZoneType>('trust')

  return (
    <div className="stack">
      <div className="btn-row">
        <input
          value={newAssetName}
          onChange={(e) => setNewAssetName(e.target.value)}
          placeholder="Asset name"
          style={{ padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--line)' }}
        />
        <select
          value={newAssetType}
          onChange={(e) => setNewAssetType(e.target.value as AssetType)}
          style={{ padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--line)' }}
        >
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            addAsset({
              name: newAssetName || 'Asset',
              type: newAssetType,
              _position: {
                x: 80 + assets.length * 40,
                y: 100 + (assets.length % 3) * 80,
              },
            })
          }}
        >
          Add asset
        </button>
        <input
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          placeholder="Zone name"
          style={{ padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--line)' }}
        />
        <select
          value={newZoneType}
          onChange={(e) => setNewZoneType(e.target.value as ZoneType)}
          style={{ padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--line)' }}
        >
          {ZONE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          className="btn"
          type="button"
          onClick={() => addZone({ name: newZoneName || 'Zone', type: newZoneType })}
        >
          Add zone
        </button>
      </div>

      <div className="split">
        <div className="canvas-wrap">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_, node) => setSelectedRef(node.id)}
            onEdgeClick={(_, edge) => setSelectedRef(edge.id)}
            onPaneClick={() => setSelectedRef(null)}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} size={1} color="#c9c2b0" />
            <Controls />
            <MiniMap
              pannable
              zoomable
              style={{ background: '#f3f0e8' }}
              nodeColor="#0b6e4f"
            />
          </ReactFlow>
        </div>

        <aside className="panel inspector">
          {selectedAsset ? (
            <AssetInspector
              asset={selectedAsset}
              zones={zones}
              onChange={(patch) => updateAsset(selectedAsset['bom-ref'], patch)}
              onRemove={() => removeAsset(selectedAsset['bom-ref'])}
              onSuggest={() =>
                suggestThreatsForAsset(selectedAsset['bom-ref'])
              }
            />
          ) : selectedFlow ? (
            <FlowInspector
              flow={selectedFlow}
              assets={assets}
              onChange={(patch) => updateFlow(selectedFlow['bom-ref'], patch)}
              onRemove={() => removeFlow(selectedFlow['bom-ref'])}
            />
          ) : (
            <div>
              <h3>Blueprint</h3>
              <p className="muted" style={{ marginTop: 0 }}>
                Select an asset or drag between handles to create a{' '}
                <span className="mono">flow</span>. Zones and boundaries are
                CycloneDX blueprint constructs for trust modeling.
              </p>
              <div className="stack">
                <div>
                  <strong>Zones</strong>
                  <div className="list" style={{ marginTop: 8 }}>
                    {zones.length === 0 && (
                      <div className="empty">No zones yet</div>
                    )}
                    {zones.map((z) => (
                      <div key={z['bom-ref']} className="list-item" style={{ cursor: 'default' }}>
                        <div>
                          <h4>{z.name}</h4>
                          <p className="mono">
                            {typeof z.type === 'string' ? z.type : z.type.name}
                          </p>
                        </div>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => removeZone(z['bom-ref'])}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <strong>Boundaries</strong>
                  <div className="list" style={{ marginTop: 8 }}>
                    {boundaries.map((b) => (
                      <div key={b['bom-ref']} className="list-item" style={{ cursor: 'default' }}>
                        <div>
                          <h4>{b.name ?? 'Boundary'}</h4>
                          <p className="mono">{b.zones.join(' → ')}</p>
                        </div>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => removeBoundary(b['bom-ref'])}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {zones.length >= 2 && (
                      <button
                        className="btn"
                        type="button"
                        onClick={() =>
                          addBoundary({
                            name: `${zones[0].name} → ${zones[1].name}`,
                            type: 'trust',
                            zones: [zones[0]['bom-ref'], zones[1]['bom-ref']],
                          })
                        }
                      >
                        Add boundary (first two zones)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function AssetInspector({
  asset,
  zones,
  onChange,
  onRemove,
  onSuggest,
}: {
  asset: Asset
  zones: { 'bom-ref': string; name: string }[]
  onChange: (patch: Partial<Asset>) => void
  onRemove: () => void
  onSuggest: () => void
}) {
  return (
    <div className="stack">
      <h3>Asset</h3>
      <div className="field">
        <label>Name</label>
        <input
          value={asset.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="field">
        <label>Type</label>
        <select
          value={typeof asset.type === 'string' ? asset.type : 'service'}
          onChange={(e) => onChange({ type: e.target.value as AssetType })}
        >
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Zone</label>
        <select
          value={asset.zone ?? ''}
          onChange={(e) =>
            onChange({ zone: e.target.value || undefined })
          }
        >
          <option value="">None</option>
          {zones.map((z) => (
            <option key={z['bom-ref']} value={z['bom-ref']}>
              {z.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          value={asset.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <p className="mono muted">{asset['bom-ref']}</p>
      <div className="btn-row">
        <button className="btn btn-primary" type="button" onClick={onSuggest}>
          Suggest STRIDE threats
        </button>
        <button className="btn btn-danger" type="button" onClick={onRemove}>
          Delete
        </button>
      </div>
    </div>
  )
}

function FlowInspector({
  flow,
  assets,
  onChange,
  onRemove,
}: {
  flow: {
    'bom-ref': string
    name: string
    description?: string
    type: FlowType | { name: string }
    source: string
    destination: string
    encrypted?: boolean
    protocols?: string[]
  }
  assets: Asset[]
  onChange: (patch: Record<string, unknown>) => void
  onRemove: () => void
}) {
  return (
    <div className="stack">
      <h3>Flow</h3>
      <div className="field">
        <label>Name</label>
        <input
          value={flow.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="field">
        <label>Type</label>
        <select
          value={typeof flow.type === 'string' ? flow.type : 'data'}
          onChange={(e) => onChange({ type: e.target.value as FlowType })}
        >
          {FLOW_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Source</label>
        <select
          value={flow.source}
          onChange={(e) => onChange({ source: e.target.value })}
        >
          {assets.map((a) => (
            <option key={a['bom-ref']} value={a['bom-ref']}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Destination</label>
        <select
          value={flow.destination}
          onChange={(e) => onChange({ destination: e.target.value })}
        >
          {assets.map((a) => (
            <option key={a['bom-ref']} value={a['bom-ref']}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={!!flow.encrypted}
          onChange={(e) => onChange({ encrypted: e.target.checked })}
        />
        Encrypted
      </label>
      <div className="field">
        <label>Protocols (comma-separated)</label>
        <input
          value={(flow.protocols ?? []).join(', ')}
          onChange={(e) =>
            onChange({
              protocols: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
      <p className="mono muted">{flow['bom-ref']}</p>
      <button className="btn btn-danger" type="button" onClick={onRemove}>
        Delete flow
      </button>
    </div>
  )
}
