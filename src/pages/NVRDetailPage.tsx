import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { HardDrive, Wifi, MapPin, Server, AlertTriangle, ArrowLeft } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'

interface HDD {
  label: string
  usedGB: number
  totalGB: number
  pct: number
}

interface Channel {
  ch: number
  name: string
  mbps: number
  offline: boolean
}

interface NVR {
  id: string; name: string; ip: string; mac: string; status: Status
  site: string; building: string; floor: string; rack: string
  model: string; firmware: string; installedAt: string
  channels: number; usedCh: number
  retentionDays: number
  hdds: HDD[]
  connectedCams: string[]
}

const NVRS: Record<string, NVR> = {
  'NVR-HQ-01': {
    id: 'NVR-HQ-01', name: 'NVR HQ 01', ip: '192.168.1.200', mac: '00:1A:2B:3C:4D:01',
    status: 'ok', site: 'HQ Bangkok', building: 'Building A', floor: 'F2', rack: 'Rack A1',
    model: 'Hikvision DS-7732NI-I4', firmware: 'V4.62.200', installedAt: '2023-04-12',
    channels: 32, usedCh: 28, retentionDays: 30,
    hdds: [
      { label: 'HDD1', usedGB: 726, totalGB: 931, pct: 78 },
      { label: 'HDD2', usedGB: 884, totalGB: 931, pct: 95 },
    ],
    connectedCams: ['CAM-001','CAM-002','CAM-005','CAM-006','CAM-007','CAM-008'],
  },
  'NVR-HQ-02': {
    id: 'NVR-HQ-02', name: 'NVR HQ 02', ip: '192.168.1.201', mac: '00:1A:2B:3C:4D:02',
    status: 'ok', site: 'HQ Bangkok', building: 'Building A', floor: 'F2', rack: 'Rack A1',
    model: 'Hikvision DS-7732NI-I4', firmware: 'V4.62.200', installedAt: '2023-04-12',
    channels: 32, usedCh: 16, retentionDays: 30,
    hdds: [
      { label: 'HDD1', usedGB: 380, totalGB: 931, pct: 41 },
      { label: 'HDD2', usedGB: 455, totalGB: 931, pct: 49 },
    ],
    connectedCams: ['CAM-003','CAM-004'],
  },
  'NVR-HQ-03': {
    id: 'NVR-HQ-03', name: 'NVR HQ 03', ip: '192.168.1.202', mac: '00:1A:2B:3C:4D:03',
    status: 'warn', site: 'HQ Bangkok', building: 'Building B', floor: 'F1', rack: 'Rack B1',
    model: 'Dahua NVR5232-EI', firmware: 'V4.000.0000003.0', installedAt: '2023-06-01',
    channels: 32, usedCh: 18, retentionDays: 60,
    hdds: [
      { label: 'HDD1', usedGB: 840, totalGB: 931, pct: 90 },
      { label: 'HDD2', usedGB: 884, totalGB: 931, pct: 95 },
    ],
    connectedCams: ['CAM-014'],
  },
  'NVR-CM-01': {
    id: 'NVR-CM-01', name: 'NVR Chiang Mai', ip: '192.168.10.200', mac: '00:1A:2B:3C:4D:04',
    status: 'ok', site: 'Chiang Mai DC', building: 'Building A', floor: 'F1', rack: 'Rack C1',
    model: 'Hikvision DS-7616NI-I2', firmware: 'V4.50.100', installedAt: '2023-09-15',
    channels: 16, usedCh: 10, retentionDays: 30,
    hdds: [
      { label: 'HDD1', usedGB: 494, totalGB: 931, pct: 53 },
    ],
    connectedCams: ['CAM-015','CAM-016'],
  },
  'NVR-PK-01': {
    id: 'NVR-PK-01', name: 'NVR Phuket', ip: '192.168.20.200', mac: '00:1A:2B:3C:4D:05',
    status: 'ok', site: 'Phuket Branch', building: 'Building A', floor: 'F1', rack: 'Rack P1',
    model: 'Dahua NVR5216-EI', firmware: 'V4.000.0000003.0', installedAt: '2023-11-20',
    channels: 16, usedCh: 8, retentionDays: 30,
    hdds: [
      { label: 'HDD1', usedGB: 289, totalGB: 931, pct: 31 },
    ],
    connectedCams: [],
  },
  'NVR-KK-01': {
    id: 'NVR-KK-01', name: 'NVR Khon Kaen', ip: '192.168.30.200', mac: '00:1A:2B:3C:4D:06',
    status: 'ok', site: 'Khon Kaen', building: 'Building A', floor: 'F1', rack: 'Rack K1',
    model: 'Axis S3008', firmware: '11.8.53', installedAt: '2024-01-10',
    channels: 8, usedCh: 5, retentionDays: 14,
    hdds: [
      { label: 'HDD1', usedGB: 410, totalGB: 931, pct: 44 },
    ],
    connectedCams: [],
  },
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const STATUS_LABEL: Record<Status, string>  = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

const MOCK_EVENTS = [
  { time: '10:15:22', sev: 'crit' as const, msg: 'Channel 5 signal lost' },
  { time: '09:40:01', sev: 'warn' as const, msg: 'HDD2 approaching capacity' },
  { time: '08:05:10', sev: 'info' as const, msg: 'Recording resumed on CH01' },
  { time: '08:00:00', sev: 'info' as const, msg: 'System boot completed' },
  { time: '07:58:30', sev: 'crit' as const, msg: 'Unexpected shutdown' },
  { time: 'Yesterday', sev: 'info' as const, msg: 'User admin logged in' },
  { time: 'Yesterday', sev: 'warn' as const, msg: 'Network latency high' },
  { time: 'Yesterday', sev: 'info' as const, msg: 'Backup routine started' },
]

const SEV_STYLE = {
  crit: { bg: 'var(--alert-soft)', color: 'var(--alert)', label: 'CRITICAL' },
  warn: { bg: 'var(--warn-soft)',  color: 'var(--warn)',  label: 'WARN'     },
  info: { bg: 'var(--surface-2)', color: 'var(--ink-2)',  label: 'INFO'     },
}

const CAM_NAMES = [
  'Lobby Cam A', 'Lobby Cam B', 'Server Rm 01', 'Server Rm 02',
  'Main Gate', 'Parking A', 'Annex Lobby', 'Meeting 5A',
  'Office 3A', 'Office 3B', 'Office 3C', 'Break Rm 3',
]

function makeChannels(nvr: NVR): Channel[] {
  const seed = nvr.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: Math.min(nvr.channels, 12) }, (_, i) => {
    const active = i < nvr.usedCh
    const r = (((seed * 1103515245 + i * 12345) >>> 0) & 0x7fffffff) / 0x7fffffff
    const mbps = active ? Math.round((2.5 + r * 7.5) * 10) / 10 : 0
    return {
      ch: i + 1,
      name: active ? (CAM_NAMES[i] ?? `CAM-${String(i+1).padStart(2,'0')}`) : '— empty —',
      mbps,
      offline: active && mbps === 0,
    }
  })
}

