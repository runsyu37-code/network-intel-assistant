import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type Status = 'ok' | 'warn' | 'alert'

interface FloorData {
  id: string
  label: string
  cameras: number
  camerasOnline: number
}

interface BuildingData {
  id: string
  title: string
  status: Status
  floorList: FloorData[]
  cameras: number
  nvrs: number
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

const MOCK_BUILDINGS: BuildingData[] = [
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

const DOT_COLOR: Record<Status, string> = {
  ok:    'var(--ok)',
  warn:  'var(--warn)',
  alert: 'var(--alert)',
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
  building: BuildingData
  onViewBuilding: () => void
  onViewPlan: (floorId: string) => void
}

function BuildingCard({ building, onViewBuilding, onViewPlan }: CardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`bldg-card-v2${expanded ? ' expanded' : ''}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="bcv2-header" onClick={e => { e.stopPropagation(); onViewBuilding() }}>
        <div className="bcv2-title">
          {building.title}
          <span className="bcv2-dot" style={{ background: DOT_COLOR[building.status] }} />
        </div>
      </div>

      <div className="bcv2-visual">
        <IsometricSVG />
      </div>

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
            const pct = Math.round((floor.camerasOnline / floor.cameras) * 100)
            return (
              <div key={floor.id} className="bcv2-floor-row">
                <div className="bcv2-floor-info">
                  <span className="bcv2-floor-name">{floor.label}</span>
                  <span className="bcv2-floor-count">{floor.cameras} CAMs</span>
                  <div
                    className="bcv2-bar-wrap"
                    title={`${floor.camerasOnline} Online, ${floor.cameras - floor.camerasOnline} Offline`}
                  >
                    <div className="bcv2-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button
                  className="bcv2-btn-view"
                  onClick={e => { e.stopPropagation(); onViewPlan(floor.id) }}
                >
                  View Plan
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SitesPage() {
  const navigate = useNavigate()
  const { siteId } = useParams<{ siteId: string }>()
  const siteLabel = SITE_LABELS[siteId ?? ''] ?? siteId ?? 'Unknown Site'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>{siteLabel}</h1>
          <p className="page-sub">Click a card to expand floors — click the title to drill into building detail.</p>
        </div>
      </div>

      <div style={{ padding: '0 24px 32px', overflowY: 'auto', flex: 1 }}>
        <div className="bldg-grid-v2">
          {MOCK_BUILDINGS.map(b => (
            <BuildingCard
              key={b.id}
              building={b}
              onViewBuilding={() => navigate(`/dashboard/buildings/${b.id}`)}
              onViewPlan={floorId => navigate(`/dashboard/floors/${floorId}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
