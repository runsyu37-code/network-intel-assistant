import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, InputNumber, Modal, Select, Popconfirm } from 'antd'
import { Plus, Pencil, Trash2, Map, LayoutGrid } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { getHierarchyTree } from '../api/hierarchy'
import type { BuildingTreeDto, FloorTreeDto } from '../api/types'

type Status = 'ok' | 'warn' | 'alert'
type ViewMode = 'map' | 'grid'

interface FloorData {
  id: string; label: string; cameras: number; camerasOnline: number
}
interface BuildingData {
  id: string; title: string; status: Status
  floorList: FloorData[]; cameras: number; nvrs: number
}

const SITE_LABELS: Record<string, string> = {
  'hq':     'HQ Bangkok',
  'site-b': 'Site B — Chiang Mai DC',
  'site-c': 'Site C — Phuket Branch',
  'site-d': 'Site D — Khon Kaen',
  'site-e': 'Site E — Hat Yai',
}

const INIT_BUILDINGS: BuildingData[] = [
  {
    id: 'a', title: 'อาคาร A', status: 'warn', cameras: 48, nvrs: 2,
    floorList: [
      { id: 'a-f6', label: 'F6', cameras: 8, camerasOnline: 8 },
      { id: 'a-f5', label: 'F5', cameras: 8, camerasOnline: 7 },
      { id: 'a-f4', label: 'F4', cameras: 8, camerasOnline: 8 },
      { id: 'a-f3', label: 'F3', cameras: 8, camerasOnline: 8 },
      { id: 'a-f2', label: 'F2', cameras: 8, camerasOnline: 6 },
      { id: 'a-f1', label: 'F1', cameras: 8, camerasOnline: 8 },
    ],
  },
  {
    id: 'b', title: 'อาคาร B', status: 'ok', cameras: 24, nvrs: 1,
    floorList: [
      { id: 'b-f4', label: 'F4', cameras: 6, camerasOnline: 6 },
      { id: 'b-f3', label: 'F3', cameras: 6, camerasOnline: 6 },
      { id: 'b-f2', label: 'F2', cameras: 6, camerasOnline: 6 },
      { id: 'b-f1', label: 'F1', cameras: 6, camerasOnline: 6 },
    ],
  },
  {
    id: 'c', title: 'อาคาร C', status: 'ok', cameras: 16, nvrs: 1,
    floorList: [
      { id: 'c-f2', label: 'F2', cameras: 8, camerasOnline: 8 },
      { id: 'c-f1', label: 'F1', cameras: 8, camerasOnline: 8 },
    ],
  },
]

function buildingStatus(alertCount: number): Status {
  if (alertCount === 0) return 'ok'
  if (alertCount <= 2)  return 'warn'
  return 'alert'
}

function mapBuilding(b: BuildingTreeDto): BuildingData {
  const totalCameras = b.floors.reduce((s, f) => s + f.cameraCount, 0)
  return {
    id: b.buildingId,
    title: b.buildingName,
    status: buildingStatus(b.alertCount),
    cameras: totalCameras,
    nvrs: b.nvrCount,
    floorList: [...b.floors]
      .sort((a, b) => b.floorNumber - a.floorNumber)
      .map((f: FloorTreeDto) => ({
        id: f.floorId,
        label: f.floorName ?? `F${f.floorNumber}`,
        cameras: f.cameraCount,
        camerasOnline: Math.max(0, f.cameraCount - f.alertCount),
      })),
  }
}

const DOT_COLOR: Record<Status, string> = {
  ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)',
}
const STATUS_FILL: Record<Status, string> = {
  ok:    'rgba(22,163,74,.10)',
  warn:  'rgba(217,119,6,.13)',
  alert: 'rgba(220,38,38,.11)',
}
const STATUS_STROKE: Record<Status, string> = {
  ok:    'rgba(22,163,74,.55)',
  warn:  'rgba(217,119,6,.60)',
  alert: 'rgba(220,38,38,.55)',
}

// Fixed footprint positions for the first 3 buildings (SVG 880×500)
const FIXED_POS: Record<string, { x: number; y: number; w: number; h: number }> = {
  a: { x: 360, y:  42, w: 195, h: 295 },
  b: { x:  72, y: 112, w: 175, h: 200 },
  c: { x: 618, y: 255, w: 210, h: 130 },
}
// Slots for user-added buildings
const OVERFLOW_SLOTS = [
  { x:  72, y: 355, w: 155, h: 85 },
  { x: 260, y: 380, w: 155, h: 85 },
  { x: 618, y: 400, w: 155, h: 85 },
  { x: 450, y: 375, w: 140, h: 85 },
]

