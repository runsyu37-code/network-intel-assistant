import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background, BackgroundVariant, Controls,
  useNodesState, useEdgesState, type NodeTypes, type Node, type Edge, type ReactFlowInstance,
} from 'reactflow'
import { Form, Input, InputNumber, Modal, Select, Popconfirm, App } from 'antd'
import {
  Plus, Pencil, Trash2, RotateCcw, Eye, Lock, Save,
  Network, List, LayoutGrid, Search, X, AlertTriangle,
} from 'lucide-react'
import 'reactflow/dist/style.css'
import { HQ_CENTER, handleFromAngle, OPPOSITE_HANDLE, radialPos } from '../components/topology/mockData'
import HQNode from '../components/topology/HQNode'
import SiteNode from '../components/topology/SiteNode'
import { useAuthStore } from '../stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDashboardSummary, getSites, patchSitePosition,
  createSite, updateSite, deleteSite,
} from '../api/hierarchy'
import type { DashboardSummaryDto, SiteApi } from '../api/types'

// ── Topology viewport persistence ────────────────────────────────

const TOPO_VP_KEY = 'ssm.topo.viewport'

function loadTopoViewport(): { x: number; y: number; zoom: number } | null {
  try { return JSON.parse(localStorage.getItem(TOPO_VP_KEY) ?? 'null') } catch { return null }
}

// ── Topology helpers ──────────────────────────────────────────────

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
    id: `e-${siteId}`, type: 'straight',
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

function buildSiteNode(
  site: SiteApi, idx: number, total: number,
  summary: DashboardSummaryDto | undefined,
): Node {
  const pos = site.topology_x != null && site.topology_y != null
    ? { x: site.topology_x, y: site.topology_y }
    : radialPos(idx, total)
  const count = summary ? summary.totalCameras + summary.totalNvrs + summary.totalSwitches : 0
  return {
    id: site.Site_ID, type: 'siteNode', position: pos,
    data: { label: site.name, sub: site.location ?? site.code ?? '', count, status: deriveStatus(summary) },
  }
}

// ── TopologySection ───────────────────────────────────────────────

interface TopologyProps {
  apiSites: SiteApi[]
  summaryData: DashboardSummaryDto[]
  summaryMap: Map<string, DashboardSummaryDto>
  canEdit: boolean
}

