import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { SiteData } from './mockData'

const STATUS_COLOR = {
  ok:    'var(--ok)',
  warn:  'var(--warn)',
  alert: 'var(--alert)',
} as const

function SiteNode({ data }: NodeProps<SiteData>) {
  return (
    <>
      <Handle type="target" position={Position.Top}    id="t" isConnectable={false} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} id="b" isConnectable={false} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left}   id="l" isConnectable={false} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right}  id="r" isConnectable={false} style={{ opacity: 0 }} />
      <div className={`topo-site topo-site-${data.status}`}>
        <span className="topo-dot" style={{ background: STATUS_COLOR[data.status] }} />
        <div className="topo-site-meta">
          <div className="topo-site-title">{data.label}</div>
          <div className="topo-site-sub">{data.sub}</div>
        </div>
        <span className="topo-site-count">{data.count} dev</span>
      </div>
    </>
  )
}

export default memo(SiteNode)