function SiteMapCanvas({ buildings, onNavigate }: { buildings: BuildingData[]; onNavigate: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const W = 880, H = 500

  let overflowIdx = 0
  const bldgWithPos = buildings.map(b => ({
    ...b,
    pos: FIXED_POS[b.id] ?? OVERFLOW_SLOTS[overflowIdx++] ?? { x: 72, y: 420, w: 140, h: 70 },
  }))

  return (
    <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block', margin: '0 auto', borderRadius: 10, border: '1px solid var(--border)' }}
      >
        <rect x={0} y={0} width={W} height={H} fill="var(--surface-2)" />
        <rect x={28} y={28} width={W-56} height={H-56} rx={10} fill="var(--canvas-bg)" stroke="var(--border-2)" strokeWidth={1.5} strokeDasharray="6 3" />
        <rect x={44}  y={44}  width={100} height={52}  rx={6} fill="rgba(22,163,74,.08)" />
        <rect x={730} y={44}  width={108} height={72}  rx={6} fill="rgba(22,163,74,.08)" />
        <rect x={44}  y={420} width={290} height={48}  rx={6} fill="rgba(22,163,74,.08)" />
        <rect x={618} y={400} width={220} height={68}  rx={6} fill="rgba(22,163,74,.08)" />
        {[
          [70, 65], [95, 65], [755, 62], [780, 62], [810, 62],
          [68, 440], [90, 440], [112, 440], [145, 440],
          [660, 420], [690, 420], [720, 420],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={9} fill="rgba(22,163,74,.22)" stroke="rgba(22,163,74,.35)" strokeWidth={1} />
        ))}
        <rect x={28} y={360} width={W-56} height={38} fill="var(--border)" opacity={0.35} />
        <line x1={28} y1={379} x2={W-28} y2={379} stroke="var(--surface-2)" strokeWidth={1.5} strokeDasharray="16 10" opacity={0.6} />
        <rect x={265} y={28} width={32} height={332} fill="var(--border)" opacity={0.25} />
        <rect x={580} y={200} width={32} height={160} fill="var(--border)" opacity={0.20} />
        <rect x={247} y={178} width={113} height={20} rx={3}
          fill="var(--surface-3)" stroke="var(--border-2)" strokeWidth={1} strokeDasharray="4 3" />
        <text x={303} y={192} textAnchor="middle" fontSize={8} fill="var(--ink-4)" fontWeight="500">walkway</text>
        <rect x={72} y={328} width={175} height={28} rx={3} fill="var(--surface-3)" stroke="var(--border-2)" strokeWidth={1} />
        {[93, 116, 139, 162, 185, 208, 231].map((x, i) => (
          <line key={i} x1={x} y1={328} x2={x} y2={356} stroke="var(--border-2)" strokeWidth={1} />
        ))}
        <text x={159} y={346} textAnchor="middle" fontSize={8} fill="var(--ink-4)" fontWeight="500" letterSpacing=".06em">PARKING</text>
        <rect x={396} y={360} width={88} height={38} fill="var(--surface)" stroke="var(--border-2)" strokeWidth={1.5} />
        <text x={440} y={384} textAnchor="middle" fontSize={9} fill="var(--ink-3)" fontWeight="700" letterSpacing=".08em">ENTRANCE</text>
        {bldgWithPos.map(b => {
          const { x, y, w, h } = b.pos
          const isHov = hovered === b.id
          return (
            <g
              key={b.id}
              onClick={() => onNavigate(b.id)}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect x={x+4} y={y+4} width={w} height={h} rx={6} fill="rgba(0,0,0,.12)" />
              <rect
                x={x} y={y} width={w} height={h} rx={6}
                fill={isHov ? STATUS_FILL[b.status].replace('.10', '.18').replace('.13', '.22').replace('.11', '.20') : STATUS_FILL[b.status]}
                stroke={STATUS_STROKE[b.status]}
                strokeWidth={isHov ? 2.5 : 1.8}
              />
              <line x1={x+8} y1={y+8} x2={x+w-8} y2={y+8} stroke={STATUS_STROKE[b.status]} strokeWidth={1} opacity={0.4} />
              <line x1={x+8} y1={y+h-8} x2={x+w-8} y2={y+h-8} stroke={STATUS_STROKE[b.status]} strokeWidth={1} opacity={0.4} />
              <text x={x + w/2} y={y + h/2 - 12} textAnchor="middle"
                fontSize={13} fontWeight="700" fill="var(--ink)" fontFamily="Inter, sans-serif">
                {b.title}
              </text>
              <text x={x + w/2} y={y + h/2 + 6} textAnchor="middle"
                fontSize={10.5} fill="var(--ink-3)" fontFamily="Inter, sans-serif">
                {b.floorList.length} floors
              </text>
              <rect x={x + w/2 - 30} y={y + h/2 + 14} width={60} height={16} rx={8}
                fill={STATUS_FILL[b.status]} stroke={STATUS_STROKE[b.status]} strokeWidth={1} />
              <text x={x + w/2} y={y + h/2 + 25} textAnchor="middle"
                fontSize={9.5} fontWeight="600" fill="var(--ink-2)" fontFamily="'JetBrains Mono', monospace">
                {b.cameras} CAMs
              </text>
              <circle cx={x + 16} cy={y + 16} r={5} fill={DOT_COLOR[b.status]} />
            </g>
          )
        })}
        <g transform={`translate(${W-46}, 52)`}>
          <circle cx={0} cy={0} r={16} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
          <text x={0} y={5} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--ink)" fontFamily="Inter, sans-serif">N</text>
          <polygon points="0,-13 3,-5 -3,-5" fill="var(--accent)" />
        </g>
        <g transform={`translate(36, ${H-36})`}>
          <line x1={0} y1={0} x2={60} y2={0} stroke="var(--ink-3)" strokeWidth={2} />
          <line x1={0} y1={-4} x2={0} y2={4} stroke="var(--ink-3)" strokeWidth={1.5} />
          <line x1={60} y1={-4} x2={60} y2={4} stroke="var(--ink-3)" strokeWidth={1.5} />
          <text x={30} y={-6} textAnchor="middle" fontSize={8} fill="var(--ink-4)" fontWeight="500">50 m</text>
        </g>
      </svg>
    </div>
  )
}

