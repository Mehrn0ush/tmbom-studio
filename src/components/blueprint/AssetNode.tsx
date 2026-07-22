import {
  Handle,
  Position,
  type NodeProps,
  type Node,
} from 'reactflow'

export type AssetNodeData = {
  label: string
  assetType: string
  selected?: boolean
}

export function AssetNode({ data, selected }: NodeProps<AssetNodeData>) {
  return (
    <div className={`asset-node${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="type">{data.assetType}</div>
      <div className="name">{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export type AssetFlowNode = Node<AssetNodeData>
