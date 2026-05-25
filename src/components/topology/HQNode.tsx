import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { HQData } from './mockData'

function HQNode({ data }: NodeProps<HQData>) {
  return (
    <>
      <Handle type="source" position={Position.Top}    id="t" isConnectable={false} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="b" isConnectable={false} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left}   id="l" isConnectable={false} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right}  id="r" isConnectable={false} style={{ opacity: 0 }} />
      <div className="topo-hq">
        <div className="topo-hq-head">
          <div className="topo-hq-glyph">HQ</div>
          <div>
            <div className="topo-hq-label">{data.label}</div>
            <div className="topo-hq-ip mono">{data.ip}</div>
          </div>
        </div>
        <div className="topo-hq-stat">
          <span className="topo-dot" style={{ background: 'var(--ok)' }} />
          <span>All uplinks healthy</span>
          <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>{data.siteCount} sites</span>
        </div>
      </div>
    </>
  )
}

export default memo(HQNode)
