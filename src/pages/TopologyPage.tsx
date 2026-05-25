import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useNodesState, useEdgesState, type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { initialNodes, initialEdges } from '../components/topology/mockData'
import HQNode from '../components/topology/HQNode'
import SiteNode from '../components/topology/SiteNode'

const nodeTypes: NodeTypes = {
  hqNode:  HQNode,
  siteNode: SiteNode,
}

export default function TopologyPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Network Topology</h1>
          <p className="page-sub">Big-picture view of every site connecting back to HQ — click any node to drill in.</p>
        </div>
        <div className="topo-legend">
          <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Online</span>
          <span className="legend-swatch"><i style={{ background: 'var(--warn)'  }} />Warning</span>
          <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Offline</span>
          <span className="legend-line"><i />WAN</span>
          <span className="legend-line dashed"><i />VPN / backup</span>
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
            nodeOrigin={[0.5, 0.5]}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="var(--grid-dot)"
              style={{ background: 'var(--canvas-bg)' }}
            />
            <Controls showInteractive={false} position="top-right" />
            <MiniMap
              position="bottom-left"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
              nodeColor={(n) => {
                if (n.type === 'hqNode') return 'var(--accent)'
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