function TopologySection({ apiSites, summaryData, summaryMap, canEdit }: TopologyProps) {
  const totalStats = useMemo(() => {
    if (!summaryData.length) return { cameras: 0, camerasOnline: 0, alerts: 0 }
    return {
      cameras:       sumF(summaryData, 'totalCameras'),
      camerasOnline: sumF(summaryData, 'camerasOnline'),
      alerts:        summaryData.filter(s => deriveStatus(s) !== 'ok').length,
    }
  }, [summaryData])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [initialized, setInitialized]   = useState(false)
  const [hideOffline, setHideOffline]   = useState(false)
  const [editMode, setEditMode]         = useState(false)
  const [siteModal, setSiteModal]       = useState(false)
  const [editSite, setEditSite]         = useState<Node | null>(null)
  const [vpSavedFlash, setVpSavedFlash] = useState(false)
  const [form] = Form.useForm()
  const rfRef = useRef<ReactFlowInstance | null>(null)

  useEffect(() => {
    if (!apiSites.length || initialized) return
    const hqPos = (() => { try { return JSON.parse(localStorage.getItem(HQ_POS_KEY) ?? 'null') } catch { return null } })()
    const hq: Node = {
      id: 'hq', type: 'hqNode',
      position: hqPos ?? HQ_CENTER,
      data: { label: 'HQ — Core', ip: '10.0.0.1 · core router', siteCount: apiSites.length },
    }
    const siteNodes = apiSites.map((s, i) => buildSiteNode(s, i, apiSites.length, summaryMap.get(s.Site_ID)))
    const siteEdges = apiSites.map((s, i) => {
      const pos = s.topology_x != null && s.topology_y != null
        ? { x: s.topology_x, y: s.topology_y }
        : radialPos(i, apiSites.length)
      return makeEdge(s.Site_ID, pos, '—')
    })
    setNodes([hq, ...siteNodes])
    setEdges(siteEdges)
    setInitialized(true)
    requestAnimationFrame(() => {
      const saved = loadTopoViewport()
      if (saved) rfRef.current?.setViewport(saved)
      else       rfRef.current?.fitView({ padding: 0.55 })
    })
  }, [apiSites, summaryMap, initialized])

  useEffect(() => {
    if (!summaryData.length || !initialized) return
    setNodes(prev => prev.map(n => {
      if (n.type !== 'siteNode') return n
      const s = summaryMap.get(n.id)
      if (!s) return n
      return { ...n, data: { ...n.data, count: s.totalCameras + s.totalNvrs + s.totalSwitches, status: deriveStatus(s) } }
    }))
  }, [summaryData, summaryMap, initialized])

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id === 'hq') { localStorage.setItem(HQ_POS_KEY, JSON.stringify(node.position)); return }
    patchSitePosition(node.id, node.position.x, node.position.y).catch(() => {})
  }, [])

  const resetLayout = useCallback(() => {
    localStorage.removeItem(HQ_POS_KEY)
    if (!apiSites.length) return
    const hq: Node = { id: 'hq', type: 'hqNode', position: HQ_CENTER,
      data: { label: 'HQ — Core', ip: '10.0.0.1 · core router', siteCount: apiSites.length } }
    const siteNodes = apiSites.map((s, i) =>
      buildSiteNode({ ...s, topology_x: null, topology_y: null }, i, apiSites.length, summaryMap.get(s.Site_ID)))
    const siteEdges = apiSites.map((s, i) => makeEdge(s.Site_ID, radialPos(i, apiSites.length), '—'))
    setNodes([hq, ...siteNodes])
    setEdges(siteEdges)
    apiSites.forEach((s, i) => {
      patchSitePosition(s.Site_ID, radialPos(i, apiSites.length).x, radialPos(i, apiSites.length).y).catch(() => {})
    })
    requestAnimationFrame(() => rfRef.current?.fitView({ padding: 0.55 }))
  }, [apiSites, summaryMap, setNodes, setEdges])

  const openAdd  = () => { setEditSite(null); form.resetFields(); setSiteModal(true) }
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
        const id  = `site-local-${Date.now()}`
        const idx = nodes.filter(n => n.type === 'siteNode').length
        const pos = radialPos(idx, idx + 1)
        setNodes(prev => [...prev, { id, type: 'siteNode', position: pos,
          data: { label: vals.label, sub: vals.sub, count: vals.count ?? 0, status: vals.status ?? 'ok' } }])
        setEdges(prev => [...prev, makeEdge(id, pos, vals.link ?? '—', vals.link === 'VPN')])
      }
      setSiteModal(false)
    })
  }

  const deleteSiteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
  }, [setNodes, setEdges])

  function saveTopoView() {
    const vp = rfRef.current?.getViewport()
    if (!vp) return
    localStorage.setItem(TOPO_VP_KEY, JSON.stringify(vp))
    setVpSavedFlash(true)
    setTimeout(() => setVpSavedFlash(false), 2000)
  }

  const siteNodes    = nodes.filter(n => n.type === 'siteNode')
  const visibleNodes = hideOffline ? nodes.filter(n => (n.data as { status?: string }).status !== 'alert') : nodes
  const visibleEdges = hideOffline ? edges.filter(e => visibleNodes.find(n => n.id === e.target)) : edges

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 24px 10px', justifyContent: 'flex-end' }}>
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
        <button
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', fontSize: 12 }}
          onClick={saveTopoView}
          title="บันทึกมุมมอง topology ปัจจุบัน"
        >
          <Save size={13} /> Save View
        </button>
        {vpSavedFlash && <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: 12 }}>✓ บันทึกแล้ว</span>}
        {editMode && (
          <button className="icon-btn" title="Reset layout" onClick={resetLayout}>
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', margin: '0 24px 24px', gap: 16 }}>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Filter</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={hideOffline} onChange={e => setHideOffline(e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14, cursor: 'pointer' }} />
              <span style={{ color: 'var(--ink-2)' }}>Hide offline nodes</span>
            </label>
          </div>

          <div className="cam-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Sites ({siteNodes.length})
              </div>
              {canEdit && editMode && (
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
                {canEdit && editMode && (
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="tbl-icon-btn" title="Edit" onClick={() => openEdit(n)}><Pencil size={11} /></button>
                    <Popconfirm title="Delete this site?" okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel" onConfirm={() => deleteSiteNode(n.id)}>
                      <button className="tbl-icon-btn" title="Delete"><Trash2 size={11} /></button>
                    </Popconfirm>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="cam-card" style={{ padding: 16, marginTop: 'auto' }}>
            {[
              { label: 'Total Sites',   val: siteNodes.length,   warn: false },
              { label: 'Total Cameras', val: totalStats.cameras, warn: false },
              { label: 'Active Alerts', val: totalStats.alerts,  warn: totalStats.alerts > 0 },
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
            nodes={visibleNodes} edges={visibleEdges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeDragStop={editMode ? onNodeDragStop : undefined}
            onInit={instance => { rfRef.current = instance }}
            nodesDraggable={editMode}
            nodeTypes={nodeTypes} nodeOrigin={[0.5, 0.5]}
            minZoom={0.3} maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1}
              color="var(--grid-dot)" style={{ background: 'var(--canvas-bg)' }} />
            <Controls showInteractive={false} position="top-right" />
          </ReactFlow>
        </div>
      </div>

      <Modal title={editSite ? 'Edit Site' : 'Add Site'} open={siteModal}
        onOk={handleOk} onCancel={() => setSiteModal(false)}
        okText={editSite ? 'Save' : 'Add'} destroyOnClose>
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

// ── List / Grid helpers ───────────────────────────────────────────

type Status = 'online' | 'warning' | 'offline'
type ViewMode = 'topology' | 'list' | 'grid'

interface Site {
  id: string; name: string; address: string
  buildings: number; cameras: number; status: Status; note: string
}

function toStatus(summary: DashboardSummaryDto | undefined): Status {
  if (!summary) return 'online'
  if (summary.camerasOffline > 0) return 'warning'
  return 'online'
}

function mapSite(a: SiteApi, summary: DashboardSummaryDto | undefined): Site {
  return {
    id:        a.Site_ID,
    name:      a.name,
    address:   a.location ?? '',
    buildings: summary?.totalBuildings ?? 0,
    cameras:   summary?.totalCameras   ?? 0,
    status:    toStatus(summary),
    note:      a.code ?? '',
  }
}

const BADGE: Record<Status, { cls: string; label: string }> = {
  online:  { cls: 'dl-badge ok',    label: 'Online'  },
  warning: { cls: 'dl-badge warn',  label: 'Warning' },
  offline: { cls: 'dl-badge alert', label: 'Offline' },
}

const DOT_BG: Record<Status, string> = {
  online:  'var(--ok)',
  warning: 'var(--warn)',
  offline: 'var(--alert)',
}

const CARD_STATUS: Record<Status, string> = {
  online: 'ok', warning: 'warn', offline: 'alert',
}

interface FormState { siteId: string; name: string; address: string; note: string }
const EMPTY_FORM: FormState = { siteId: '', name: '', address: '', note: '' }

const PAGE_SUB: Record<ViewMode, string> = {
  topology: 'Big-picture view of every site — drag to reposition, changes are saved.',
  list:     'รายชื่อสาขาและพื้นที่ทั้งหมด',
  grid:     'ดูภาพรวมทุกสาขา — คลิกเพื่อเข้าดูรายละเอียด',
}

// ── Main page ─────────────────────────────────────────────────────

export default function SitesOverviewPage() {
  const navigate    = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const canEdit     = useAuthStore(s => s.canEdit())

  const [viewMode, setViewMode]         = useState<ViewMode>('topology')
  const [q, setQ]                       = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalMode, setModalMode]       = useState<null | 'create' | Site>(null)
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null)
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)

  const { data: apiSites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: getSites,
    staleTime: 60_000,
  })
  const { data: summaryData = [] } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  })

  const summaryMap = useMemo(
    () => new Map(summaryData.map(s => [s.siteId, s])),
    [summaryData],
  )

  const sites = useMemo(
    () => isLoading ? [] : apiSites.map(a => mapSite(a, summaryMap.get(a.Site_ID))),
    [apiSites, isLoading, summaryMap],
  )

  const filtered = sites.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (!q) return true
    const lower = q.toLowerCase()
    return s.name.toLowerCase().includes(lower) || s.address.toLowerCase().includes(lower)
  })

  const createMut = useMutation({
    mutationFn: () => createSite({ Site_ID: form.siteId.trim(), name: form.name.trim(), location: form.address.trim() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  })
  const updateMut = useMutation({
    mutationFn: (id: string) => updateSite(id, { Site_ID: id, name: form.name.trim(), location: form.address.trim() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  })

  function openCreate() { setForm(EMPTY_FORM); setModalMode('create') }
  function openEdit(s: Site) {
    setForm({ siteId: s.id, name: s.name, address: s.address, note: s.note })
    setModalMode(s)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (modalMode === 'create' && !form.siteId.trim()) return
    setSaving(true)
    try {
      if (modalMode === 'create') {
        await createMut.mutateAsync()
        message.success('เพิ่ม Site สำเร็จ')
      } else if (modalMode && typeof modalMode === 'object') {
        await updateMut.mutateAsync(modalMode.id)
        message.success('บันทึกการเปลี่ยนแปลงสำเร็จ')
      }
      setModalMode(null)
    } catch {
      message.error('บันทึกไม่สำเร็จ — กรุณาลองใหม่')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      message.success(`ลบ ${deleteTarget.name} สำเร็จ`)
      setDeleteTarget(null)
    } catch {
      message.error('ลบไม่สำเร็จ — กรุณาลองใหม่')
    } finally { setSaving(false) }
  }

  const isEditing = modalMode !== null && modalMode !== 'create'
  const modalOpen = modalMode !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Sites</h1>
          <p className="page-sub">{PAGE_SUB[viewMode]}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="bldg-view-toggle">
            <button className={viewMode === 'topology' ? 'on' : ''} onClick={() => setViewMode('topology')}>
              <Network size={13} /> Topology
            </button>
            <button className={viewMode === 'list' ? 'on' : ''} onClick={() => setViewMode('list')}>
              <List size={13} /> List
            </button>
            <button className={viewMode === 'grid' ? 'on' : ''} onClick={() => setViewMode('grid')}>
              <LayoutGrid size={13} /> Grid
            </button>
          </div>
          {canEdit && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={14} /> Add Site
            </button>
          )}
        </div>
      </div>

      {viewMode !== 'topology' && (
        <div className="dl-toolbar">
          <div className="dl-search">
            <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
            <input placeholder="ค้นหาสาขา..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="dl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
          </select>
          <span className="dl-stat" style={{ marginLeft: 'auto' }}>{sites.length} สาขา</span>
        </div>
      )}

      {viewMode === 'topology' && (
        <TopologySection
          apiSites={apiSites}
          summaryData={summaryData}
          summaryMap={summaryMap}
          canEdit={canEdit}
        />
      )}

      {viewMode === 'list' && (
        <div className="dl-table-wrap">
          <table className="dl-table">
            <thead>
              <tr>
                <th>ชื่อสาขา</th>
                <th>ที่อยู่</th>
                <th>อาคาร</th>
                <th>กล้อง</th>
                <th>สถานะ</th>
                {canEdit && <th style={{ width: 80 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={canEdit ? 6 : 5} className="dl-empty">ไม่พบสาขา</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} onClick={() => navigate(`/dashboard/map?site=${s.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="td-name">{s.name}</div>
                    {s.note && <div className="td-sub">{s.note}</div>}
                  </td>
                  <td style={{ color: 'var(--ink-2)', fontSize: 12.5 }}>{s.address}</td>
                  <td className="td-mono">{s.buildings}</td>
                  <td className="td-mono">{s.cameras}</td>
                  <td><span className={BADGE[s.status].cls}>{BADGE[s.status].label}</span></td>
                  {canEdit && (
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="tbl-icon-btn" onClick={() => openEdit(s)} title="Edit"><Pencil size={13} /></button>
                        <button className="tbl-icon-btn" onClick={() => setDeleteTarget(s)} title="Delete"
                          style={{ color: 'var(--alert)' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'grid' && (
        <div style={{ padding: '4px 24px 32px', overflowY: 'auto', flex: 1 }}>
          <div className="bldg-grid">
            {filtered.length === 0 && (
              <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '24px 4px' }}>ไม่พบสาขา</div>
            )}
            {filtered.map(s => (
              <div
                key={s.id}
                className={`bldg-card ${CARD_STATUS[s.status]}`}
                onClick={() => navigate(`/dashboard/map?site=${s.id}`)}
              >
                <span className="bc-dot" style={{ background: DOT_BG[s.status] }} />
                <div className="bc-meta">
                  <div className="bc-title">{s.name}</div>
                  <div className="bc-sub">{s.address || s.note || '—'}</div>
                </div>
                <span className="bc-count">{s.cameras} CAMs</span>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 4, marginLeft: 4 }} onClick={e => e.stopPropagation()}>
                    <button className="tbl-icon-btn" title="Edit" onClick={() => openEdit(s)}><Pencil size={12} /></button>
                    <button className="tbl-icon-btn" title="Delete" style={{ color: 'var(--alert)' }}
                      onClick={() => setDeleteTarget(s)}><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="crud-overlay" onClick={() => setModalMode(null)}>
          <div className="crud-modal" onClick={e => e.stopPropagation()}>
            <div className="crud-modal-hd">
              <h2 className="crud-modal-title">{isEditing ? 'แก้ไข สาขา' : 'เพิ่ม สาขา'}</h2>
              <button className="crud-modal-close" onClick={() => setModalMode(null)}><X size={18} /></button>
            </div>
            <div className="crud-modal-body">
              {!isEditing && (
                <div className="form-group">
                  <label className="form-label">Site ID <span style={{ color: 'var(--alert)' }}>*</span></label>
                  <input className="form-ctrl mono" placeholder="e.g. S001"
                    value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">ชื่อสาขา</label>
                <input className="form-ctrl" placeholder="e.g. สาขารัชดา"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">ที่อยู่</label>
                <textarea className="form-ctrl" rows={3} placeholder="ระบุที่อยู่"
                  value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">หมายเหตุ</label>
                <input className="form-ctrl" placeholder="ระบุหมายเหตุ (ถ้ามี)"
                  value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="crud-modal-ft">
              <button className="btn-ghost" onClick={() => setModalMode(null)} disabled={saving}>ยกเลิก</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="crud-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="del-modal" onClick={e => e.stopPropagation()}>
            <div className="del-modal-body">
              <AlertTriangle size={48} className="del-modal-icon" />
              <h2 className="del-modal-title">ยืนยันการลบ</h2>
              <p className="del-modal-desc">
                คุณต้องการลบ <strong>{deleteTarget.name}</strong> ออกจากระบบ?<br />
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="del-modal-ft">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)} disabled={saving}>ยกเลิก</button>
              <button className="btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'กำลังลบ...' : 'ลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
