import { useNavigate, useParams } from 'react-router-dom'

type Status = 'ok' | 'warn' | 'alert'

interface Floor {
  id: string
  num: string
  status: Status
  label: string
  count: string
}

const STATUS_COLOR: Record<Status, string> = {
  ok:    'var(--ok)',
  warn:  'var(--warn)',
  alert: 'var(--alert)',
}

const BUILDING_META: Record<string, { title: string; sub: string }> = {
  a: { title: 'Building A — Main Tower',    sub: '6 floors · 2 cams offline' },
  b: { title: 'Building B — Annex',         sub: '4 floors' },
  c: { title: 'Building C — Warehouse',     sub: '1 floor' },
  d: { title: 'Building D — Security Gate', sub: '2 floors' },
}

const FLOORS_BY_BUILDING: Record<string, Floor[]> = {
  a: [
    { id: 'a-f6', num: 'F6', status: 'ok',    label: 'Executive Office',          count: '4 dev' },
    { id: 'a-f5', num: 'F5', status: 'warn',   label: 'Meeting Rooms',             count: '5 dev' },
    { id: 'a-f4', num: 'F4', status: 'ok',    label: 'Office',                    count: '8 dev' },
    { id: 'a-f3', num: 'F3', status: 'ok',    label: 'Office',                    count: '7 dev' },
    { id: 'a-f2', num: 'F2', status: 'alert', label: 'Server Room · 2 cams offline', count: '9 dev' },
    { id: 'a-f1', num: 'F1', status: 'ok',    label: 'Lobby · Reception',         count: '3 dev' },
  ],
  b: [
    { id: 'b-f4', num: 'F4', status: 'ok',   label: 'Management Floor',  count: '5 dev' },
    { id: 'b-f3', num: 'F3', status: 'ok',   label: 'Office',            count: '4 dev' },
    { id: 'b-f2', num: 'F2', status: 'ok',   label: 'Office',            count: '6 dev' },
    { id: 'b-f1', num: 'F1', status: 'ok',   label: 'Lobby',             count: '3 dev' },
  ],
  c: [
    { id: 'c-f1', num: 'F1', status: 'ok', label: 'Warehouse Floor', count: '6 dev' },
  ],
  d: [
    { id: 'd-f2', num: 'F2', status: 'warn', label: 'Security Control Room · door sensor warning', count: '3 dev' },
    { id: 'd-f1', num: 'F1', status: 'ok',   label: 'Gate · Entrance',                             count: '2 dev' },
  ],
}

export default function BuildingDetailPage() {
  const navigate     = useNavigate()
  const { buildingId } = useParams<{ buildingId: string }>()
  const meta  = BUILDING_META[buildingId ?? ''] ?? { title: `Building ${buildingId?.toUpperCase()}`, sub: '' }
  const floors = FLOORS_BY_BUILDING[buildingId ?? ''] ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>{meta.title}</h1>
          <p className="page-sub">Click a floor to view its floor plan.</p>
        </div>
        <div className="topo-legend">
          <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Online</span>
          <span className="legend-swatch"><i style={{ background: 'var(--warn)'  }} />Warning</span>
          <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Offline</span>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div className="canvas" style={{ overflowY: 'auto' }}>
          <div className="floor-stack">
            {floors.map(f => (
              <div
                key={f.id}
                className={`floor-card ${f.status}`}
                onClick={() => navigate(`/dashboard/floors/${f.id}`)}
              >
                <span className="fc-dot" style={{ background: STATUS_COLOR[f.status] }} />
                <span className="fc-num">{f.num}</span>
                <span className="fc-label">{f.label}</span>
                <span className="fc-count">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
