import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useNodesState, useEdgesState, type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { initialNodes, initialEdges } from '../components/topology/mockData'
import HQNode from '../components/topology/HQNode'
import SiteNode from '../components/topology/SiteNode'
import { TrendingUp, TrendingDown } from 'lucide-react'

const nodeTypes: NodeTypes = { hqNode: HQNode, siteNode: SiteNode }

const STATS = [
  { label: 'Total Traffic',  val: '1.2 Gbps', trend: 'up',   trendText: '12% from last hour' },
  { label: 'Storage Used',   val: '84.2 TB',  trend: '',     trendText: 'Retention: 30 days' },
  { label: 'Active Nodes',   val: '42 / 45',  trend: 'down', trendText: '3 offline alerts' },
  { label: 'System Health',  val: '98.2%',    trend: 'up',   trendText: 'Optimal', ok: true },
]

const EVENTS = [
  { dot: 'var(--alert)', time: '14:22:01', device: 'CAM-04-NORTH',   msg: 'Connection lost: Timed out after 30s' },
  { dot: 'var(--warn)',  time: '14:18:45', device: 'NVR-PRIMARY-01', msg: 'High CPU usage detected (88%)' },
  { dot: 'var(--ok)',    time: '14:15:12', device: 'SW-CORE-01',     msg: 'Port 24 (CAM-GUEST) link up' },
  { dot: 'var(--warn)',  time: '14:09:33', device: 'CAM-010',        msg: 'Packet loss 18% — latency spike' },
]

export default function TopologyPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-head">
        <div>
          <h1>Network Topology</h1>
          <p className="page-sub">Big-picture view of every site connecting back to HQ — click any node to drill in.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--ok)' }} />42 Online</span>
          <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--alert)' }} />3 Offline</span>
        </div>
      </div>

      <div className="stat-grid">
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className={`stat-val${s.ok ? ' ok' : ''}`}>{s.val}</div>
            <div className={`stat-trend${s.trend ? ' ' + s.trend : ''}`}>
              {s.trend === 'up'   && <TrendingUp  size={11} />}
              {s.trend === 'down' && <TrendingDown size={11} />}
              {s.trendText}
            </div>
          </div>
        ))}
      </div>

      <div className="canvas-wrap" style={{ height: 360, minHeight: 0, flex: 'none', margin: '0 24px 20px' }}>
        <div className="canvas" style={{ backgroundImage: 'none', overflow: 'hidden', borderRadius: 10, border: '1px solid var(--border)' }}>
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
              maskColor="rgba(0,0,0,0.10)"
            />
          </ReactFlow>
        </div>
      </div>

      <div className="events-section">
        <div className="events-card">
          <div className="events-head">
            <h3>Recent Security Events</h3>
            <a className="events-viewall" href="#">View All</a>
          </div>
          {EVENTS.map((e, i) => (
            <div key={i} className="event-row">
              <span className="event-dot" style={{ background: e.dot }} />
              <span className="event-time">{e.time}</span>
              <span className="event-device">{e.device}</span>
              <span className="event-msg">{e.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
