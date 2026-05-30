import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Tooltip } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getRackById } from '../api/racks'
import type { RackDeviceApi, RackAlertApi } from '../api/types'

type DevStatus = 'ok' | 'alert' | 'warn' | 'passive'
type DevType   = 'nvr' | 'switch' | 'patch' | 'pdu' | 'ups' | 'cable' | 'ap'

interface SubDev { name: string; type: DevType; status: DevStatus }
interface Device {
  uTop: number
  size: number
  name?: string
  type?: DevType
  status?: DevStatus
  model?: string
  ip?: string
  brand?: string
  poePort?: number | null
  subs?: SubDev[]
}

interface RackData {
  title: string
  sub: string
  usedU: number
  totalU: number
  powerKw: number
  powerBudgetKw: number
  devices: Device[]
  alerts: { status: 'alert' | 'warn'; dev: string; what: string; ago: string }[]
}


function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function apiDevicesToDevices(apiDevices: RackDeviceApi[], totalU: number): Device[] {
  const result: Device[] = [
    { uTop: totalU, size: 2, name: 'CABLE MGR', type: 'cable', status: 'passive' },
  ]
  let cursor = totalU - 2
  for (const dev of apiDevices) {
    const size: number = dev.device_type === 'nvr' ? 2 : 1
    if (cursor < size) break
    const status: DevStatus = dev.status === 'online' ? 'ok' : dev.status === 'warning' ? 'warn' : 'alert'
    result.push({ uTop: cursor, size, name: dev.device_name, type: dev.device_type, status, model: dev.model ?? undefined, ip: dev.ip_address ?? undefined, brand: dev.brand ?? undefined, poePort: dev.poe_port_number ?? null })
    cursor -= size
  }
  return result
}

function mapApiAlerts(apiAlerts: RackAlertApi[]): RackData['alerts'] {
  return apiAlerts.map(a => ({
    status: (a.status === 'warning' ? 'warn' : 'alert') as 'alert' | 'warn',
    dev: a.device_name,
    what: `· ${a.message}`,
    ago: a.alerted_at ? timeAgo(a.alerted_at) : '—',
  }))
}

/* ── SVG glyphs per device type ─────────────────────────────── */
function Glyph({ type }: { type: DevType }) {
  if (type === 'nvr') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="1"/>
      <line x1="6" y1="10" x2="6" y2="14"/>
      <circle cx="11" cy="12" r="1" fill="currentColor"/>
      <circle cx="14" cy="12" r="1" fill="currentColor"/>
      <circle cx="17" cy="12" r="1" fill="currentColor"/>
    </svg>
  )
  if (type === 'switch') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="8" width="20" height="8" rx="1"/>
      <line x1="5" y1="11" x2="5" y2="13"/><line x1="8" y1="11" x2="8" y2="13"/>
      <line x1="11" y1="11" x2="11" y2="13"/><line x1="14" y1="11" x2="14" y2="13"/>
      <line x1="17" y1="11" x2="17" y2="13"/><line x1="20" y1="11" x2="20" y2="13"/>
    </svg>
  )
  if (type === 'patch') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="9" width="20" height="6" rx="1"/>
      <line x1="5" y1="10.5" x2="5" y2="13.5"/><line x1="8" y1="10.5" x2="8" y2="13.5"/>
      <line x1="11" y1="10.5" x2="11" y2="13.5"/><line x1="14" y1="10.5" x2="14" y2="13.5"/>
      <line x1="17" y1="10.5" x2="17" y2="13.5"/><line x1="20" y1="10.5" x2="20" y2="13.5"/>
    </svg>
  )
  if (type === 'pdu') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="9" width="20" height="6" rx="1"/>
      <circle cx="6" cy="12" r="1.2"/><circle cx="10" cy="12" r="1.2"/>
      <circle cx="14" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>
    </svg>
  )
  if (type === 'ups') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="1"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <polyline points="11 11 9 15 12 15 10 19"/>
    </svg>
  )
  if (type === 'cable') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 10c4 0 4 4 8 4s4-4 8-4"/>
      <path d="M4 14c4 0 4-4 8-4s4 4 8 4"/>
    </svg>
  )
  if (type === 'ap') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.55a11 11 0 0 1 14 0"/>
      <path d="M8.5 16.42a6 6 0 0 1 7 0"/>
      <circle cx="12" cy="20" r="1" fill="currentColor"/>
    </svg>
  )
  return null
}

