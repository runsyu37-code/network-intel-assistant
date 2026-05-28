import { useState, useMemo, useCallback } from 'react'
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  useNodesState, useEdgesState, type NodeTypes, type Node, type Edge,
} from 'reactflow'
import { Form, Input, InputNumber, Modal, Select, Popconfirm } from 'antd'
import { Plus, Pencil, Trash2, RotateCcw, Eye, Lock } from 'lucide-react'
import 'reactflow/dist/style.css'
import { initialNodes, initialEdges, HQ_CENTER, handleFromAngle, OPPOSITE_HANDLE } from '../components/topology/mockData'
import HQNode from '../components/topology/HQNode'
import SiteNode from '../components/topology/SiteNode'
import { useAuthStore } from '../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '../api/hierarchy'

const nodeTypes: NodeTypes = { hqNode: HQNode, siteNode: SiteNode }

const TOPO_POS_KEY = 'ssm.topo.positions'
const RADIUS = 360

const LINK_OPTIONS = [
  { value: '1 Gbps · MPLS', label: '1 Gbps · MPLS' },
  { value: '500 Mbps',      label: '500 Mbps'       },
  { value: 'VPN',           label: 'VPN (dashed)'   },
]

const MOCK_STATS = {
  cameras: 57, camerasOnline: 56, nvrs: 5, switches: 8, alerts: 1,
}

function sumF(data: { totalCameras: number; camerasOnline: number; totalNvrs: number; totalSwitches: number }[], key: keyof typeof data[0]): number {
  return data.reduce((s, d) => s + (Number(d[key]) || 0), 0)
}

function loadSavedPositions(): Record<string, { x: number; y: number }> {
  try { return JSON.parse(localStorage.getItem(TOPO_POS_KEY) ?? '{}') } catch { return {} }
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

export default function TopologyPage() {
  const canEdit = useAuthStore(s => s.canEdit())

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
  const liveStats = useMemo(() => {
    if (!summaryData?.length) return MOCK_STATS
    const cameras      = sumF(summaryData, 'totalCameras')
    const camerasOnline = sumF(summaryData, 'camerasOnline')
    return { cameras, camerasOnline, nvrs: sumF(summaryData, 'totalNvrs'), switches: sumF(summaryData, 'totalSwitches'), alerts: MOCK_STATS.alerts }
  }, [summaryData])

  const initNodes = useMemo(() => {
    const saved = loadSavedPositions()
    return initialNodes.map(n => ({ ...n, position: saved[n.id] ?? n.position }))
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [hideOffline, setHideOffline]   = useState(false)
  const [editMode, setEditMode]         = useState(false)
  const [siteModal, setSiteModal]       = useState(false)
  const [editSite, setEditSite]         = useState<Node | null>(null)
  const [form] = Form.useForm()

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const saved = loadSavedPositions()
    saved[node.id] = node.position
    localStorage.setItem(TOPO_POS_KEY, JSON.stringify(saved))
  }, [])

  const resetLayout = useCallback(() => {
    localStorage.removeItem(TOPO_POS_KEY)
    setNodes(initialNodes)
  }, [setNodes])

  const openAdd = () => {
    setEditSite(null)
    form.resetFields()
    setSiteModal(true)
  }

  const openEdit = (node: Node) => {
    setEditSite(node)
    form.setFieldsValue({
      label: node.data.label, sub: node.data.sub,
      count: node.data.count, status: node.data.status,
    })
    setSiteModal(true)
  }

  const handleOk = () => {
    form.validateFields().then(vals => {
      if (editSite) {
        setNodes(prev => prev.map(n =>
          n.id === editSite.id ? { ...n, data: { ...n.data, ...vals } } : n
        ))
      } else {
        const id  = `site-${Date.now()}`
        const idx = nodes.filter(n => n.type === 'siteNode').length
        const angle = (2 * Math.PI * idx) / (idx + 1) - Math.PI / 2
        const pos = {
          x: Math.round(HQ_CENTER.x + RADIUS * Math.cos(angle)),
          y: Math.round(HQ_CENTER.y + RADIUS * Math.sin(angle)),
        }
        setNodes(prev => [...prev, {
          id, type: 'siteNode', position: pos,
          data: { label: vals.label, sub: vals.sub, count: vals.count ?? 0, status: vals.status ?? 'ok' },
        }])
        const dash = vals.link === 'VPN'
        setEdges(prev => [...prev, makeEdge(id, pos, vals.link ?? '—', dash)])
        const saved = loadSavedPositions()
        saved[id] = pos
        localStorage.setItem(TOPO_POS_KEY, JSON.stringify(saved))
      }
      setSiteModal(false)
    })
  }

  const deleteSite = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
    const saved = loadSavedPositions()
    delete saved[id]
    localStorage.setItem(TOPO_POS_KEY, JSON.stringify(saved))
  }, [setNodes, setEdges])

  const siteNodes = nodes.filter(n => n.type === 'siteNode')

  const visibleNodes = hideOffline
    ? nodes.filter(n => (n.data as { status?: string }).status !== 'alert')
    : nodes
  const visibleEdges = hideOffline
    ? edges.filter(e => visibleNodes.find(n => n.id === e.target))
    : edges

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
            {liveStats.camerasOnline} Online
          </span>
          <span className="dl-stat">
            <span className="ds-dot" style={{ background: 'var(--alert)' }} />
            {liveStats.cameras - liveStats.camerasOnline} Offline
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
              { color: 'var(--ok)',     label: 'Online (Normal)'    },
              { color: 'var(--warn)',   label: 'Warning (Issue)'    },
              { color: 'var(--alert)',  label: 'Offline (Critical)' },
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

          {/* Sites management */}
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

          {/* Summary */}
          <div className="cam-card" style={{ padding: 16, marginTop: 'auto' }}>
            {[
              { label: 'Total Sites',   val: siteNodes.length,   warn: false },
              { label: 'Total Cameras', val: liveStats.cameras, warn: false },
              { label: 'Active Alerts', val: liveStats.alerts,  warn: liveStats.alerts > 0 },
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

      {/* Add / Edit Site modal */}
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
