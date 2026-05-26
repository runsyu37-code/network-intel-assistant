import { useParams } from 'react-router-dom'
import { HardDrive, Wifi, MapPin, Server } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'

interface NVR {
  id: string; name: string; ip: string; mac: string; status: Status
  site: string; building: string; floor: string; rack: string
  model: string; firmware: string; installedAt: string
  channels: number; usedCh: number
  storageTB: number; storageUsedPct: number; retentionDays: number
  connectedCams: string[]
}

const NVRS: Record<string, NVR> = {
  'NVR-HQ-01': {
    id: 'NVR-HQ-01', name: 'NVR HQ 01', ip: '192.168.1.200', mac: '00:1A:2B:3C:4D:01',
    status: 'ok', site: 'HQ Bangkok', building: 'Building A', floor: 'F2', rack: 'Rack A1',
    model: 'Hikvision DS-7732NI-I4', firmware: 'V4.62.200', installedAt: '2023-04-12',
    channels: 32, usedCh: 28, storageTB: 8, storageUsedPct: 72, retentionDays: 30,
    connectedCams: ['CAM-001','CAM-002','CAM-005','CAM-006','CAM-007','CAM-008','CAM-009','CAM-010','CAM-011','CAM-012','CAM-013','CAM-014'],
  },
  'NVR-HQ-02': {
    id: 'NVR-HQ-02', name: 'NVR HQ 02', ip: '192.168.1.201', mac: '00:1A:2B:3C:4D:02',
    status: 'ok', site: 'HQ Bangkok', building: 'Building A', floor: 'F2', rack: 'Rack A1',
    model: 'Hikvision DS-7732NI-I4', firmware: 'V4.62.200', installedAt: '2023-04-12',
    channels: 32, usedCh: 16, storageTB: 8, storageUsedPct: 41, retentionDays: 30,
    connectedCams: ['CAM-003','CAM-004','CAM-015','CAM-016'],
  },
  'NVR-HQ-03': {
    id: 'NVR-HQ-03', name: 'NVR HQ 03', ip: '192.168.1.202', mac: '00:1A:2B:3C:4D:03',
    status: 'warn', site: 'HQ Bangkok', building: 'Building B', floor: 'F1', rack: 'Rack B1',
    model: 'Dahua NVR5232-EI', firmware: 'V4.000.0000003.0', installedAt: '2023-06-01',
    channels: 32, usedCh: 18, storageTB: 16, storageUsedPct: 85, retentionDays: 60,
    connectedCams: ['CAM-014'],
  },
  'NVR-CM-01': {
    id: 'NVR-CM-01', name: 'NVR Chiang Mai', ip: '192.168.10.200', mac: '00:1A:2B:3C:4D:04',
    status: 'ok', site: 'Chiang Mai DC', building: 'Building A', floor: 'F1', rack: 'Rack C1',
    model: 'Hikvision DS-7616NI-I2', firmware: 'V4.50.100', installedAt: '2023-09-15',
    channels: 16, usedCh: 10, storageTB: 4, storageUsedPct: 53, retentionDays: 30,
    connectedCams: ['CAM-015','CAM-016'],
  },
  'NVR-PK-01': {
    id: 'NVR-PK-01', name: 'NVR Phuket', ip: '192.168.20.200', mac: '00:1A:2B:3C:4D:05',
    status: 'ok', site: 'Phuket Branch', building: 'Building A', floor: 'F1', rack: 'Rack P1',
    model: 'Dahua NVR5216-EI', firmware: 'V4.000.0000003.0', installedAt: '2023-11-20',
    channels: 16, usedCh: 8, storageTB: 4, storageUsedPct: 31, retentionDays: 30,
    connectedCams: [],
  },
  'NVR-KK-01': {
    id: 'NVR-KK-01', name: 'NVR Khon Kaen', ip: '192.168.30.200', mac: '00:1A:2B:3C:4D:06',
    status: 'ok', site: 'Khon Kaen', building: 'Building A', floor: 'F1', rack: 'Rack K1',
    model: 'Axis S3008', firmware: '11.8.53', installedAt: '2024-01-10',
    channels: 8, usedCh: 5, storageTB: 2, storageUsedPct: 44, retentionDays: 14,
    connectedCams: [],
  },
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const STATUS_LABEL: Record<Status, string>  = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

function rng(seed: number, i: number) {
  return (((seed * 1103515245 + i * 12345) >>> 0) & 0x7fffffff) / 0x7fffffff
}

function ChannelBars({ nvr }: { nvr: NVR }) {
  const seed = nvr.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const names = ['Lobby Cam A','Lobby Cam B','Server Rm 01','Server Rm 02','Main Gate','Parking A',
                 'Annex Lobby','Meeting 5A','Office 3A','Office 3B','Office 3C','Break Rm 3',
                 'Meeting 3','Executive 6A','Corridor B1','Entrance B2']
  const show = Math.min(nvr.channels, 12)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
      {Array.from({ length: show }, (_, i) => {
        const active = i < nvr.usedCh
        const mbps   = active ? Math.round((2.5 + rng(seed, i) * 3.5) * 10) / 10 : 0
        const pct    = active ? Math.round(mbps / 10 * 100) : 0
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
            <span style={{ width: 22, textAlign: 'right', color: 'var(--ink-4)', fontFamily: 'JetBrains Mono, monospace', flex: 'none' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ width: 112, flex: 'none', color: active ? 'var(--ink-2)' : 'var(--ink-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {active ? (names[i] ?? `CAM-${String(i+1).padStart(2,'0')}`) : '— empty —'}
            </span>
            <div style={{ flex: 1, height: 7, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
              {active && <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', opacity: .75, borderRadius: 4 }} />}
            </div>
            <span style={{ width: 52, textAlign: 'right', flex: 'none', fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink-3)', fontSize: 10.5 }}>
              {active ? `${mbps} Mbps` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const MOCK_EVENTS = [
  { time: '14:22:01', type: 'alert' as const, msg: 'CH-03 camera connection lost' },
  { time: '14:18:45', type: 'warn'  as const, msg: 'HDD 1 usage above 75% threshold' },
  { time: '13:55:02', type: 'ok'    as const, msg: 'Recording schedule applied: 24/7 H.265' },
  { time: '13:41:18', type: 'warn'  as const, msg: 'CPU temperature 72°C — fan speed increased' },
  { time: '12:00:00', type: 'ok'    as const, msg: 'Daily health check passed' },
]
const EV_LABEL = { alert: 'Offline', warn: 'Warning', ok: 'Info' }
const EV_COLOR = { alert: 'var(--alert)', warn: 'var(--warn)', ok: 'var(--ok)' }
const EV_BG    = { alert: 'var(--alert-soft)', warn: 'var(--warn-soft)', ok: 'var(--ok-soft)' }

function StorageBar({ pct, warn }: { pct: number; warn: boolean }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
        <span>Used</span><span style={{ color: warn ? 'var(--warn)' : 'var(--ink-2)', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: warn ? 'var(--warn)' : 'var(--accent)', transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

export default function NVRDetailPage() {
  const { nvrId } = useParams<{ nvrId: string }>()
  const nvr = NVRS[nvrId ?? '']

  if (!nvr) return (
    <div style={{ padding: 48, color: 'var(--ink-3)', textAlign: 'center' }}>
      NVR <code>{nvrId}</code> not found.
    </div>
  )

  const storageWarn = nvr.storageUsedPct > 80
  const chPct = Math.round(nvr.usedCh / nvr.channels * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 9,
            background: `color-mix(in srgb, ${STATUS_COLOR[nvr.status]} 15%, transparent)`,
            border: `1.5px solid ${STATUS_COLOR[nvr.status]}`,
            display: 'grid', placeItems: 'center', color: STATUS_COLOR[nvr.status], flex: 'none',
          }}><Server size={18} /></span>
          <div>
            <h1 style={{ margin: 0 }}>{nvr.name}</h1>
            <p className="page-sub" style={{ margin: 0 }}>{nvr.id} · {nvr.model}</p>
          </div>
        </div>
        <span className="cam-status-badge" style={{
          background: `color-mix(in srgb, ${STATUS_COLOR[nvr.status]} 12%, transparent)`,
          color: STATUS_COLOR[nvr.status], border: `1px solid ${STATUS_COLOR[nvr.status]}`,
          borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600,
        }}>
          {STATUS_LABEL[nvr.status]}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 28px 28px' }}>
        <div className="nvr-detail">

          {/* Left column */}
          <div className="nvr-info-col">

            <div className="cam-card">
              <div className="cam-card-title"><MapPin size={13} /> Location</div>
              <div className="cam-row"><span className="cr-label">Site</span><span className="cr-val">{nvr.site}</span></div>
              <div className="cam-row"><span className="cr-label">Building</span><span className="cr-val">{nvr.building}</span></div>
              <div className="cam-row"><span className="cr-label">Floor</span><span className="cr-val">{nvr.floor}</span></div>
              <div className="cam-row"><span className="cr-label">Rack</span><span className="cr-val cr-mono">{nvr.rack}</span></div>
            </div>

            <div className="cam-card">
              <div className="cam-card-title"><Wifi size={13} /> Network</div>
              <div className="cam-row"><span className="cr-label">IP Address</span><span className="cr-val cr-mono">{nvr.ip}</span></div>
              <div className="cam-row"><span className="cr-label">MAC</span><span className="cr-val cr-mono">{nvr.mac}</span></div>
              <div className="cam-row"><span className="cr-label">Firmware</span><span className="cr-val cr-mono">{nvr.firmware}</span></div>
              <div className="cam-row"><span className="cr-label">Installed</span><span className="cr-val">{nvr.installedAt}</span></div>
            </div>

            <div className="cam-card">
              <div className="cam-card-title"><HardDrive size={13} /> Storage</div>
              <div className="cam-row"><span className="cr-label">Capacity</span><span className="cr-val cr-mono">{nvr.storageTB} TB</span></div>
              <div className="cam-row"><span className="cr-label">Retention</span><span className="cr-val">{nvr.retentionDays} days</span></div>
              <StorageBar pct={nvr.storageUsedPct} warn={storageWarn} />
              {storageWarn && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--warn)', fontWeight: 600 }}>
                  Storage above 80% — consider expanding or reducing retention.
                </div>
              )}
            </div>

          </div>

          {/* Right column */}
          <div className="nvr-chart-col">

            <div className="cam-card">
              <div className="cam-card-title">Channel Usage — {nvr.usedCh} / {nvr.channels} Active</div>
              <div style={{ marginBottom: 12 }}>
                <ChannelBars nvr={nvr} />
              </div>
              <div className="stats-grid">
                <div className="ps-item">
                  <span className="ps-val">{nvr.usedCh} / {nvr.channels}</span>
                  <span className="ps-label">Channels active</span>
                </div>
                <div className="ps-item">
                  <span className="ps-val" style={{ color: chPct > 90 ? 'var(--warn)' : undefined }}>{chPct}%</span>
                  <span className="ps-label">Utilization</span>
                </div>
                <div className="ps-item">
                  <span className="ps-val">{nvr.channels - nvr.usedCh}</span>
                  <span className="ps-label">Free channels</span>
                </div>
              </div>
            </div>

            <div className="cam-card">
              <div className="cam-card-title">Recent Events</div>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
                {MOCK_EVENTS.map((ev, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0',
                    borderBottom: i < MOCK_EVENTS.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'var(--ink-4)', flex: 'none', width: 60 }}>
                      {ev.time}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, flex: 'none',
                      background: EV_BG[ev.type], color: EV_COLOR[ev.type],
                      border: `1px solid ${EV_COLOR[ev.type]}44`,
                    }}>
                      {EV_LABEL[ev.type]}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>{ev.msg}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
