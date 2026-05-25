import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useNavigate } from 'react-router-dom'
import type { BldgMapData } from './mockData'

const COLOR = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' } as const

function BuildingMapNode({ data, id }: NodeProps<BldgMapData>) {
  const navigate = useNavigate()

  return (
    <>
      <Handle type="target" position={Position.Left} id="l" isConnectable={false} style={{ opacity: 0 }} />
      <div
        className={`smap-bldg smap-bldg-${data.status}`}
        onClick={() => navigate(`/dashboard/buildings/${id}`)}
        title={`Open ${data.label}`}
      >
        <span className="smap-dot smap-dot-sm" style={{ background: COLOR[data.status] }} />
        <div className="smap-bldg-name">{data.label}</div>
        <div className="smap-bldg-stats">
          <span>{data.floors}F</span>
          <span>·</span>
          <span>{data.cameras} cam</span>
        </div>
      </div>
    </>
  )
}

export default memo(BuildingMapNode)
