import { useNavigate } from 'react-router-dom'

type Status = 'ok' | 'warn' | 'alert'

interface Building {
  id: string
  status: Status
  title: string
  sub: string
  count: string
}

const STATUS_COLOR: Record<Status, string> = {
  ok:    'var(--ok)',
  warn:  'var(--warn)',
  alert: 'var(--alert)',
}

const BUILDINGS: Building[] = [
  { id: 'a', status: 'alert', title: 'Building A — Main Tower',    sub: '8 floors · 2 cams offline',      count: '42 dev' },
  { id: 'b', status: 'ok',    title: 'Building B — Annex',         sub: '4 floors',                        count: '18 dev' },
  { id: 'c', status: 'ok',    title: 'Building C — Warehouse',     sub: '1 floor',                         count: '6 dev'  },
  { id: 'd', status: 'warn',  title: 'Building D — Security Gate', sub: '2 floors · door sensor warning',  count: '5 dev'  },
]

export default function SitesPage() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Site A — HQ Bangkok</h1>
          <p className="page-sub">Click a building to drill in.</p>
        </div>
        <div className="topo-legend">
          <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Online</span>
          <span className="legend-swatch"><i style={{ background: 'var(--warn)'  }} />Warning</span>
          <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Offline</span>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div className="canvas" style={{ overflowY: 'auto' }}>
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
        </div>
      </div>
    </div>
  )
}
