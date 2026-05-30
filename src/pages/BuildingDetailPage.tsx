import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Modal, Select, Popconfirm } from 'antd'
import { LayoutList, Layers, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { getBuildingById, getFloors } from '../api/hierarchy'

type Status = 'ok' | 'warn' | 'alert'
type ViewMode = 'list' | 'cross'

interface Floor {
  id: string
  num: string
  status: Status
  label: string
  count: string
}

const STATUS_COLOR: Record<Status, string> = {
  ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)',
}


/* ── Building cross-section SVG ─────────────────────────────── */
const FX = 60; const FW = 420; const FH = 64
const DX = 72; const DY = 36;  const PAD = 54

const FILL: Record<Status, string> = {
  ok:    'rgba(22,163,74,.10)',
  warn:  'rgba(217,119,6,.13)',
  alert: 'rgba(220,38,38,.11)',
}
const SIDE: Record<Status, string> = {
  ok:    'rgba(22,163,74,.18)',
  warn:  'rgba(217,119,6,.20)',
  alert: 'rgba(220,38,38,.17)',
}

function BuildingCrossSection({ floors, onFloorClick }: { floors: Floor[]; onFloorClick: (id: string) => void }) {
  const N    = floors.length
  const svgW = FX + FW + DX + 20
  const svgH = PAD + N * FH + 20

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ width: '100%', maxWidth: 560, height: 'auto', display: 'block', margin: '0 auto' }}
    >
      <polygon
        points={`${FX},${PAD} ${FX+DX},${PAD-DY} ${FX+FW+DX},${PAD-DY} ${FX+FW},${PAD}`}
        fill="var(--surface-3)" stroke="var(--ink-4)" strokeWidth="1.5"
      />
      {floors.map((f, i) => (
        <polygon
          key={`s-${f.id}`}
          points={`${FX+FW},${PAD + i*FH} ${FX+FW+DX},${PAD-DY + i*FH} ${FX+FW+DX},${PAD-DY + (i+1)*FH} ${FX+FW},${PAD + (i+1)*FH}`}
          fill={SIDE[f.status]} stroke="var(--border)" strokeWidth="0.8"
        />
      ))}
      {floors.map((f, i) => {
        const y = PAD + i * FH
        return (
          <g key={f.id} onClick={() => onFloorClick(f.id)} style={{ cursor: 'pointer' }}>
            <rect x={FX} y={y} width={FW} height={FH} fill={FILL[f.status]} />
            <rect x={FX} y={y} width={FW} height={FH} fill="transparent"
              onMouseEnter={e => (e.currentTarget.previousElementSibling as SVGElement).setAttribute('fill', SIDE[f.status])}
              onMouseLeave={e => (e.currentTarget.previousElementSibling as SVGElement).setAttribute('fill', FILL[f.status])}
            />
            <circle cx={FX + 22} cy={y + FH/2} r={5} fill={STATUS_COLOR[f.status]} />
            <text x={FX + 40} y={y + FH/2 + 5} fontSize="12" fontWeight="700" fontFamily="'JetBrains Mono', monospace" fill={STATUS_COLOR[f.status]}>{f.num}</text>
            <text x={FX + 82} y={y + FH/2 - 4} fontSize="12.5" fontWeight="600" fill="var(--ink)">{f.label}</text>
            <text x={FX + FW - 16} y={y + FH/2 + 5} fontSize="11" fontFamily="'JetBrains Mono', monospace" fill="var(--ink-3)" textAnchor="end">{f.count}</text>
            {i < N - 1 && <line x1={FX} y1={y+FH} x2={FX+FW} y2={y+FH} stroke="var(--border)" strokeWidth="1" />}
          </g>
        )
      })}
      <rect x={FX} y={PAD} width={FW} height={N*FH} fill="none" stroke="var(--ink-3)" strokeWidth="2" />
    </svg>
  )
}

