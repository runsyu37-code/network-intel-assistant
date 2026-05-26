import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutList, Layers } from 'lucide-react'

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
    { id: 'a-f6', num: 'F6', status: 'ok',    label: 'Executive Office',             count: '4 dev' },
    { id: 'a-f5', num: 'F5', status: 'warn',  label: 'Meeting Rooms',                count: '5 dev' },
    { id: 'a-f4', num: 'F4', status: 'ok',    label: 'Office',                       count: '8 dev' },
    { id: 'a-f3', num: 'F3', status: 'ok',    label: 'Office',                       count: '7 dev' },
    { id: 'a-f2', num: 'F2', status: 'alert', label: 'Server Room · 2 cams offline', count: '9 dev' },
    { id: 'a-f1', num: 'F1', status: 'ok',    label: 'Lobby · Reception',            count: '3 dev' },
  ],
  b: [
    { id: 'b-f4', num: 'F4', status: 'ok',   label: 'Management Floor', count: '5 dev' },
    { id: 'b-f3', num: 'F3', status: 'ok',   label: 'Office',           count: '4 dev' },
    { id: 'b-f2', num: 'F2', status: 'ok',   label: 'Office',           count: '6 dev' },
    { id: 'b-f1', num: 'F1', status: 'ok',   label: 'Lobby',            count: '3 dev' },
  ],
  c: [
    { id: 'c-f1', num: 'F1', status: 'ok', label: 'Warehouse Floor', count: '6 dev' },
  ],
  d: [
    { id: 'd-f2', num: 'F2', status: 'warn', label: 'Security Control Room', count: '3 dev' },
    { id: 'd-f1', num: 'F1', status: 'ok',   label: 'Gate · Entrance',       count: '2 dev' },
  ],
}

/* ── Building cross-section SVG ─────────────────────────────── */
const FX = 60   // front-face left edge
const FW = 420  // front-face width
const FH = 64   // per-floor height
const DX = 72   // depth: horizontal
const DY = 36   // depth: vertical
const PAD = 54  // top padding for roof face

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
      {/* Roof (top parallelogram) */}
      <polygon
        points={`${FX},${PAD} ${FX+DX},${PAD-DY} ${FX+FW+DX},${PAD-DY} ${FX+FW},${PAD}`}
        fill="var(--surface-3)" stroke="var(--ink-4)" strokeWidth="1.5"
      />

      {/* Right side: per-floor colored parallelograms */}
      {floors.map((f, i) => (
        <polygon
          key={`s-${f.id}`}
          points={`
            ${FX+FW},${PAD + i*FH}
            ${FX+FW+DX},${PAD-DY + i*FH}
            ${FX+FW+DX},${PAD-DY + (i+1)*FH}
            ${FX+FW},${PAD + (i+1)*FH}
          `}
          fill={SIDE[f.status]}
          stroke="var(--border)" strokeWidth="0.8"
        />
      ))}

      {/* Front floor panels */}
      {floors.map((f, i) => {
        const y = PAD + i * FH
        return (
          <g key={f.id} onClick={() => onFloorClick(f.id)} style={{ cursor: 'pointer' }}>
            <rect x={FX} y={y} width={FW} height={FH} fill={FILL[f.status]} />

            {/* Hover hit-area (invisible, larger) */}
            <rect x={FX} y={y} width={FW} height={FH} fill="transparent"
              onMouseEnter={e => (e.currentTarget.previousElementSibling as SVGElement).setAttribute('fill', SIDE[f.status])}
              onMouseLeave={e => (e.currentTarget.previousElementSibling as SVGElement).setAttribute('fill', FILL[f.status])}
            />

            {/* Status dot */}
            <circle cx={FX + 22} cy={y + FH/2} r={5} fill={STATUS_COLOR[f.status]} />

            {/* Floor number */}
            <text x={FX + 40} y={y + FH/2 + 5}
              fontSize="12" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
              fill={STATUS_COLOR[f.status]}
            >{f.num}</text>

            {/* Floor label */}
            <text x={FX + 82} y={y + FH/2 - 4}
              fontSize="12.5" fontWeight="600" fill="var(--ink)"
            >{f.label}</text>

            {/* Device count */}
            <text x={FX + FW - 16} y={y + FH/2 + 5}
              fontSize="11" fontFamily="'JetBrains Mono', monospace"
              fill="var(--ink-3)" textAnchor="end"
            >{f.count}</text>

            {/* Floor divider */}
            {i < N - 1 && (
              <line x1={FX} y1={y+FH} x2={FX+FW} y2={y+FH} stroke="var(--border)" strokeWidth="1" />
            )}
          </g>
        )
      })}

      {/* Building front outline */}
      <rect x={FX} y={PAD} width={FW} height={N*FH} fill="none" stroke="var(--ink-3)" strokeWidth="2" />
    </svg>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function BuildingDetailPage() {
  const navigate       = useNavigate()
  const { buildingId } = useParams<{ buildingId: string }>()
  const [view, setView] = useState<ViewMode>('list')

  const meta   = BUILDING_META[buildingId ?? ''] ?? { title: `Building ${buildingId?.toUpperCase()}`, sub: '' }
  const floors = FLOORS_BY_BUILDING[buildingId ?? ''] ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>{meta.title}</h1>
          <p className="page-sub">Click a floor to view its floor plan.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* View toggle */}
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
    </div>
  )
}
