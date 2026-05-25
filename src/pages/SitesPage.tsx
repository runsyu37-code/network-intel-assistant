import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useNodesState, useEdgesState, type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { siteMapNodes, siteMapEdges } from '../components/sites/mockData'
import HQSiteNode     from '../components/sites/HQSiteNode'
import SiteMapNode    from '../components/sites/SiteMapNode'
import BuildingMapNode from '../components/sites/BuildingMapNode'

const nodeTypes: NodeTypes = {
  hqSiteNode:  HQSiteNode,
  siteMapNode: SiteMapNode,
  bldgMapNode: BuildingMapNode,
}

export default function SitesPage() {
  const [nodes, , onNodesChange] = useNodesState(siteMapNodes)
  const [edges, , onEdgesChange] = useEdgesState(siteMapEdges)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Sites &amp; Buildings</h1>
          <p className="page-sub">HQ → สาขา → ตึก — คลิกที่ตึกเพื่อดูรายละเอียด</p>
        </div>
        <div className="topo-legend">
          <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Online</span>
          <span className="legend-swatch"><i style={{ background: 'var(--warn)'  }} />Warning</span>
          <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Offline</span>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div className="canvas" style={{ backgroundImage: 'none', overflow: 'hidden' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodeOrigin={[0, 0.5]}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.25}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24} size={1}
              color="var(--grid-dot)"
              style={{ background: 'var(--canvas-bg)' }}
            />
            <Controls showInteractive={false} position="top-right" />
            <MiniMap
              position="bottom-left"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
              nodeColor={(n) => {
                if (n.type === 'hqSiteNode') return 'var(--accent)'
                const s = (n.data as { status?: string })?.status
                if (s === 'alert') return 'var(--alert)'
                if (s === 'warn')  return 'var(--warn)'
                return 'var(--ok)'
              }}
              maskColor="rgba(0,0,0,0.12)"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
