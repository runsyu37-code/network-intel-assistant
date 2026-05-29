import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getRacks } from '../api/racks'
import type { RackApi } from '../api/types'

type Status = 'ok' | 'warn' | 'alert'

interface Rack {
  id: string; name: string; status: Status
  site: string; building: string; room: string
  usedU: number; totalU: number; devices: number
  powerKw: number; budgetKw: number
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }


const SITE_ORDER = ['HQ Bangkok', 'Chiang Mai DC', 'Phuket Branch', 'Khon Kaen']

function mapRack(a: RackApi): Rack {
  const s = a.status ?? ''
  const status: Status = s === 'online' ? 'ok' : s === 'warning' ? 'warn' : 'alert'
  return {
    id: a.Rack_ID,
    name: a.name,
    status,
    site: a.site_name,
    building: a.building_name,
    room: a.room_name,
    usedU: a.used_units,
    totalU: a.total_units,
    devices: a.device_count,
    powerKw: a.power_kw,
    budgetKw: a.power_budget_kw ?? 2.5,
  }
}

function groupBySite(racks: Rack[]): { site: string; racks: Rack[] }[] {
  const map = new Map<string, Rack[]>()
  for (const r of racks) {
    if (!map.has(r.site)) map.set(r.site, [])
    map.get(r.site)!.push(r)
  }
  const ordered = [
    ...SITE_ORDER.filter(s => map.has(s)),
    ...[...map.keys()].filter(s => !SITE_ORDER.includes(s)),
  ]
  return ordered.map(site => ({ site, racks: map.get(site)! }))
}

function siteStatus(racks: Rack[]): Status {
  if (racks.some(r => r.status === 'alert')) return 'alert'
  if (racks.some(r => r.status === 'warn'))  return 'warn'
  return 'ok'
}

export default function RacksListPage() {
  const navigate = useNavigate()
  const { data, isPending, isError } = useQuery({ queryKey: ['racks'], queryFn: () => getRacks() })
  const [racks, setRacks] = useState<Rack[]>([])
  useEffect(() => { if (data !== undefined) setRacks(data.map(mapRack)) }, [data])
  const groups = groupBySite(racks)

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
          {isPending && (
            <div className="dl-empty" style={{ padding: 40 }}>กำลังโหลด...</div>
          )}
          {isError && (
            <div className="dl-empty" style={{ padding: 40, color: 'var(--alert)' }}>โหลดข้อมูลไม่สำเร็จ — กรุณารีเฟรช</div>
          )}
          {!isPending && !isError && racks.length === 0 && (
            <div className="dl-empty" style={{ padding: 40 }}>ไม่พบ Rack</div>
          )}
          {!isPending && !isError && groups.map(({ site, racks: siteRacks }) => {
            const st = siteStatus(siteRacks)
            return (
              <div key={site} className="rack-site-section">
                <div className="rack-site-head">
                  <MapPin size={13} style={{ color: 'var(--ink-3)', flex: 'none' }} />
                  <span className="rsh-name">{site}</span>
                  <span className="rsh-dot" style={{ background: STATUS_COLOR[st] }} />
                  <span className="rsh-count">{siteRacks.length} rack{siteRacks.length > 1 ? 's' : ''}</span>
                </div>

                <div className="bldg-grid" style={{ padding: 0, paddingBottom: 4 }}>
                  {siteRacks.map(r => {
                    const uPct    = Math.round(r.usedU / r.totalU * 100)
                    const pwrPct  = Math.round(r.powerKw / r.budgetKw * 100)
                    const pwrHigh = pwrPct > 75

                    return (
                      <div
                        key={r.id}
                        className={`bldg-card ${r.status}`}
                        onClick={() => navigate(`/dashboard/racks/${r.id}`)}
                        style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, minWidth: 260, maxWidth: 300 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="bc-dot" style={{ background: STATUS_COLOR[r.status] }} />
                          <div className="bc-meta">
                            <div className="bc-title">{r.name}</div>
                            <div className="bc-sub">{r.building} · {r.room}</div>
                          </div>
                          <Server size={16} style={{ color: 'var(--ink-3)', flex: 'none' }} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                            <span>Capacity</span>
                            <span style={{ fontFamily: 'monospace' }}>{r.usedU}/{r.totalU} U · {r.devices} dev</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${uPct}%`, background: 'var(--accent)', borderRadius: 999 }} />
                          </div>
                        </div>

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
            )
          })}
        </div>
      </div>
    </div>
  )
}

