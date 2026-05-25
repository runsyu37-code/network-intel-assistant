import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { HQSiteData } from './mockData'

function HQSiteNode({ data }: NodeProps<HQSiteData>) {
  return (
    <>
      <Handle type="source" position={Position.Right} id="r" isConnectable={false} style={{ opacity: 0 }} />
      <div className="smap-hq">
        <div className="smap-hq-glyph">S</div>
        <div>
          <div className="smap-hq-label">SSM — HQ</div>
          <div className="smap-hq-sub">{data.siteCount} sites · {data.cameraCount} cameras</div>
        </div>
      </div>
    </>
  )
}

export default memo(HQSiteNode)
