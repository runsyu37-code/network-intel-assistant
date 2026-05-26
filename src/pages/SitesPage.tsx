import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutGrid, Map } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'
type ViewMode = 'cards' | 'map'

interface Building {
  id: string; status: Status; title: string; sub: string; count: string
}

const STATUS_COLOR: Record<Status, string> = {
  ok:    'var(--ok)',
  warn:  'var(--warn)',
  alert: 'var(--alert)',
}

const SITE_LABELS: Record<string, string> = {
  'hq':     'HQ Bangkok',
  'site-a': 'Site A — HQ Bangkok',
  'site-b': 'Site B — Chiang Mai DC',
  'site-c': 'Site C — Phuket Branch',
  'site-d': 'Site D — Khon Kaen',
  'site-e': 'Site E — Hat Yai',
  'site-f': 'Site F — Udon Thani',
}

const BUILDINGS: Building[] = [
  { id: 'a', status: 'alert', title: 'Building A — Main Tower',    sub: '6 floors · 2 cams offline',      count: '42 dev' },
  { id: 'b', status: 'ok',    title: 'Building B — Annex',         sub: '4 floors',                        count: '18 dev' },
  { id: 'c', status: 'ok',    title: 'Building C — Warehouse',     sub: '1 floor',                         count: '6 dev'  },
  { id: 'd', status: 'warn',  title: 'Building D — Security Gate', sub: '2 floors · door sensor warning',  count: '5 dev'  },
]

/* ── Site map layout data ─────────────────────────────────────── */
interface MapBuilding {
  id: string; status: Status
  x: number; y: number; w: number; h: number
  label: string; sub: string; count: string
}

const MAP_BUILDINGS: MapBuilding[] = [
  { id:'a', status:'alert', x:70,  y:60,  w:240, h:310, label:'Building A', sub:'Main Tower · 6F',   count:'42 dev' },
  { id:'b', status:'ok',    x:390, y:60,  w:200, h:190, label:'Building B', sub:'Annex · 4F',         count:'18 dev' },
  { id:'c', status:'ok',    x:70,  y:400, w:310, h:90,  label:'Building C', sub:'Warehouse · 1F',    count:'6 dev'  },
  { id:'d', status:'warn',  x:680, y:310, w:82,  h:140, label:'D',          sub:'Security Gate · 2F', count:'5 dev'  },
]

const MAP_FILL:   Record<Status, string> = {
  ok:    'rgba(22,163,74,.09)',
  warn:  'rgba(217,119,6,.10)',
  alert: 'rgba(220,38,38,.09)',
}
const MAP_STROKE: Record<Status, string> = {
  ok:    'rgba(22,163,74,.55)',
  warn:  'rgba(217,119,6,.60)',
  alert: 'rgba(220,38,38,.55)',
}

