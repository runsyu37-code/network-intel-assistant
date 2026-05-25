import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { SiteMapData } from './mockData'

const COLOR = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' } as const

function SiteMapNode({ data }: NodeProps<SiteMapData>) {
  return (
    <>
      <Handle type="target" position={Position.Left}  id="l" isConnectable={false} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="r" isConnectable={false} style={{ opacity: 0 }} />
      <div className={`smap-site smap-site-${data.status}`}>
        <span className="smap-dot" style={{ background: COLOR[data.status] }} />
        <div className="smap-site-meta">
          <div className="smap-site-label">{data.label}</div>
          <div className="smap-site-sub">{data.sub} · {data.cameraCount} cam</div>
        </div>
        {data.alertCount > 0 && (
          <span className="smap-alert-badge">{data.alertCount}</span>
        )}
      </div>
    </>
  )
}

export default memo(SiteMapNode)
