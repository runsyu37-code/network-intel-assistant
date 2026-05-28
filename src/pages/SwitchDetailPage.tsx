import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Network, ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getSwitches } from '../api/switches'

type Status = 'ok' | 'warn' | 'alert'
type PortStatus = 'active' | 'inactive' | 'error'

interface Port {
  num: number; status: PortStatus; device?: string; speed?: string; vlan?: string; poeW?: number
}

interface SwitchDevice {
  id: string; name: string; ip: string; mac: string; status: Status
  site: string; building: string; floor: string; rack: string
  model: string; firmware: string; installedAt: string; uptime: string
  ports: number; activePorts: number
  powerW: number; budgetW: number
  vlan: string
  portMap: Port[]
}

function makePorts(total: number, activePorts: number, named: { device: string; vlan: string; speed: string }[]): Port[] {
  return Array.from({ length: total }, (_, i) => {
    if (i < named.length) return {
      num: i + 1, status: 'active',
      device: named[i].device,
      vlan: named[i].vlan,
      speed: named[i].speed,
      poeW: 12 + Math.floor(i * 3.7) % 12,
    }
    if (i < activePorts) return { num: i + 1, status: 'active', speed: '100M', vlan: '1' }
    if (i === activePorts) return { num: i + 1, status: 'error' }
    return { num: i + 1, status: 'inactive' }
  })
}