function SiteMapSVG({ onBuildingClick }: { onBuildingClick: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <svg
      viewBox="0 0 820 540"
      style={{ width: '100%', maxWidth: 820, height: 'auto', display: 'block', margin: '0 auto' }}
    >
      {/* Site boundary */}
      <rect x="20" y="20" width="780" height="500" rx="8"
        fill="var(--surface-2)" stroke="var(--border-2)" strokeWidth="1.5" strokeDasharray="6 4" />

      {/* Site label */}
      <text x="400" y="510" textAnchor="middle"
        fontSize="10" fontFamily="'JetBrains Mono', monospace"
        fill="var(--ink-4)" letterSpacing=".12em">CAMPUS BOUNDARY</text>

      {/* Ground / paving (gray road strips) */}
      <rect x="340" y="20"  width="30" height="520" fill="var(--surface-3)" opacity=".6" />
      <rect x="20"  y="365" width="780" height="25"  fill="var(--surface-3)" opacity=".6" />
      <rect x="640" y="20"  width="30" height="520" fill="var(--surface-3)" opacity=".6" />

      {/* Parking lot */}
      <rect x="400" y="270" width="226" height="80" rx="4"
        fill="var(--surface-3)" stroke="var(--border)" strokeWidth="1" />
      <text x="513" y="315" textAnchor="middle"
        fontSize="9" fontFamily="'JetBrains Mono', monospace"
        fill="var(--ink-4)" letterSpacing=".10em">PARKING</text>

      {/* Compass rose */}
      <g transform="translate(760,48)">
        <circle r="14" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
        <text y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-2)">N</text>
        <line x1="0" y1="-8" x2="0" y2="8" stroke="var(--border-2)" strokeWidth="1" />
        <line x1="-8" y1="0" x2="8" y2="0" stroke="var(--border-2)" strokeWidth="1" />
      </g>

      {/* Building rectangles */}
      {MAP_BUILDINGS.map(b => {
        const isHov = hovered === b.id
        const cx = b.x + b.w / 2
        const midY = b.y + b.h / 2

        return (
          <g
            key={b.id}
            style={{ cursor: 'pointer' }}
            onClick={() => onBuildingClick(b.id)}
            onMouseEnter={() => setHovered(b.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Shadow */}
            <rect x={b.x + 4} y={b.y + 4} width={b.w} height={b.h} rx="4"
              fill="rgba(0,0,0,.08)" />

            {/* Building body */}
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4"
              fill={isHov ? MAP_STROKE[b.status].replace(',.55)', ',.15)').replace(',.60)', ',.16)').replace(',.50)', ',.14)') : MAP_FILL[b.status]}
              stroke={MAP_STROKE[b.status]}
              strokeWidth={isHov ? 2 : 1.5}
            />

            {/* Status bar (left edge) */}
            <rect x={b.x} y={b.y + 10} width="4" height={b.h - 20} rx="2"
              fill={STATUS_COLOR[b.status]} />

            {/* Status dot */}
            <circle cx={b.x + 18} cy={b.y + 22} r="5"
              fill={STATUS_COLOR[b.status]} />

            {/* Label */}
            <text x={cx} y={midY - 10} textAnchor="middle"
              fontSize={b.w < 100 ? "11" : "13"} fontWeight="700"
              fontFamily="'Inter', sans-serif" fill="var(--ink)"
            >{b.label}</text>

            {/* Sub label */}
            <text x={cx} y={midY + 8} textAnchor="middle"
              fontSize="10" fill="var(--ink-3)" fontFamily="'Inter', sans-serif"
            >{b.sub}</text>

            {/* Device count badge */}
            {b.w >= 100 && (
              <>
                <rect x={cx - 22} y={midY + 18} width="44" height="18" rx="9"
                  fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                <text x={cx} y={midY + 30} textAnchor="middle"
                  fontSize="9.5" fontFamily="'JetBrains Mono', monospace"
                  fill="var(--ink-2)" fontWeight="600"
                >{b.count}</text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function SitesPage() {
  const navigate   = useNavigate()
  const { siteId } = useParams<{ siteId: string }>()
  const [view, setView] = useState<ViewMode>('cards')

  const siteLabel = SITE_LABELS[siteId ?? ''] ?? siteId ?? 'Unknown Site'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>{siteLabel}</h1>
          <p className="page-sub">Click a building to drill in.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="bldg-view-toggle">
            <button className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}>
              <LayoutGrid size={13} /> Cards
            </button>
            <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>
              <Map size={13} /> Site Map
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

          {view === 'cards' ? (
            <div className="bldg-grid">
              {BUILDINGS.map(b => (
                <div
                  key={b.id}
                  className={`bldg-card ${b.status}`}
                  onClick={() => navigate(`/dashboard/buildings/${b.id}`)}
                >
                  <span className="bc-dot" style={{ background: STATUS_COLOR[b.status] }} />
                  <div className="bc-meta">
                    <div className="bc-title">{b.title}</div>
                    <div className="bc-sub">{b.sub}</div>
                  </div>
                  <span className="bc-count">{b.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '28px 24px' }}>
              <SiteMapSVG onBuildingClick={id => navigate(`/dashboard/buildings/${id}`)} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
