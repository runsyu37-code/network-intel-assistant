import { useParams } from 'react-router-dom'
import { Network, Wifi, MapPin, Zap } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'
type PortStatus = 'active' | 'inactive' | 'error'

interface Port {
  num: number; status: PortStatus; device?: string; poeW?: number
}

interface SwitchDevice {
  id: string; name: string; ip: string; mac: string; status: Status
  site: string; building: string; floor: string; rack: string
  model: string; firmware: string; installedAt: string
  ports: number; activePorts: number
  powerW: number; budgetW: number
  vlan: string
  portMap: Port[]
}

function makePorts(total: number, activePorts: number, devices: string[]): Port[] {
  return Array.from({ length: total }, (_, i) => {
    if (i < devices.length) return { num: i + 1, status: 'active', device: devices[i], poeW: 12 + Math.floor(i * 3.7) % 12 }
    if (i < activePorts)     return { num: i + 1, status: 'active', poeW: 8 }
    if (i === activePorts)   return { num: i + 1, status: 'error' }
    return { num: i + 1, status: 'inactive' }
  })
}

const SWITCHES: Record<string, SwitchDevice> = {
  'SW-HQ-CORE': {
    id:'SW-HQ-CORE', name:'Core Switch HQ', ip:'192.168.1.2', mac:'00:1A:2B:AA:BB:01',
    status:'ok', site:'HQ Bangkok', building:'Building A', floor:'F2', rack:'Rack A1',
    model:'Cisco SG350X-24P', firmware:'2.5.7.85', installedAt:'2022-11-01',
    ports:24, activePorts:22, powerW:185, budgetW:370, vlan:'VLAN 10,20,30',
    portMap: makePorts(24, 22, ['NVR-01','NVR-02','CAM-001','CAM-002','CAM-003','CAM-004','CAM-005','CAM-006','CAM-007','CAM-008']),
  },
  'SW-HQ-FLOOR3': {
    id:'SW-HQ-FLOOR3', name:'Floor 3 Switch', ip:'192.168.1.3', mac:'00:1A:2B:AA:BB:02',
    status:'alert', site:'HQ Bangkok', building:'Building A', floor:'F3', rack:'Rack A1',
    model:'Cisco CBS350-24P', firmware:'3.3.1.12', installedAt:'2023-01-15',
    ports:24, activePorts:0, powerW:0, budgetW:370, vlan:'VLAN 20',
    portMap: makePorts(24, 0, []),
  },
  'SW-HQ-FLOOR2': {
    id:'SW-HQ-FLOOR2', name:'Floor 2 Switch', ip:'192.168.1.4', mac:'00:1A:2B:AA:BB:03',
    status:'warn', site:'HQ Bangkok', building:'Building A', floor:'F2', rack:'Rack A1',
    model:'Cisco CBS350-24P', firmware:'3.3.1.12', installedAt:'2023-01-15',
    ports:24, activePorts:20, powerW:310, budgetW:370, vlan:'VLAN 10,20',
    portMap: makePorts(24, 20, ['CAM-003','CAM-004','NVR-HQ-01','NVR-HQ-02']),
  },
  'SW-MINI-01': {
    id:'SW-MINI-01', name:'Mini Switch 01', ip:'192.168.1.5', mac:'00:1A:2B:AA:BB:04',
    status:'ok', site:'HQ Bangkok', building:'Building A', floor:'F2', rack:'Rack A1',
    model:'TP-Link TL-SG1016PE', firmware:'1.0.16 Build 220330', installedAt:'2023-03-01',
    ports:16, activePorts:12, powerW:95, budgetW:150, vlan:'VLAN 20',
    portMap: makePorts(16, 12, ['CAM-005','CAM-006','CAM-007','CAM-008']),
  },
  'SW-MINI-02': {
    id:'SW-MINI-02', name:'Mini Switch 02', ip:'192.168.1.6', mac:'00:1A:2B:AA:BB:05',
    status:'warn', site:'HQ Bangkok', building:'Building A', floor:'F2', rack:'Rack A1',
    model:'TP-Link TL-SG1016PE', firmware:'1.0.16 Build 220330', installedAt:'2023-03-01',
    ports:16, activePorts:14, powerW:128, budgetW:150, vlan:'VLAN 20',
    portMap: makePorts(16, 14, ['CAM-009','CAM-010','CAM-011']),
  },
  'SW-CM-01': {
    id:'SW-CM-01', name:'Chiang Mai Core', ip:'192.168.10.2', mac:'00:1A:2B:AA:CC:01',
    status:'ok', site:'Chiang Mai DC', building:'Building A', floor:'F1', rack:'Rack C1',
    model:'Cisco SG350-28P', firmware:'2.5.7.85', installedAt:'2023-07-01',
    ports:28, activePorts:14, powerW:120, budgetW:375, vlan:'VLAN 10',
    portMap: makePorts(28, 14, ['CAM-015','CAM-016','NVR-CM-01']),
  },
  'SW-PK-01': {
    id:'SW-PK-01', name:'Phuket Switch', ip:'192.168.20.2', mac:'00:1A:2B:AA:DD:01',
    status:'ok', site:'Phuket Branch', building:'Building A', floor:'F1', rack:'Rack P1',
    model:'Cisco CBS350-16P', firmware:'3.3.1.12', installedAt:'2023-11-20',
    ports:16, activePorts:8, powerW:74, budgetW:240, vlan:'VLAN 10',
    portMap: makePorts(16, 8, ['NVR-PK-01']),
  },
  'SW-KK-01': {
    id:'SW-KK-01', name:'Khon Kaen Switch', ip:'192.168.30.2', mac:'00:1A:2B:AA:EE:01',
    status:'ok', site:'Khon Kaen', building:'Building A', floor:'F1', rack:'Rack K1',
    model:'TP-Link TL-SG1016PE', firmware:'1.0.16 Build 220330', installedAt:'2024-01-10',
    ports:16, activePorts:5, powerW:42, budgetW:150, vlan:'VLAN 10',
    portMap: makePorts(16, 5, ['NVR-KK-01']),
  },
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const STATUS_LABEL: Record<Status, string>  = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

const PORT_BG: Record<PortStatus, string> = {
  active:   'color-mix(in srgb, var(--ok) 14%, var(--surface-2))',
  inactive: 'var(--surface-2)',
  error:    'color-mix(in srgb, var(--alert) 14%, var(--surface-2))',
}
const PORT_BORDER: Record<PortStatus, string> = {
  active:   'var(--ok)',
  inactive: 'var(--border)',
  error:    'var(--alert)',
}

const LED_COLOR: Record<PortStatus, string> = {
  active:   '#17A34A',
  inactive: '#444',
  error:    '#EAB308',
}

function HardwarePortMap({ sw }: { sw: SwitchDevice }) {
  const half = Math.ceil(sw.ports / 2)
  const topPorts  = sw.portMap.filter((_, i) => i % 2 === 0)
  const botPorts  = sw.portMap.filter((_, i) => i % 2 === 1)

  const PortPin = ({ p }: { p: Port }) => (
    <div
      className="hw-port-wrap"
      title={`Port ${p.num}${p.device ? ` — ${p.device}` : ''}${p.poeW ? ` (${p.poeW}W)` : ''}`}
    >
      <div className="hw-port">
        <div className="hw-port-led" style={{ background: LED_COLOR[p.status], boxShadow: p.status === 'active' ? `0 0 4px ${LED_COLOR[p.status]}` : undefined }} />
      </div>
      <div className="hw-port-lbl">{p.num}</div>
    </div>
  )

  return (
    <div className="hw-switch-panel">
      <div className="hw-port-row">
        {topPorts.slice(0, half).map(p => <PortPin key={p.num} p={p} />)}
      </div>
      <div className="hw-port-row">
        {botPorts.slice(0, half).map(p => <PortPin key={p.num} p={p} />)}
      </div>
    </div>
  )
}

function TrafficChart() {
  return (
    <div>
      <svg viewBox="0 0 500 160" style={{ width: '100%', height: 140, overflow: 'visible' }} preserveAspectRatio="none">
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
  const sw = SWITCHES[switchId ?? '']

  if (!sw) return (
    <div style={{ padding: 48, color: 'var(--ink-3)', textAlign: 'center' }}>
      Switch <code>{switchId}</code> not found.
    </div>
  )

  const powerPct   = sw.budgetW > 0 ? Math.round(sw.powerW / sw.budgetW * 100) : 0
  const powerWarn  = powerPct > 75
  const portPct    = Math.round(sw.activePorts / sw.ports * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 9,
            background: `color-mix(in srgb, ${STATUS_COLOR[sw.status]} 15%, transparent)`,
            border: `1.5px solid ${STATUS_COLOR[sw.status]}`,
            display: 'grid', placeItems: 'center', color: STATUS_COLOR[sw.status], flex: 'none',
          }}><Network size={18} /></span>
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

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 28px 28px' }}>
        <div className="nvr-detail">

          {/* Left column */}
          <div className="nvr-info-col">

            <div className="cam-card">
              <div className="cam-card-title"><MapPin size={13} /> Location</div>
              <div className="cam-row"><span className="cr-label">Site</span><span className="cr-val">{sw.site}</span></div>
              <div className="cam-row"><span className="cr-label">Building</span><span className="cr-val">{sw.building}</span></div>
              <div className="cam-row"><span className="cr-label">Floor</span><span className="cr-val">{sw.floor}</span></div>
              <div className="cam-row"><span className="cr-label">Rack</span><span className="cr-val cr-mono">{sw.rack}</span></div>
            </div>

            <div className="cam-card">
              <div className="cam-card-title"><Wifi size={13} /> Network</div>
              <div className="cam-row"><span className="cr-label">IP Address</span><span className="cr-val cr-mono">{sw.ip}</span></div>
              <div className="cam-row"><span className="cr-label">MAC</span><span className="cr-val cr-mono">{sw.mac}</span></div>
              <div className="cam-row"><span className="cr-label">VLAN</span><span className="cr-val cr-mono">{sw.vlan}</span></div>
              <div className="cam-row"><span className="cr-label">Firmware</span><span className="cr-val cr-mono">{sw.firmware}</span></div>
              <div className="cam-row"><span className="cr-label">Installed</span><span className="cr-val">{sw.installedAt}</span></div>
            </div>

            <div className="cam-card">
              <div className="cam-card-title"><Zap size={13} /> PoE Power</div>
              <div className="cam-row"><span className="cr-label">In use</span><span className="cr-val cr-mono" style={{ color: powerWarn ? 'var(--warn)' : undefined }}>{sw.powerW} W</span></div>
              <div className="cam-row"><span className="cr-label">Budget</span><span className="cr-val cr-mono">{sw.budgetW} W</span></div>
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                  <span>Load</span>
                  <span style={{ color: powerWarn ? 'var(--warn)' : 'var(--ink-2)', fontWeight: 600 }}>{powerPct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${powerPct}%`, borderRadius: 999, background: powerWarn ? 'var(--warn)' : 'var(--accent)', transition: 'width .4s ease' }} />
                </div>
                {powerWarn && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--warn)', fontWeight: 600 }}>PoE load above 75% — risk of brownout.</div>}
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="nvr-chart-col">

            <div className="cam-card">
              <div className="cam-card-title">Port Map — {sw.ports} ports</div>
              <HardwarePortMap sw={sw} />
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-3)', marginTop: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: LED_COLOR.active, display: 'inline-block' }} /> Active
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: LED_COLOR.error, display: 'inline-block' }} /> Error
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: LED_COLOR.inactive, display: 'inline-block' }} /> Inactive
                </span>
              </div>
            </div>

            <div className="cam-card">
              <div className="cam-card-title" style={{ marginBottom: 4 }}>Traffic — Last 24h</div>
              <TrafficChart />
            </div>

            <div className="cam-card">
              <div className="cam-card-title">Port Statistics</div>
              <div className="stats-grid">
                <div className="ps-item">
                  <span className="ps-val">{sw.activePorts} / {sw.ports}</span>
                  <span className="ps-label">Ports active</span>
                </div>
                <div className="ps-item">
                  <span className="ps-val">{portPct}%</span>
                  <span className="ps-label">Utilization</span>
                </div>
                <div className="ps-item">
                  <span className="ps-val">{sw.ports - sw.activePorts}</span>
                  <span className="ps-label">Free ports</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