const SWITCHES: Record<string, SwitchDevice> = {
  'SW-HQ-CORE': {
    id:'SW-HQ-CORE', name:'Core Switch HQ', ip:'192.168.1.2', mac:'00:1A:2B:AA:BB:01',
    status:'ok', site:'HQ Bangkok', building:'Building A', floor:'F2', rack:'Rack A1',
    model:'Cisco SG350X-24P', firmware:'2.5.7.85', installedAt:'2022-11-01', uptime:'45d 2h',
    ports:24, activePorts:22, powerW:185, budgetW:370, vlan:'VLAN 10,20,30',
    portMap: makePorts(24, 22, [
      { device:'Router-Main',   vlan:'10', speed:'1G' },
      { device:'NVR-01',        vlan:'20', speed:'1G' },
      { device:'Server-Storage',vlan:'20', speed:'1G' },
      { device:'NVR-02',        vlan:'20', speed:'1G' },
      { device:'Unknown',       vlan:'10', speed:'10M' },
      { device:'SW-Floor1',     vlan:'ALL',speed:'1G' },
      { device:'SW-Floor2',     vlan:'ALL',speed:'1G' },
      { device:'CAM-003',       vlan:'20', speed:'100M' },
      { device:'CAM-004',       vlan:'20', speed:'100M' },
      { device:'CAM-005',       vlan:'20', speed:'100M' },
    ]),
  },
  'SW-HQ-FLOOR3': {
    id:'SW-HQ-FLOOR3', name:'Floor 3 Switch', ip:'192.168.1.3', mac:'00:1A:2B:AA:BB:02',
    status:'alert', site:'HQ Bangkok', building:'Building A', floor:'F3', rack:'Rack A1',
    model:'Cisco CBS350-24P', firmware:'3.3.1.12', installedAt:'2023-01-15', uptime:'0d 0h',
    ports:24, activePorts:0, powerW:0, budgetW:370, vlan:'VLAN 20',
    portMap: makePorts(24, 0, []),
  },
  'SW-HQ-FLOOR2': {
    id:'SW-HQ-FLOOR2', name:'Floor 2 Switch', ip:'192.168.1.4', mac:'00:1A:2B:AA:BB:03',
    status:'warn', site:'HQ Bangkok', building:'Building A', floor:'F2', rack:'Rack A1',
    model:'Cisco CBS350-24P', firmware:'3.3.1.12', installedAt:'2023-01-15', uptime:'12d 6h',
    ports:24, activePorts:20, powerW:310, budgetW:370, vlan:'VLAN 10,20',
    portMap: makePorts(24, 20, [
      { device:'CAM-003', vlan:'20', speed:'100M' },
      { device:'CAM-004', vlan:'20', speed:'100M' },
      { device:'NVR-HQ-01', vlan:'20', speed:'1G' },
      { device:'NVR-HQ-02', vlan:'20', speed:'1G' },
    ]),
  },
  'SW-MINI-01': {
    id:'SW-MINI-01', name:'Mini Switch 01', ip:'192.168.1.5', mac:'00:1A:2B:AA:BB:04',
    status:'ok', site:'HQ Bangkok', building:'Building A', floor:'F2', rack:'Rack A1',
    model:'TP-Link TL-SG1016PE', firmware:'1.0.16 Build 220330', installedAt:'2023-03-01', uptime:'30d 14h',
    ports:16, activePorts:12, powerW:95, budgetW:150, vlan:'VLAN 20',
    portMap: makePorts(16, 12, [
      { device:'CAM-005', vlan:'20', speed:'100M' },
      { device:'CAM-006', vlan:'20', speed:'100M' },
      { device:'CAM-007', vlan:'20', speed:'100M' },
      { device:'CAM-008', vlan:'20', speed:'100M' },
    ]),
  },
  'SW-MINI-02': {
    id:'SW-MINI-02', name:'Mini Switch 02', ip:'192.168.1.6', mac:'00:1A:2B:AA:BB:05',
    status:'warn', site:'HQ Bangkok', building:'Building A', floor:'F2', rack:'Rack A1',
    model:'TP-Link TL-SG1016PE', firmware:'1.0.16 Build 220330', installedAt:'2023-03-01', uptime:'8d 3h',
    ports:16, activePorts:14, powerW:128, budgetW:150, vlan:'VLAN 20',
    portMap: makePorts(16, 14, [
      { device:'CAM-009', vlan:'20', speed:'100M' },
      { device:'CAM-010', vlan:'20', speed:'100M' },
      { device:'CAM-011', vlan:'20', speed:'100M' },
    ]),
  },
  'SW-CM-01': {
    id:'SW-CM-01', name:'Chiang Mai Core', ip:'192.168.10.2', mac:'00:1A:2B:AA:CC:01',
    status:'ok', site:'Chiang Mai DC', building:'Building A', floor:'F1', rack:'Rack C1',
    model:'Cisco SG350-28P', firmware:'2.5.7.85', installedAt:'2023-07-01', uptime:'60d 10h',
    ports:28, activePorts:14, powerW:120, budgetW:375, vlan:'VLAN 10',
    portMap: makePorts(28, 14, [
      { device:'CAM-015',  vlan:'10', speed:'100M' },
      { device:'CAM-016',  vlan:'10', speed:'100M' },
      { device:'NVR-CM-01',vlan:'10', speed:'1G'   },
    ]),
  },
  'SW-PK-01': {
    id:'SW-PK-01', name:'Phuket Switch', ip:'192.168.20.2', mac:'00:1A:2B:AA:DD:01',
    status:'ok', site:'Phuket Branch', building:'Building A', floor:'F1', rack:'Rack P1',
    model:'Cisco CBS350-16P', firmware:'3.3.1.12', installedAt:'2023-11-20', uptime:'22d 0h',
    ports:16, activePorts:8, powerW:74, budgetW:240, vlan:'VLAN 10',
    portMap: makePorts(16, 8, [
      { device:'NVR-PK-01', vlan:'10', speed:'1G' },
    ]),
  },
  'SW-KK-01': {
    id:'SW-KK-01', name:'Khon Kaen Switch', ip:'192.168.30.2', mac:'00:1A:2B:AA:EE:01',
    status:'ok', site:'Khon Kaen', building:'Building A', floor:'F1', rack:'Rack K1',
    model:'TP-Link TL-SG1016PE', firmware:'1.0.16 Build 220330', installedAt:'2024-01-10', uptime:'18d 7h',
    ports:16, activePorts:5, powerW:42, budgetW:150, vlan:'VLAN 10',
    portMap: makePorts(16, 5, [
      { device:'NVR-KK-01', vlan:'10', speed:'1G' },
    ]),
  },
}