export default function NVRDetailPage() {
  const { nvrId } = useParams<{ nvrId: string }>()
  const navigate  = useNavigate()
  const location  = useLocation()
  const backTo    = (location.state as { from?: string } | null)?.from ?? '/dashboard/nvrs'
  const nvr       = NVRS[nvrId ?? '']

  if (!nvr) return (
    <div style={{ padding: 48, color: 'var(--ink-3)', textAlign: 'center' }}>
      NVR <code>{nvrId}</code> not found.
    </div>
  )

  const channels = makeChannels(nvr)

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
            background: `color-mix(in srgb, ${STATUS_COLOR[nvr.status]} 15%, transparent)`,
            border: `1.5px solid ${STATUS_COLOR[nvr.status]}`,
            display: 'grid', placeItems: 'center', color: STATUS_COLOR[nvr.status],
          }}>
            <Server size={18} />
          </span>
          <div>
            <h1 style={{ margin: 0 }}>{nvr.name}</h1>
            <p className="page-sub" style={{ margin: 0 }}>{nvr.id} · {nvr.model}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--ink-3)' }}>
            {nvr.firmware}
          </span>
          <span style={{
            background: `color-mix(in srgb, ${STATUS_COLOR[nvr.status]} 12%, transparent)`,
            color: STATUS_COLOR[nvr.status], border: `1px solid ${STATUS_COLOR[nvr.status]}`,
            borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600,
          }}>
            {STATUS_LABEL[nvr.status]}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 28px' }}>

        {/* Info row: Location + Network */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div className="cam-card" style={{ flex: 1 }}>
            <div className="cam-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} /> Location
            </div>
            <div className="cam-row">
              <span className="cr-label">Site</span>
              <span className="cr-val">{nvr.site}</span>
            </div>
            <div className="cam-row">
              <span className="cr-label">Building</span>
              <span className="cr-val">{nvr.building}</span>
            </div>
            <div className="cam-row">
              <span className="cr-label">Floor · Rack</span>
              <span className="cr-val cr-mono">{nvr.floor} / {nvr.rack}</span>
            </div>
          </div>
          <div className="cam-card" style={{ flex: 1 }}>
            <div className="cam-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wifi size={13} /> Network
            </div>
            <div className="cam-row">
              <span className="cr-label">IP Address</span>
              <span className="cr-val cr-mono">{nvr.ip}</span>
            </div>
            <div className="cam-row">
              <span className="cr-label">MAC</span>
              <span className="cr-val cr-mono">{nvr.mac}</span>
            </div>
            <div className="cam-row">
              <span className="cr-label">Installed</span>
              <span className="cr-val">{nvr.installedAt}</span>
            </div>
          </div>
          <div className="cam-card" style={{ display: 'flex', gap: 32, alignItems: 'center', padding: '14px 24px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                {nvr.usedCh}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}> / {nvr.channels}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4 }}>
                Channels
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                {nvr.retentionDays}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4 }}>
                Day Retention
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, alignItems: 'flex-start' }}>

          {/* Left: Storage + Channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Storage Status */}
            <div className="cam-card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={15} /> Storage Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {nvr.hdds.map(hdd => {
                  const isAlert = hdd.pct >= 85
                  const color   = isAlert ? 'var(--alert)' : 'var(--ok)'
                  return (
                    <div key={hdd.label} style={{
                      background: 'var(--surface-2)', borderRadius: 8, padding: 16,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, color: isAlert ? 'var(--alert)' : 'var(--ink)' }}>
                          {isAlert && <AlertTriangle size={15} />}
                          {hdd.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{hdd.usedGB} GB / {hdd.totalGB} GB</span>
                          <span style={{ fontWeight: 700, marginLeft: 8, color }}>{hdd.pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-3, var(--border))', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${hdd.pct}%`, borderRadius: 4, background: color, transition: 'width .4s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Channels Table */}
            <div className="cam-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 700, padding: '16px 20px 0' }}>
                Channels
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                <thead>
                  <tr>
                    {['CH', 'Camera Name', 'Bandwidth'].map(h => (
                      <th key={h} style={{
                        background: 'var(--surface-2)', fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-3)',
                        padding: '10px 16px', textAlign: 'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {channels.map(ch => {
                    const bwWarn = ch.mbps > 8
                    const bwPct  = Math.min(100, Math.round(ch.mbps / 10 * 100))
                    const bwColor = bwWarn ? 'var(--warn)' : 'var(--accent)'
                    return (
                      <tr key={ch.ch}>
                        <td style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                          padding: '10px 16px', borderBottom: '1px solid var(--border)',
                          color: ch.mbps === 0 && ch.name !== '— empty —' ? 'var(--alert)' : 'var(--ink-2)',
                        }}>
                          CH{String(ch.ch).padStart(2, '0')}
                        </td>
                        <td style={{
                          fontSize: 13, padding: '10px 16px', borderBottom: '1px solid var(--border)',
                          color: ch.name === '— empty —' ? 'var(--ink-3)' : 'var(--ink)',
                        }}>
                          {ch.name}
                        </td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 4, background: 'var(--surface-3, var(--border))', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                              <div style={{ height: '100%', width: `${bwPct}%`, background: bwColor }} />
                            </div>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--ink-2)' }}>
                              {ch.mbps.toFixed(1)} Mbps
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Event Logs */}
          <div className="cam-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 700, padding: '16px 20px 0' }}>Event Logs</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr>
                  {['Time', 'Sev', 'Message'].map(h => (
                    <th key={h} style={{
                      background: 'var(--surface-2)', fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-3)',
                      padding: '10px 16px', textAlign: 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_EVENTS.map((ev, i) => {
                  const s = SEV_STYLE[ev.sev]
                  return (
                    <tr key={i}>
                      <td style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ink-3)',
                        padding: '10px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                      }}>
                        {ev.time}
                      </td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{
                          borderRadius: 999, fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', padding: '2px 8px',
                          background: s.bg, color: s.color,
                        }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={{
                        fontSize: 13, padding: '10px 16px', borderBottom: '1px solid var(--border)',
                        color: 'var(--ink)',
                      }}>
                        {ev.msg}
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
  )
}
