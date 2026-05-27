import { useState } from 'react'
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  useNodesState, useEdgesState, type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { initialNodes, initialEdges } from '../components/topology/mockData'
import HQNode from '../components/topology/HQNode'
import SiteNode from '../components/topology/SiteNode'

const nodeTypes: NodeTypes = { hqNode: HQNode, siteNode: SiteNode }

const MOCK_STATS = {
  sites: 6,
  cameras: 99,
  camerasOnline: 96,
  nvrs: 5,
  switches: 8,
  alerts: 2,
}

export default function TopologyPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)
  const [hideOffline, setHideOffline] = useState(false)

  const visibleNodes = hideOffline
    ? nodes.filter(n => (n.data as { status?: string }).status !== 'alert')
    : nodes
  const visibleEdges = hideOffline
    ? edges.filter(e => {
        const target = visibleNodes.find(n => n.id === e.target)
        return !!target
      })
    : edges

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <div className="page-head">
        <div>
          <h1>Network Topology</h1>
          <p className="page-sub">Big-picture view of every site — click any node to drill in.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="dl-stat">
            <span className="ds-dot" style={{ background: 'var(--ok)' }} />
            {MOCK_STATS.camerasOnline} Online
          </span>
          <span className="dl-stat">
            <span className="ds-dot" style={{ background: 'var(--alert)' }} />
            {MOCK_STATS.cameras - MOCK_STATS.camerasOnline} Offline
          </span>
        </div>
      </div>

      {/* Main area: left panel + canvas */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', margin: '0 24px 24px', gap: 16 }}>

        {/* Left legend panel */}
        <div style={{
          width: 220, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>

          {/* Status legend */}
          <div className="cam-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
              Status Legend
            </div>
            {[
              { color: 'var(--ok)',    label: 'Online (Normal)'   },
              { color: 'var(--warn)',  label: 'Warning (Issue)'   },
              { color: 'var(--alert)', label: 'Offline (Critical)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: l.color, boxShadow: `0 0 6px ${l.color}`,
                }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="cam-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
              Filter
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={hideOffline}
                onChange={e => setHideOffline(e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14, cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--ink-2)' }}>Hide offline nodes</span>
            </label>
          </div>

          {/* Node type legend */}
          <div className="cam-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
              Node Types
            </div>
            {[
              { label: 'HQ / Core',    desc: 'Central router node' },
              { label: 'Site',         desc: 'Branch or DC site'   },
            ].map(t => (
              <div key={t.label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="cam-card" style={{ padding: 16, marginTop: 'auto' }}>
            {[
              { label: 'Total Sites',   val: MOCK_STATS.sites,    warn: false },
              { label: 'Total Cameras', val: MOCK_STATS.cameras,  warn: false },
              { label: 'Active Alerts', val: MOCK_STATS.alerts,   warn: MOCK_STATS.alerts > 0 },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 12 }}>
                <span style={{ color: 'var(--ink-3)' }}>{s.label}</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16,
                  color: s.warn ? 'var(--warn)' : 'var(--ink)',
                }}>
                  {s.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* React Flow canvas */}
        <div style={{
          flex: 1, minWidth: 0,
          background: 'var(--canvas-bg)', borderRadius: 10,
          border: '1px solid var(--border)', overflow: 'hidden',
          position: 'relative',
        }}>
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
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
              gap={24} size={1}
              color="var(--grid-dot)"
              style={{ background: 'var(--canvas-bg)' }}
            />
            <Controls showInteractive={false} position="top-right" />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