function mapStatus(s: string | null): Status {
  if (s === 'online') return 'ok'
  if (s === 'warning') return 'warn'
  return 'alert'
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const STATUS_LABEL: Record<Status, string>  = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

const LED_COLOR: Record<PortStatus, string> = {
  active:   '#17A34A',
  inactive: '#6B7280',
  error:    '#EF4444',
}

const PORT_BADGE: Record<PortStatus, { bg: string; color: string; label: string }> = {
  active:   { bg: 'var(--ok-soft)',   color: 'var(--ok)',    label: 'UP'    },
  inactive: { bg: 'var(--surface-2)', color: 'var(--ink-3)', label: 'DOWN'  },
  error:    { bg: 'var(--alert-soft)',color: 'var(--alert)',  label: 'ERROR' },
}

function HardwarePortMap({ sw }: { sw: SwitchDevice }) {
  const half    = Math.ceil(sw.ports / 2)
  const topPorts = sw.portMap.filter((_, i) => i % 2 === 0).slice(0, half)
  const botPorts = sw.portMap.filter((_, i) => i % 2 === 1).slice(0, half)

  return (
    <div className="hw-switch-panel">
      <div className="hw-port-row">
        {topPorts.map(p => (
          <div key={p.num} className="hw-port-wrap" title={`Port ${p.num}${p.device ? ` — ${p.device}` : ''}`}>
            <div className="hw-port">
              <div className="hw-port-led" style={{
                background: LED_COLOR[p.status],
                boxShadow: p.status === 'active' ? `0 0 4px ${LED_COLOR[p.status]}` : undefined,
              }} />
            </div>
            <div className="hw-port-lbl">{p.num}</div>
          </div>
        ))}
      </div>
      <div className="hw-port-row">
        {botPorts.map(p => (
          <div key={p.num} className="hw-port-wrap" title={`Port ${p.num}${p.device ? ` — ${p.device}` : ''}`}>
            <div className="hw-port">
              <div className="hw-port-led" style={{
                background: LED_COLOR[p.status],
                boxShadow: p.status === 'active' ? `0 0 4px ${LED_COLOR[p.status]}` : undefined,
              }} />
            </div>
            <div className="hw-port-lbl">{p.num}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrafficChart() {
  return (
    <div>
      <svg viewBox="0 0 500 160" style={{ width: '100%', height: 130, overflow: 'visible' }} preserveAspectRatio="none">
        <line x1="40" y1="10"  x2="500" y2="10"  stroke="var(--border)" strokeDasharray="2 2" />
        <line x1="40" y1="70"  x2="500" y2="70"  stroke="var(--border)" strokeDasharray="2 2" />
        <line x1="40" y1="130" x2="500" y2="130" stroke="var(--border)" />
        <text x="32" y="14"  fontSize="10" fill="var(--ink-3)" textAnchor="end" fontFamily="Inter,sans-serif">1G</text>
        <text x="32" y="74"  fontSize="10" fill="var(--ink-3)" textAnchor="end" fontFamily="Inter,sans-serif">500M</text>
        <text x="32" y="134" fontSize="10" fill="var(--ink-3)" textAnchor="end" fontFamily="Inter,sans-serif">0</text>
        <text x="40"  y="150" fontSize="10" fill="var(--ink-3)" textAnchor="middle" fontFamily="Inter,sans-serif">-24h</text>
        <text x="270" y="150" fontSize="10" fill="var(--ink-3)" textAnchor="middle" fontFamily="Inter,sans-serif">-12h</text>
        <text x="500" y="150" fontSize="10" fill="var(--ink-3)" textAnchor="middle" fontFamily="Inter,sans-serif">Now</text>
        <polyline fill="none" stroke="var(--accent)" strokeWidth="2"
          points="40,120 100,110 160,80 220,90 280,40 340,60 400,30 460,50 500,20" />
        <polyline fill="none" stroke="var(--ok)" strokeWidth="2"
          points="40,125 100,115 160,90 220,100 280,50 340,80 400,50 460,70 500,40" />
      </svg>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, fontSize: 12, fontWeight: 600 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 4, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} />
          TX (Out)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 4, borderRadius: 2, background: 'var(--ok)', display: 'inline-block' }} />
          RX (In)
        </span>
      </div>
    </div>
  )
}

export default function SwitchDetailPage() {
  const { switchId } = useParams<{ switchId: string }>()
  const navigate     = useNavigate()
  const location     = useLocation()
  const backTo       = (location.state as { from?: string } | null)?.from ?? '/dashboard/switches'

  const { data: switchesData } = useQuery({ queryKey: ['switches'], queryFn: () => getSwitches() })

  const mockData = SWITCHES[switchId ?? '']
  const apiItem  = switchesData?.find(s => s.SW_ID === switchId)
  const sw: SwitchDevice | undefined = !mockData ? undefined : !apiItem ? mockData : {
    ...mockData,
    name:    apiItem.device_name,
    ip:      apiItem.ip_address ?? mockData.ip,
    model:   apiItem.model ?? mockData.model,
    ports:   apiItem.total_ports ?? mockData.ports,
    powerW:  Math.round(apiItem.poe_used_w ?? mockData.powerW),
    budgetW: Math.round(apiItem.poe_budget_w ?? mockData.budgetW),
    site:    apiItem.Site_ID,
    building: apiItem.Building_ID,
    floor:   apiItem.Floor_ID,
    status:  mapStatus(apiItem.status),
  }

  if (!sw) return (
    <div style={{ padding: 48, color: 'var(--ink-3)', textAlign: 'center' }}>
      Switch <code>{switchId}</code> not found.
    </div>
  )

  const powerPct  = sw.budgetW > 0 ? Math.round(sw.powerW / sw.budgetW * 100) : 0
  const powerWarn = powerPct > 75

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="icon-btn" style={{ flex: 'none' }} onClick={() => navigate(backTo)}>
            <ArrowLeft size={16} />
          </button>
          <span style={{
            width: 36, height: 36, borderRadius: 9, flex: 'none',
            background: `color-mix(in srgb, ${STATUS_COLOR[sw.status]} 15%, transparent)`,
            border: `1.5px solid ${STATUS_COLOR[sw.status]}`,
            display: 'grid', placeItems: 'center', color: STATUS_COLOR[sw.status],
          }}>
            <Network size={18} />
          </span>
          <div>
            <h1 style={{ margin: 0 }}>{sw.name}</h1>
            <p className="page-sub" style={{ margin: 0 }}>{sw.id} · {sw.model}</p>
          </div>
        </div>
        <span style={{
          background: `color-mix(in srgb, ${STATUS_COLOR[sw.status]} 12%, transparent)`,
          color: STATUS_COLOR[sw.status], border: `1px solid ${STATUS_COLOR[sw.status]}`,
          borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600,
        }}>
          {STATUS_LABEL[sw.status]}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 28px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Left col — 55% */}
          <div style={{ width: '55%', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Info grid card */}
            <div className="cam-card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { lbl: 'IP Address',  val: sw.ip,           mono: true  },
                  { lbl: 'MAC Address', val: sw.mac,           mono: true  },
                  { lbl: 'Model',       val: sw.model,         mono: false },
                  { lbl: 'Uptime',      val: sw.uptime,        mono: true  },
                  { lbl: 'Total Ports', val: String(sw.ports), mono: true  },
                  { lbl: 'VLAN',        val: sw.vlan,          mono: true  },
                ].map(item => (
                  <div key={item.lbl} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      {item.lbl}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--ink)',
                      fontFamily: item.mono ? 'JetBrains Mono, monospace' : undefined,
                    }}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* PoE bar */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                  <span>PoE Load — {sw.powerW} W / {sw.budgetW} W</span>
                  <span style={{ color: powerWarn ? 'var(--warn)' : 'var(--ink-2)', fontWeight: 600 }}>{powerPct}%</span>
                </div>
                <div style={{ height: 7, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${powerPct}%`, borderRadius: 999,
                    background: powerWarn ? 'var(--warn)' : 'var(--accent)', transition: 'width .4s ease',
                  }} />
                </div>
              </div>

              {/* Port panel */}
              <div style={{ marginTop: 16 }}>
                <HardwarePortMap sw={sw} />
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-3)', marginTop: 10 }}>
                  {[
                    { color: LED_COLOR.active,   label: 'Active'          },
                    { color: LED_COLOR.error,    label: 'Offline / Error' },
                    { color: LED_COLOR.inactive, label: 'Unused'          },
                  ].map(l => (
                    <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Traffic chart card */}
            <div className="cam-card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Traffic — Last 24h</div>
              <TrafficChart />
            </div>
          </div>

          {/* Right col — 45% — Port Status table */}
          <div style={{ width: '45%' }}>
            <div className="cam-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 700, padding: '16px 20px 0' }}>Port Status</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                <thead>
                  <tr>
                    {['Port', 'Device', 'Speed', 'VLAN', 'Status'].map(h => (
                      <th key={h} style={{
                        background: 'var(--surface-2)', fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-3)',
                        padding: '10px 14px', textAlign: 'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sw.portMap.map(p => {
                    const badge = PORT_BADGE[p.status]
                    return (
                      <tr key={p.num}>
                        <td style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                          padding: '9px 14px', borderBottom: '1px solid var(--border)',
                          color: 'var(--ink-2)',
                        }}>
                          Gi1/0/{p.num}
                        </td>
                        <td style={{
                          fontSize: 12, padding: '9px 14px', borderBottom: '1px solid var(--border)',
                          color: p.device ? 'var(--ink)' : 'var(--ink-3)',
                        }}>
                          {p.device ?? '—'}
                        </td>
                        <td style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                          padding: '9px 14px', borderBottom: '1px solid var(--border)',
                          color: 'var(--ink-2)',
                        }}>
                          {p.speed ?? '—'}
                        </td>
                        <td style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                          padding: '9px 14px', borderBottom: '1px solid var(--border)',
                          color: 'var(--ink-2)',
                        }}>
                          {p.vlan ?? '1'}
                        </td>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{
                            borderRadius: 999, fontSize: 10, fontWeight: 700,
                            textTransform: 'uppercase', padding: '2px 8px',
                            background: badge.bg, color: badge.color,
                          }}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
