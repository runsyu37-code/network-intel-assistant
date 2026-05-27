import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useNodesState, useEdgesState, type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useQuery } from '@tanstack/react-query'
import { initialNodes, initialEdges } from '../components/topology/mockData'
import HQNode from '../components/topology/HQNode'
import SiteNode from '../components/topology/SiteNode'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getDashboardSummary, getAlertLogs } from '../api/hierarchy'
import type { DashboardSummaryDto, AlertLogApi } from '../api/types'

const nodeTypes: NodeTypes = { hqNode: HQNode, siteNode: SiteNode }

function aggregateSummary(rows: DashboardSummaryDto[]) {
  return rows.reduce((acc, r) => ({
    cameras: acc.cameras + r.totalCameras,
    camerasOnline: acc.camerasOnline + r.camerasOnline,
    camerasOffline: acc.camerasOffline + r.camerasOffline,
    camerasWarning: acc.camerasWarning + r.camerasWarning,
    nvrs: acc.nvrs + r.totalNvrs,
    nvrsOffline: acc.nvrsOffline + r.nvrsOffline,
    switches: acc.switches + r.totalSwitches,
    switchesOffline: acc.switchesOffline + r.switchesOffline,
  }), { cameras: 0, camerasOnline: 0, camerasOffline: 0, camerasWarning: 0, nvrs: 0, nvrsOffline: 0, switches: 0, switchesOffline: 0 })
}

function formatEventTime(raw: string): string {
  try {
    const d = new Date(raw + (raw.endsWith('Z') ? '' : 'Z'))
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch {
    return raw
  }
}

function alertDot(alert: AlertLogApi): string {
  const t = (alert.alert_type ?? '').toLowerCase()
  if (t.includes('offline') || t.includes('fail') || t.includes('error')) return 'var(--alert)'
  if (t.includes('warning') || t.includes('warn'))                         return 'var(--warn)'
  return 'var(--ok)'
}

export default function TopologyPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const { data: summary = [] } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 30_000,
  })

  const { data: alertLogs = [] } = useQuery({
    queryKey: ['alert-logs'],
    queryFn: () => getAlertLogs(),
    refetchInterval: 60_000,
    retry: false,
  })

  const agg = aggregateSummary(summary)
  const totalOnline = agg.camerasOnline + (agg.nvrs - agg.nvrsOffline) + (agg.switches - agg.switchesOffline)
  const totalOffline = agg.camerasOffline + agg.nvrsOffline + agg.switchesOffline
  const totalDevices = agg.cameras + agg.nvrs + agg.switches

  const statsLoaded = summary.length > 0

  const STATS = [
    {
      label: 'Cameras Online',
      val: statsLoaded ? `${agg.camerasOnline} / ${agg.cameras}` : '— / —',
      trend: agg.camerasOffline > 0 ? 'down' : 'up',
      trendText: statsLoaded
        ? agg.camerasOffline > 0 ? `${agg.camerasOffline} offline` : 'All online'
        : 'Loading…',
      ok: agg.camerasOffline === 0 && statsLoaded,
    },
    {
      label: 'NVRs',
      val: statsLoaded ? `${agg.nvrs - agg.nvrsOffline} / ${agg.nvrs}` : '— / —',
      trend: agg.nvrsOffline > 0 ? 'down' : '',
      trendText: statsLoaded
        ? agg.nvrsOffline > 0 ? `${agg.nvrsOffline} offline` : 'All recording'
        : 'Loading…',
    },
    {
      label: 'PoE Switches',
      val: statsLoaded ? `${agg.switches - agg.switchesOffline} / ${agg.switches}` : '— / —',
      trend: agg.switchesOffline > 0 ? 'down' : '',
      trendText: statsLoaded
        ? agg.switchesOffline > 0 ? `${agg.switchesOffline} offline` : 'All active'
        : 'Loading…',
    },
    {
      label: 'Active Nodes',
      val: statsLoaded ? `${totalOnline} / ${totalDevices}` : '— / —',
      trend: totalOffline > 0 ? 'down' : 'up',
      trendText: statsLoaded
        ? totalOffline > 0 ? `${totalOffline} offline alerts` : 'All systems go'
        : 'Loading…',
      ok: totalOffline === 0 && statsLoaded,
    },
  ]

  const recentAlerts = [...alertLogs]
    .sort((a, b) => new Date(b.alerted_at ?? '').getTime() - new Date(a.alerted_at ?? '').getTime())
    .slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-head">
        <div>
          <h1>Network Topology</h1>
          <p className="page-sub">Big-picture view of every site connecting back to HQ — click any node to drill in.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {statsLoaded ? (
            <>
              <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--ok)' }} />{totalOnline} Online</span>
              <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--alert)' }} />{totalOffline} Offline</span>
            </>
          ) : (
            <span className="dl-stat" style={{ color: 'var(--ink-3)' }}>Loading…</span>
          )}
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
            <h3>Recent Alerts</h3>
            <a className="events-viewall" href="#">View All</a>
          </div>
          {recentAlerts.length === 0 ? (
            <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--ink-4)' }}>
              {alertLogs.length === 0 ? 'No recent alerts' : 'No alerts to display'}
            </div>
          ) : (
            recentAlerts.map(e => (
              <div key={e.id} className="event-row">
                <span className="event-dot" style={{ background: alertDot(e) }} />
                <span className="event-time">{formatEventTime(e.alerted_at ?? '')}</span>
                <span className="event-device">{e.device_name ?? e.device_id ?? '—'}</span>
                <span className="event-msg">{e.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
