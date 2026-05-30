import { useState, useMemo, useCallback, useEffect } from 'react'
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  useNodesState, useEdgesState, type NodeTypes, type Node, type Edge,
} from 'reactflow'
import { Form, Input, InputNumber, Modal, Select, Popconfirm } from 'antd'
import { Plus, Pencil, Trash2, RotateCcw, Eye, Lock } from 'lucide-react'
import 'reactflow/dist/style.css'
import { HQ_CENTER, handleFromAngle, OPPOSITE_HANDLE, radialPos } from '../components/topology/mockData'
import HQNode from '../components/topology/HQNode'
import SiteNode from '../components/topology/SiteNode'
import { useAuthStore } from '../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getSites, patchSitePosition } from '../api/hierarchy'
import type { DashboardSummaryDto } from '../api/types'

const nodeTypes: NodeTypes = { hqNode: HQNode, siteNode: SiteNode }
const HQ_POS_KEY = 'ssm.topo.hq'

const LINK_OPTIONS = [
  { value: '1 Gbps · MPLS', label: '1 Gbps · MPLS' },
  { value: '500 Mbps',      label: '500 Mbps'       },
  { value: 'VPN',           label: 'VPN (dashed)'   },
]

function deriveStatus(s: DashboardSummaryDto | undefined): 'ok' | 'warn' | 'alert' {
  if (!s) return 'ok'
  if (s.nvrsOffline > 0 || s.switchesOffline > 0) return 'alert'
  if (s.camerasOffline > 0 || s.camerasWarning > 0) return 'warn'
  return 'ok'
}

function sumF(data: DashboardSummaryDto[], key: keyof DashboardSummaryDto): number {
  return data.reduce((acc, d) => acc + (Number(d[key]) || 0), 0)
}

