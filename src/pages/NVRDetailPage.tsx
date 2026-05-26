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

/* Deterministic 24-hour channel-usage sparkline */
function rng(seed: number, i: number) {
  return (((seed * 1103515245 + i * 12345) >>> 0) & 0x7fffffff) / 0x7fffffff
}

function ChannelSparkline({ nvr }: { nvr: NVR }) {
  const seed = nvr.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const N = 24
  const W = 7, GAP = 2, H = 48

  return (
    <svg viewBox={`0 0 ${N * (W + GAP)} ${H + 16}`} style={{ width: '100%', height: 'auto' }}>
      {Array.from({ length: N }, (_, i) => {
        const base = nvr.usedCh / nvr.channels
        const val  = Math.max(0.08, Math.min(1, base + (rng(seed, i) - 0.5) * 0.3))
        const barH = Math.max(4, Math.round(val * H))
        const x    = i * (W + GAP)
        const isNow = i === N - 1
        return (
          <g key={i}>
            <rect x={x} y={H - barH} width={W} height={barH} rx="2"
              fill={isNow ? 'var(--accent)' : 'rgba(91,141,239,0.38)'}
              stroke="none"
            />
            {i % 6 === 0 && (
              <text x={x + W / 2} y={H + 12} textAnchor="middle"
                fontSize="8" fontFamily="'JetBrains Mono', monospace" fill="var(--ink-4)"
              >{i === 0 ? '00h' : `${String(i).padStart(2, '0')}h`}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

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
              <div className="cam-card-title">Channel Usage — last 24 hours</div>
              <div style={{ marginBottom: 12 }}>
                <ChannelSparkline nvr={nvr} />
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
              <div className="cam-card-title">Connected Cameras ({nvr.connectedCams.length})</div>
              {nvr.connectedCams.length === 0 ? (
                <div style={{ color: 'var(--ink-4)', fontSize: 12, padding: '8px 0' }}>No camera data available</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {nvr.connectedCams.map(c => (
                    <span key={c} style={{
                      fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 5, padding: '2px 8px', color: 'var(--ink-2)',
                    }}>{c}</span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