export default function BuildingDetailPage() {
  const navigate       = useNavigate()
  const { buildingId } = useParams<{ buildingId: string }>()
  const canEdit        = useAuthStore(s => s.canEdit())
  const [view, setView]         = useState<ViewMode>('list')
  const [floors, setFloors]     = useState<Floor[]>([])
  const [modalOpen, setModalOpen]   = useState(false)
  const [editFloor, setEditFloor]   = useState<Floor | null>(null)
  const [form] = Form.useForm()

  const { data: apiBuilding } = useQuery({
    queryKey: ['buildings', buildingId],
    queryFn: () => getBuildingById(buildingId!),
    enabled: !!buildingId,
    staleTime: 60_000,
  })
  const { data: floorsData } = useQuery({
    queryKey: ['floors', 'building', buildingId],
    queryFn: () => getFloors({ Building_ID: buildingId! }),
    enabled: !!buildingId,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!floorsData?.length) return
    setFloors(floorsData.map(f => ({
      id: f.Floor_ID,
      num: `F${f.floor_number ?? '?'}`,
      status: 'ok' as Status,
      label: f.name ?? f.function ?? `Floor ${f.floor_number}`,
      count: '',
    })))
  }, [floorsData])

  const meta = apiBuilding
    ? { title: apiBuilding.name, sub: `${apiBuilding.floor_count} floors` }
    : { title: `Building ${buildingId?.toUpperCase()}`, sub: '' }

  const openAdd = () => {
    setEditFloor(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (f: Floor) => {
    setEditFloor(f)
    form.setFieldsValue({ num: f.num, label: f.label, status: f.status, count: f.count })
    setModalOpen(true)
  }

  const handleOk = () => {
    form.validateFields().then(vals => {
      if (editFloor) {
        setFloors(prev => prev.map(f => f.id === editFloor.id ? { ...f, ...vals } : f))
      } else {
        const id = `${buildingId}-f${floors.length + 1}-${Date.now()}`
        setFloors(prev => [...prev, { id, num: vals.num, label: vals.label, status: vals.status ?? 'ok', count: vals.count ?? '0 dev' }])
      }
      setModalOpen(false)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>{meta.title}</h1>
          <p className="page-sub">Click a floor to view its floor plan.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {canEdit && view === 'list' && (
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={14} /> Add Floor
            </button>
          )}
          <div className="bldg-view-toggle">
            <button className={view === 'list'  ? 'on' : ''} onClick={() => setView('list')}>
              <LayoutList size={13} /> List
            </button>
            <button className={view === 'cross' ? 'on' : ''} onClick={() => setView('cross')}>
              <Layers size={13} /> Cross-section
            </button>
          </div>
          <div className="topo-legend">
            <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Online</span>
            <span className="legend-swatch"><i style={{ background: 'var(--warn)'  }} />Warning</span>
            <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Offline</span>
          </div>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div className="canvas" style={{ overflowY: 'auto' }}>

          {view === 'list' ? (
            <div className="floor-stack">
              {floors.map(f => (
                <div key={f.id} className={`floor-card ${f.status}`} style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/dashboard/floors/${f.id}`)}
                  >
                    <span className="fc-dot" style={{ background: STATUS_COLOR[f.status] }} />
                    <span className="fc-num">{f.num}</span>
                    <span className="fc-label">{f.label}</span>
                    <span className="fc-count">{f.count}</span>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 4, paddingRight: 12, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button className="tbl-icon-btn" title="Edit" onClick={() => openEdit(f)}>
                        <Pencil size={13} />
                      </button>
                      <Popconfirm
                        title="Delete this floor?"
                        okText="Delete" okButtonProps={{ danger: true }}
                        cancelText="Cancel"
                        onConfirm={() => setFloors(prev => prev.filter(x => x.id !== f.id))}
                      >
                        <button className="tbl-icon-btn" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '28px 24px' }}>
              <BuildingCrossSection
                floors={floors}
                onFloorClick={id => navigate(`/dashboard/floors/${id}`)}
              />
            </div>
          )}

        </div>
      </div>

      <Modal
        title={editFloor ? 'Edit Floor' : 'Add Floor'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText={editFloor ? 'Save' : 'Add'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="num" label="Floor Number" rules={[{ required: true }]}>
            <Input placeholder="e.g. F7" />
          </Form.Item>
          <Form.Item name="label" label="Description" rules={[{ required: true }]}>
            <Input placeholder="e.g. Server Room" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="ok" rules={[{ required: true }]}>
            <Select options={[
              { value: 'ok',    label: 'Online'  },
              { value: 'warn',  label: 'Warning' },
              { value: 'alert', label: 'Offline' },
            ]} />
          </Form.Item>
          <Form.Item name="count" label="Device Count" initialValue="0 dev">
            <Input placeholder="e.g. 5 dev" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