function makeEdge(siteId: string, pos: { x: number; y: number }, label: string, dash = false): Edge {
  const deg  = Math.atan2(pos.y - HQ_CENTER.y, pos.x - HQ_CENTER.x) * (180 / Math.PI)
  const srcH = handleFromAngle(deg)
  const tgtH = OPPOSITE_HANDLE[srcH]
  return {
    id: `e-${siteId}`,
    type: 'straight',
    source: 'hq', target: siteId,
    sourceHandle: srcH, targetHandle: tgtH,
    label,
    labelStyle:     { fill: 'var(--ink-3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" },
    labelBgStyle:   { fill: 'var(--canvas-bg)', fillOpacity: 0.85 },
    labelBgPadding: [4, 6] as [number, number],
    style: {
      stroke: 'var(--edge-stroke)', strokeWidth: 1.5,
      strokeLinecap: 'round' as const,
      ...(dash ? { strokeDasharray: '6 4' } : {}),
    },
  }
}

function buildSiteNode(site: { Site_ID: string; name: string; code: string | null; location: string | null; topology_x: number | null; topology_y: number | null }, idx: number, total: number, summary: DashboardSummaryDto | undefined): Node {
  const pos = site.topology_x != null && site.topology_y != null
    ? { x: site.topology_x, y: site.topology_y }
    : radialPos(idx, total)
  const count = summary ? summary.totalCameras + summary.totalNvrs + summary.totalSwitches : 0
  return {
    id: site.Site_ID, type: 'siteNode', position: pos,
    data: { label: site.name, sub: site.location ?? site.code ?? '', count, status: deriveStatus(summary) },
  }
}

export default function TopologyPage() {
  const canEdit = useAuthStore(s => s.canEdit())

  const { data: sitesData } = useQuery({
    queryKey: ['sites'],
    queryFn: getSites,
    staleTime: 60_000,
  })
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  })

  const summaryMap = useMemo(
    () => new Map((summaryData ?? []).map(s => [s.siteId, s])),
    [summaryData],
  )

  const totalStats = useMemo(() => {
    if (!summaryData?.length) return { cameras: 0, camerasOnline: 0, alerts: 0 }
    return {
      cameras:       sumF(summaryData, 'totalCameras'),
      camerasOnline: sumF(summaryData, 'camerasOnline'),
      alerts: summaryData.filter(s => deriveStatus(s) !== 'ok').length,
    }
  }, [summaryData])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [initialized, setInitialized]   = useState(false)

  // First load: build nodes from API
  useEffect(() => {
    if (!sitesData?.length || initialized) return
    const hqPos = (() => { try { return JSON.parse(localStorage.getItem(HQ_POS_KEY) ?? 'null') } catch { return null } })()
    const hq: Node = {
      id: 'hq', type: 'hqNode',
      position: hqPos ?? HQ_CENTER,
      data: { label: 'HQ — Core', ip: '10.0.0.1 · core router', siteCount: sitesData.length },
    }
    const siteNodes = sitesData.map((s, i) => buildSiteNode(s, i, sitesData.length, summaryMap.get(s.Site_ID)))
    const siteEdges = sitesData.map((s, i) => {
      const pos = s.topology_x != null && s.topology_y != null ? { x: s.topology_x, y: s.topology_y } : radialPos(i, sitesData.length)
      return makeEdge(s.Site_ID, pos, '—')
    })
    setNodes([hq, ...siteNodes])
    setEdges(siteEdges)
    setInitialized(true)
  }, [sitesData, summaryMap, initialized])

  // Live status/count refresh without resetting positions
  useEffect(() => {
    if (!summaryData?.length || !initialized) return
    setNodes(prev => prev.map(n => {
      if (n.type !== 'siteNode') return n
      const s = summaryMap.get(n.id)
      if (!s) return n
      return { ...n, data: { ...n.data, count: s.totalCameras + s.totalNvrs + s.totalSwitches, status: deriveStatus(s) } }
    }))
  }, [summaryData, summaryMap, initialized])

  const [hideOffline, setHideOffline] = useState(false)
  const [editMode, setEditMode]       = useState(false)
  const [siteModal, setSiteModal]     = useState(false)
  const [editSite, setEditSite]       = useState<Node | null>(null)
  const [form] = Form.useForm()

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id === 'hq') {
      localStorage.setItem(HQ_POS_KEY, JSON.stringify(node.position))
      return
    }
    patchSitePosition(node.id, node.position.x, node.position.y).catch(() => {})
  }, [])

  const resetLayout = useCallback(() => {
    localStorage.removeItem(HQ_POS_KEY)
    if (!sitesData?.length) return
    const hq: Node = { id: 'hq', type: 'hqNode', position: HQ_CENTER,
      data: { label: 'HQ — Core', ip: '10.0.0.1 · core router', siteCount: sitesData.length } }
    const siteNodes = sitesData.map((s, i) => buildSiteNode({ ...s, topology_x: null, topology_y: null }, i, sitesData.length, summaryMap.get(s.Site_ID)))
    const siteEdges = sitesData.map((s, i) => makeEdge(s.Site_ID, radialPos(i, sitesData.length), '—'))
    setNodes([hq, ...siteNodes])
    setEdges(siteEdges)
    sitesData.forEach((s, i) => {
      const pos = radialPos(i, sitesData.length)
      patchSitePosition(s.Site_ID, pos.x, pos.y).catch(() => {})
    })
  }, [sitesData, summaryMap, setNodes, setEdges])

  const openAdd = () => { setEditSite(null); form.resetFields(); setSiteModal(true) }
  const openEdit = (node: Node) => {
    setEditSite(node)
    form.setFieldsValue({ label: node.data.label, sub: node.data.sub, count: node.data.count, status: node.data.status })
    setSiteModal(true)
  }

  const handleOk = () => {
    form.validateFields().then(vals => {
      if (editSite) {
        setNodes(prev => prev.map(n => n.id === editSite.id ? { ...n, data: { ...n.data, ...vals } } : n))
      } else {
        const id    = `site-local-${Date.now()}`
        const idx   = nodes.filter(n => n.type === 'siteNode').length
        const total = idx + 1
        const pos   = radialPos(idx, total)
        setNodes(prev => [...prev, { id, type: 'siteNode', position: pos,
          data: { label: vals.label, sub: vals.sub, count: vals.count ?? 0, status: vals.status ?? 'ok' } }])
        setEdges(prev => [...prev, makeEdge(id, pos, vals.link ?? '—', vals.link === 'VPN')])
      }
      setSiteModal(false)
    })
  }

  const deleteSite = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
  }, [setNodes, setEdges])

  const siteNodes    = nodes.filter(n => n.type === 'siteNode')
  const visibleNodes = hideOffline ? nodes.filter(n => (n.data as { status?: string }).status !== 'alert') : nodes
  const visibleEdges = hideOffline ? edges.filter(e => visibleNodes.find(n => n.id === e.target)) : edges

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <div className="page-head">
        <div>
          <h1>Network Topology</h1>
          <p className="page-sub">Big-picture view of every site — drag to reposition, changes are saved.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="dl-stat">
            <span className="ds-dot" style={{ background: 'var(--ok)' }} />
            {totalStats.camerasOnline} Online
          </span>
          <span className="dl-stat">
            <span className="ds-dot" style={{ background: 'var(--alert)' }} />
            {totalStats.cameras - totalStats.camerasOnline} Offline
          </span>
          {canEdit && (
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 999, padding: 3, border: '1px solid var(--border)' }}>
              {([false, true] as const).map(isEdit => (
                <button
                  key={String(isEdit)}
                  onClick={() => setEditMode(isEdit)}
                  style={{
                    padding: '5px 14px', fontSize: 12, fontWeight: 600,
                    borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: editMode === isEdit ? 'var(--surface)' : 'transparent',
                    color: editMode === isEdit ? 'var(--ink)' : 'var(--ink-3)',
                    boxShadow: editMode === isEdit ? 'var(--shadow-1)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background .15s, color .15s',
                  }}
                >
                  {isEdit ? <Lock size={12} /> : <Eye size={12} />}
                  {isEdit ? 'Edit' : 'View'}
                </button>
              ))}
            </div>
          )}
          {editMode && (
            <button className="icon-btn" title="Reset layout" onClick={resetLayout}>
              <RotateCcw size={14} />
            </button>
          )}
          {canEdit && editMode && (
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={14} /> Add Site
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', margin: '0 24px 24px', gap: 16 }}>

        {/* Left panel */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="cam-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
              Status Legend
            </div>
            {[
              { color: 'var(--ok)',    label: 'Online (Normal)'    },
              { color: 'var(--warn)',  label: 'Warning (Issue)'    },
              { color: 'var(--alert)', label: 'Offline (Critical)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                {l.label}
              </div>
            ))}
          </div>

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

          <div className="cam-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Sites ({siteNodes.length})
              </div>
              {canEdit && (
                <button className="btn-primary" style={{ padding: '2px 8px', fontSize: 11, gap: 4 }} onClick={openAdd}>
                  <Plus size={10} /> Add
                </button>
              )}
            </div>
            {siteNodes.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: n.data.status === 'ok' ? 'var(--ok)' : n.data.status === 'warn' ? 'var(--warn)' : 'var(--alert)',
                }} />
                <span style={{ flex: 1, fontSize: 11, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.data.label}
                </span>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="tbl-icon-btn" title="Edit" onClick={() => openEdit(n)}>
                      <Pencil size={11} />
                    </button>
                    <Popconfirm
                      title="Delete this site?"
                      okText="Delete" okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                      onConfirm={() => deleteSite(n.id)}
                    >
                      <button className="tbl-icon-btn" title="Delete">
                        <Trash2 size={11} />
                      </button>
                    </Popconfirm>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="cam-card" style={{ padding: 16, marginTop: 'auto' }}>
            {[
              { label: 'Total Sites',   val: siteNodes.length,       warn: false },
              { label: 'Total Cameras', val: totalStats.cameras,     warn: false },
              { label: 'Active Alerts', val: totalStats.alerts,      warn: totalStats.alerts > 0 },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 12 }}>
                <span style={{ color: 'var(--ink-3)' }}>{s.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16, color: s.warn ? 'var(--warn)' : 'var(--ink)' }}>
                  {s.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div style={{
          flex: 1, minWidth: 0,
          background: 'var(--canvas-bg)', borderRadius: 10,
          border: '1px solid var(--border)', overflow: 'hidden', position: 'relative',
        }}>
          {editMode && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, background: 'var(--warn-soft)', border: '1px solid var(--warn)',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: 6,
              pointerEvents: 'none',
            }}>
              <Lock size={12} /> Edit mode — drag to reposition · positions saved automatically
            </div>
          )}
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={editMode ? onNodeDragStop : undefined}
            nodesDraggable={editMode}
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

      <Modal
        title={editSite ? 'Edit Site' : 'Add Site'}
        open={siteModal}
        onOk={handleOk}
        onCancel={() => setSiteModal(false)}
        okText={editSite ? 'Save' : 'Add'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="label" label="Site Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Site G — Rayong" />
          </Form.Item>
          <Form.Item name="sub" label="Location" rules={[{ required: true }]}>
            <Input placeholder="e.g. Mueang, RYG" />
          </Form.Item>
          <Form.Item name="count" label="Device Count" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="ok">
            <Select options={[
              { value: 'ok',    label: 'Online'  },
              { value: 'warn',  label: 'Warning' },
              { value: 'alert', label: 'Offline' },
            ]} />
          </Form.Item>
          {!editSite && (
            <Form.Item name="link" label="Link Type" initialValue="1 Gbps · MPLS">
              <Select options={LINK_OPTIONS} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