function IsometricSVG() {
  return (
    <svg viewBox="0 0 100 100" style={{ height: 80, strokeWidth: 1.5, stroke: 'var(--ink-3)', fill: 'none', display: 'block' }}>
      <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" />
      <path d="M50 10 L50 50 L90 70 M10 70 L50 50 M10 30 L50 50 L90 30" />
      <path d="M20 40 L50 55 L80 40 M20 50 L50 65 L80 50 M20 60 L50 75 L80 60" />
    </svg>
  )
}

interface CardProps {
  building: BuildingData; canEdit: boolean
  onViewBuilding: () => void; onViewPlan: (floorId: string) => void
  onEdit: () => void; onDelete: () => void
}

function BuildingCard({ building, canEdit, onViewBuilding, onViewPlan, onEdit, onDelete }: CardProps) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`bldg-card-v2${expanded ? ' expanded' : ''}`} onClick={() => setExpanded(e => !e)}>
      <div className="bcv2-header" onClick={e => { e.stopPropagation(); onViewBuilding() }}>
        <div className="bcv2-title">
          {building.title}
          <span className="bcv2-dot" style={{ background: DOT_COLOR[building.status] }} />
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
            <button className="tbl-icon-btn" title="Edit" onClick={onEdit}><Pencil size={13} /></button>
            <Popconfirm title="Delete this building?" okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel" onConfirm={onDelete}>
              <button className="tbl-icon-btn" title="Delete"><Trash2 size={13} /></button>
            </Popconfirm>
          </div>
        )}
      </div>
      <div className="bcv2-visual"><IsometricSVG /></div>
      <div className="bcv2-stats">
        <div className="bcv2-stat">
          <div className="bcv2-stat-val">{building.floorList.length}</div>
          <div className="bcv2-stat-lbl">Floors</div>
        </div>
        <div className="bcv2-stat">
          <div className="bcv2-stat-val">{building.cameras}</div>
          <div className="bcv2-stat-lbl">Cameras</div>
        </div>
        <div className="bcv2-stat">
          <div className="bcv2-stat-val">{building.nvrs}</div>
          <div className="bcv2-stat-lbl">NVRs</div>
        </div>
      </div>
      {expanded && (
        <div className="bcv2-floors" onClick={e => e.stopPropagation()}>
          {building.floorList.map(floor => {
            const pct = floor.cameras > 0 ? Math.round((floor.camerasOnline / floor.cameras) * 100) : 100
            return (
              <div key={floor.id} className="bcv2-floor-row">
                <div className="bcv2-floor-info">
                  <span className="bcv2-floor-name">{floor.label}</span>
                  <span className="bcv2-floor-count">{floor.cameras} CAMs</span>
                  <div
                    className="bcv2-bar-wrap"
                    title={`${floor.camerasOnline} Online, ${floor.cameras - floor.camerasOnline} Alert`}
                  >
                    <div className="bcv2-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button className="bcv2-btn-view" onClick={e => { e.stopPropagation(); onViewPlan(floor.id) }}>View Plan</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SitesPage() {
  const navigate   = useNavigate()
  const { siteId } = useParams<{ siteId: string }>()
  const canEdit    = useAuthStore(s => s.canEdit())

  const [view, setView]             = useState<ViewMode>('map')
  const [buildings, setBuildings]   = useState<BuildingData[]>(INIT_BUILDINGS)

  const { data: hierarchy, isLoading } = useQuery({ queryKey: ['hierarchy'], queryFn: getHierarchyTree, staleTime: 60_000 })

  const apiSite = hierarchy?.find(s =>
    s.siteId === siteId || s.siteCode?.toLowerCase() === siteId
  )

  useEffect(() => {
    if (!apiSite?.buildings.length) return
    setBuildings(apiSite.buildings.map(mapBuilding))
  }, [apiSite])

  const siteLabel = apiSite?.siteName ?? SITE_LABELS[siteId ?? ''] ?? siteId ?? 'Unknown Site'
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<BuildingData | null>(null)
  const [form] = Form.useForm()

  const openAdd = () => { setEditTarget(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (b: BuildingData) => {
    setEditTarget(b)
    form.setFieldsValue({ title: b.title, status: b.status, cameras: b.cameras, nvrs: b.nvrs })
    setModalOpen(true)
  }
  const handleOk = () => {
    form.validateFields().then(vals => {
      if (editTarget) {
        setBuildings(prev => prev.map(b => b.id === editTarget.id ? { ...b, ...vals } : b))
      } else {
        setBuildings(prev => [...prev, { id: `bldg-${Date.now()}`, floorList: [], cameras: vals.cameras ?? 0, nvrs: vals.nvrs ?? 0, title: vals.title, status: vals.status }])
      }
      setModalOpen(false)
    })
  }

  if (isLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', height: '100%' }}>
      Loading site...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>{siteLabel}</h1>
          <p className="page-sub">
            {view === 'map'
              ? 'Top-view site plan · click a building to drill in'
              : 'Click a card to expand floors · click the title to drill into building detail'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="bldg-view-toggle">
            <button className={view === 'map'  ? 'on' : ''} onClick={() => setView('map')}>
              <Map size={13} /> Map
            </button>
            <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>
              <LayoutGrid size={13} /> Grid
            </button>
          </div>
          {canEdit && (
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={14} /> Add Building
            </button>
          )}
        </div>
      </div>

      {view === 'map' ? (
        <SiteMapCanvas buildings={buildings} onNavigate={id => navigate(`/dashboard/buildings/${id}`)} />
      ) : (
        <div style={{ padding: '0 24px 32px', overflowY: 'auto', flex: 1 }}>
          <div className="bldg-grid-v2">
            {buildings.map(b => (
              <BuildingCard
                key={b.id} building={b} canEdit={canEdit}
                onViewBuilding={() => navigate(`/dashboard/buildings/${b.id}`)}
                onViewPlan={floorId => navigate(`/dashboard/floors/${floorId}`)}
                onEdit={() => openEdit(b)}
                onDelete={() => setBuildings(prev => prev.filter(x => x.id !== b.id))}
              />
            ))}
          </div>
        </div>
      )}

      <Modal
        title={editTarget ? 'Edit Building' : 'Add Building'}
        open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)}
        okText={editTarget ? 'Save' : 'Add'} destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Building Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. อาคาร D" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="ok" rules={[{ required: true }]}>
            <Select options={[{ value: 'ok', label: 'Online' }, { value: 'warn', label: 'Warning' }, { value: 'alert', label: 'Offline' }]} />
          </Form.Item>
          <Form.Item name="cameras" label="Camera Count" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="nvrs" label="NVR Count" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
