import { useNavigate } from 'react-router-dom'
import { Server } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'

interface Rack {
  id: string; name: string; status: Status
  site: string; building: string; room: string
  usedU: number; totalU: number; devices: number
  powerKw: number; budgetKw: number
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }

const RACKS: Rack[] = [
  { id:'rack-a1', name:'Rack A1', status:'alert', site:'HQ Bangkok',    building:'Building A', room:'Server Room F2', usedU:14, totalU:42, devices:12, powerKw:1.24, budgetKw:2.5 },
  { id:'rack-a2', name:'Rack A2', status:'ok',    site:'HQ Bangkok',    building:'Building A', room:'Server Room F2', usedU:8,  totalU:42, devices:7,  powerKw:0.82, budgetKw:2.5 },
  { id:'rack-b1', name:'Rack B1', status:'warn',  site:'HQ Bangkok',    building:'Building B', room:'Network Room F3',usedU:10, totalU:24, devices:8,  powerKw:0.91, budgetKw:1.5 },
  { id:'rack-c1', name:'Rack C1', status:'ok',    site:'Chiang Mai DC', building:'Building A', room:'Data Center F1', usedU:18, totalU:42, devices:14, powerKw:1.65, budgetKw:3.0 },
  { id:'rack-p1', name:'Rack P1', status:'ok',    site:'Phuket Branch', building:'Building A', room:'Server Room F1', usedU:6,  totalU:24, devices:5,  powerKw:0.44, budgetKw:1.5 },
  { id:'rack-k1', name:'Rack K1', status:'ok',    site:'Khon Kaen',     building:'Building A', room:'Server Room F1', usedU:4,  totalU:18, devices:4,  powerKw:0.28, budgetKw:1.0 },
]

export default function RacksListPage() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Racks</h1>
          <p className="page-sub">Click a rack to view its device layout and inventory</p>
        </div>
        <div className="topo-legend">
          <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Healthy</span>
          <span className="legend-swatch"><i style={{ background: 'var(--warn)'  }} />Warning</span>
          <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Fault</span>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div className="canvas" style={{ overflowY: 'auto' }}>
          <div className="bldg-grid">
            {RACKS.map(r => {
              const uPct     = Math.round(r.usedU / r.totalU * 100)
              const pwrPct   = Math.round(r.powerKw / r.budgetKw * 100)
              const pwrHigh  = pwrPct > 75

              return (
                <div
                  key={r.id}
                  className={`bldg-card ${r.status}`}
                  onClick={() => navigate(`/dashboard/racks/${r.id}`)}
                  style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, minWidth: 260, maxWidth: 300 }}
                >
                  {/* header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="bc-dot" style={{ background: STATUS_COLOR[r.status] }} />
                    <div className="bc-meta">
                      <div className="bc-title">{r.name}</div>
                      <div className="bc-sub">{r.site} · {r.room}</div>
                    </div>
                    <Server size={16} style={{ color: 'var(--ink-3)', flex: 'none' }} />
                  </div>

                  {/* capacity bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                      <span>Capacity</span>
                      <span style={{ fontFamily: 'monospace' }}>{r.usedU}/{r.totalU} U · {r.devices} dev</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${uPct}%`, background: 'var(--accent)', borderRadius: 999 }} />
                    </div>
                  </div>

                  {/* power bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                      <span>Power</span>
                      <span style={{ fontFamily: 'monospace', color: pwrHigh ? 'var(--warn)' : undefined }}>
                        {r.powerKw.toFixed(2)} / {r.budgetKw} kW
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pwrPct}%`, background: pwrHigh ? 'var(--warn)' : 'var(--accent)', borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