function uRange(d: Device) {
  const lo = d.uTop - d.size + 1
  return d.size > 1 ? `U${lo}–U${d.uTop}` : `U${d.uTop}`
}

function StatusDot({ status, cls }: { status: DevStatus; cls?: string }) {
  const dotCls = status === 'alert' ? 'r' : status === 'warn' ? 'y' : status === 'passive' ? 'gray' : ''
  return <span className={`it-dot ${dotCls} ${cls ?? ''}`} />
}

function StatusLabel({ status }: { status: DevStatus }) {
  if (status === 'alert')   return <>Offline</>
  if (status === 'warn')    return <>Warning</>
  if (status === 'passive') return <>Passive</>
  return <>Online</>
}

export default function RackDetailPage() {
  const { rackId }   = useParams<{ rackId: string }>()
  const navigate     = useNavigate()
  const location     = useLocation()
  const backTo       = (location.state as { from?: string } | null)?.from ?? '/dashboard/racks'

  const { data: apiRack, isPending } = useQuery({
    queryKey: ['rack-detail', rackId],
    queryFn: () => getRackById(rackId!),
    enabled: !!rackId,
  })

  const rack: RackData | undefined = apiRack ? {
    title: `${apiRack.name} — ${apiRack.room_name}`,
    sub: `${apiRack.total_units}U · ${apiRack.devices.length} devices installed`,
    usedU: apiRack.used_units,
    totalU: apiRack.total_units,
    powerKw: apiRack.power_kw,
    powerBudgetKw: apiRack.power_budget_kw ?? 3.0,
    devices: apiDevicesToDevices(apiRack.devices, apiRack.total_units),
    alerts: mapApiAlerts(apiRack.alerts),
  } : undefined

  if (isPending || !rack) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)' }}>
      Loading rack data…
    </div>
  )

  const totalU       = rack.totalU
  const capacityPct  = (rack.usedU / totalU * 100).toFixed(0)
  const powerPct     = (rack.powerKw / rack.powerBudgetKw * 100).toFixed(0)
  const freeU        = totalU - rack.usedU
  const deviceCount  = rack.devices.reduce((n, d) => n + (d.subs ? d.subs.length : 1), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button className="icon-btn" style={{ marginTop: 2, flex: 'none' }} onClick={() => navigate(backTo)}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1>{rack.title}</h1>
            <p className="page-sub">{rack.sub}</p>
          </div>
        </div>
        <div className="topo-legend">
          <span className="legend-swatch"><i style={{ background: 'var(--ok)'    }} />Online</span>
          <span className="legend-swatch"><i style={{ background: 'var(--warn)'  }} />Warning</span>
          <span className="legend-swatch"><i style={{ background: 'var(--alert)' }} />Offline</span>
          <span className="legend-swatch"><i style={{ background: '#9099a8'      }} />Passive</span>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div className="canvas" style={{ position: 'relative' }}>
          <div className="rack-wrap">

            {/* ── Rack frame ── */}
            <div className="rack">
              <div className="rack-header">
                <span className="rack-rid">{rackId?.toUpperCase() ?? 'RACK A1'}</span>
                <span className="rack-rsub">{totalU}U · 600 × 1000 mm</span>
              </div>

              <div className="rack-body">
                {/* U labels */}
                <div className="u-labels">
                  {Array.from({ length: totalU }, (_, i) => {
                    const u = totalU - i
                    return (
                      <div key={u} className={`u-label-row${u % 2 === 0 ? ' even' : ''}`}>
                        {String(u).padStart(2, '0')}
                      </div>
                    )
                  })}
                </div>

                {/* Slot area with devices */}
                <div
                  className="u-slots"
                  style={{ backgroundSize: `100% ${(1 / totalU * 100).toFixed(4)}%` }}
                >
                  {rack.devices.map((d, i) => {
                    const topPct    = ((totalU - d.uTop) / totalU * 100).toFixed(4) + '%'
                    const heightPct = (d.size / totalU * 100).toFixed(4) + '%'

                    if (d.subs) {
                      return (
                        <div key={i} className="device-row" style={{ top: topPct, height: heightPct }}>
                          {d.subs.map((s, j) => (
                            <div key={j} className={`sub-device ${s.status}`}>
                              <span className="sd-glyph"><Glyph type={s.type} /></span>
                              <span className="sd-name">{s.name}</span>
                              <span className="sd-dot" />
                            </div>
                          ))}
                          {d.subs.length < 3 && (
                            <div className="sub-device empty">
                              <span className="sd-name">empty</span>
                            </div>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div key={i} className={`device ${d.status ?? 'passive'}`} style={{ top: topPct, height: heightPct }}>
                        <span className="dv-glyph">{d.type && <Glyph type={d.type} />}</span>
                        <span className="dv-name">{d.name}</span>
                        {d.size > 1 && <span className="dv-size">{d.size}U</span>}
                        <span className="dv-dot" />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rack-footer">
                <span className="rack-pill">{rack.usedU}U used</span>
                <span className="rack-pill">{freeU}U free</span>
                <span className="rack-pill">{deviceCount} devices</span>
              </div>
            </div>

            {/* ── Info panel ── */}
            <aside className="rack-info">
              <div className="info-row">
                <div className="info-card">
                  <div className="ic-label">Capacity</div>
                  <div className="ic-big">{rack.usedU}<span className="ic-unit">/ {totalU} U</span></div>
                  <div className="ic-bar"><span style={{ width: `${capacityPct}%` }} /></div>
                  <div className="ic-foot">{freeU}U free · {deviceCount} devices</div>
                </div>
                <div className="info-card">
                  <div className="ic-label">Power draw</div>
                  <div className="ic-big">{rack.powerKw.toFixed(2)}<span className="ic-unit">kW</span></div>
                  <div className="ic-bar warn"><span style={{ width: `${powerPct}%` }} /></div>
                  <div className="ic-foot">Budget {rack.powerBudgetKw} kW · {powerPct}%</div>
                </div>
              </div>

              <div className="info-card alerts-card">
                <div className="ic-label">Active alerts · {rack.alerts.length}</div>
                <ul className="alert-list">
                  {rack.alerts.map((a, i) => (
                    <li key={i}>
                      <span className="al-dot" style={{ background: a.status === 'alert' ? 'var(--alert)' : 'var(--warn)' }} />
                      <span className="al-dev">{a.dev}</span>
                      <span className="al-what">{a.what}</span>
                      <span className="al-ago">{a.ago}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="info-card inv-card">
                <div className="ic-label">Inventory</div>
                <table className="inv-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th className="it-u">Slot</th>
                      <th>Device</th>
                      <th className="it-type">Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rack.devices.flatMap((d, i) =>
                      d.subs
                        ? d.subs.map((s, j) => (
                          <tr key={`${i}-${j}`}>
                            <td className="it-u">U{d.uTop}</td>
                            <td><span className="it-name">{s.name}</span></td>
                            <td className="it-type">{s.type}</td>
                            <td><StatusDot status={s.status} /><StatusLabel status={s.status} /></td>
                          </tr>
                        ))
                        : [(
                          <tr key={i}>
                            <td className="it-u">{uRange(d)}</td>
                            <td>
                              <Tooltip
                                title={d.ip || d.brand || d.poePort != null ? (
                                  <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                                    {d.ip && <div>IP: {d.ip}</div>}
                                    {d.brand && <div>Brand: {d.brand}</div>}
                                    {d.poePort != null && <div>PoE Port: {d.poePort}</div>}
                                    <div>Status: {d.status ?? 'passive'}</div>
                                  </div>
                                ) : undefined}
                                placement="right"
                                mouseEnterDelay={0.4}
                              >
                                <span className="it-name">{d.name}</span>
                              </Tooltip>
                            </td>
                            <td className="it-type">{d.type ?? '—'}</td>
                            <td><StatusDot status={d.status ?? 'passive'} /><StatusLabel status={d.status ?? 'passive'} /></td>
                          </tr>
                        )]
                    )}
                  </tbody>
                </table>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  )
}
