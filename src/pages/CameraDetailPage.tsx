import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Video } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'

interface Camera {
  id: string; name: string; ip: string; mac: string; status: Status
  site: string; building: string; floor: string; room: string
  type: 'indoor' | 'outdoor'
  model: string; resolution: string; fps: number; codec: string
  nvr: string; switchPort: string; firmware: string; installedAt: string
}

const CAMERAS: Camera[] = [
  { id:'CAM-001', name:'Lobby Cam A',     ip:'192.168.1.101', mac:'A4:C3:F0:11:22:33', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F1', room:'Main Lobby',        type:'indoor',  model:'Hikvision DS-2CD2143G2', resolution:'2688×1520', fps:25, codec:'H.265', nvr:'NVR-HQ-01', switchPort:'SW-CORE / Gi0/1',  firmware:'V5.7.15', installedAt:'2023-06-12' },
  { id:'CAM-002', name:'Lobby Cam B',     ip:'192.168.1.102', mac:'A4:C3:F0:11:22:34', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F1', room:'Main Lobby',        type:'indoor',  model:'Hikvision DS-2CD2143G2', resolution:'2688×1520', fps:25, codec:'H.265', nvr:'NVR-HQ-01', switchPort:'SW-CORE / Gi0/2',  firmware:'V5.7.15', installedAt:'2023-06-12' },
  { id:'CAM-003', name:'Server Room 01',  ip:'192.168.1.103', mac:'A4:C3:F0:22:33:01', status:'alert', site:'HQ Bangkok',    building:'Building A', floor:'F2', room:'Server Room',       type:'indoor',  model:'Dahua IPC-HDW2831T',     resolution:'2592×1944', fps:20, codec:'H.264', nvr:'NVR-HQ-01', switchPort:'SW-F2 / Gi0/3',    firmware:'V2.820',  installedAt:'2022-11-05' },
  { id:'CAM-004', name:'Server Room 02',  ip:'192.168.1.104', mac:'A4:C3:F0:22:33:02', status:'alert', site:'HQ Bangkok',    building:'Building A', floor:'F2', room:'Server Room',       type:'indoor',  model:'Dahua IPC-HDW2831T',     resolution:'2592×1944', fps:20, codec:'H.264', nvr:'NVR-HQ-01', switchPort:'SW-F2 / Gi0/4',    firmware:'V2.820',  installedAt:'2022-11-05' },
  { id:'CAM-005', name:'Office 3A',       ip:'192.168.1.105', mac:'A4:C3:F0:33:44:01', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', room:'Open Office',       type:'indoor',  model:'Hikvision DS-2CD2143G2', resolution:'2688×1520', fps:25, codec:'H.265', nvr:'NVR-HQ-02', switchPort:'SW-F3 / Gi0/1',    firmware:'V5.7.15', installedAt:'2023-01-20' },
  { id:'CAM-006', name:'Office 3B',       ip:'192.168.1.106', mac:'A4:C3:F0:33:44:02', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', room:'Open Office',       type:'indoor',  model:'Hikvision DS-2CD2143G2', resolution:'2688×1520', fps:25, codec:'H.265', nvr:'NVR-HQ-02', switchPort:'SW-F3 / Gi0/2',    firmware:'V5.7.15', installedAt:'2023-01-20' },
  { id:'CAM-007', name:'Office 3C',       ip:'192.168.1.107', mac:'B8:27:EB:55:66:01', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', room:'Manager Section',   type:'indoor',  model:'Axis P3245-V',           resolution:'1920×1080', fps:30, codec:'H.264', nvr:'NVR-HQ-02', switchPort:'SW-F3 / Gi0/3',    firmware:'10.12.1', installedAt:'2023-03-08' },
  { id:'CAM-008', name:'Break Room 3',    ip:'192.168.1.108', mac:'A4:C3:F0:33:44:08', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', room:'Break Room',        type:'indoor',  model:'Dahua IPC-HDW2831T',     resolution:'2592×1944', fps:20, codec:'H.264', nvr:'NVR-HQ-02', switchPort:'SW-F3 / Gi0/4',    firmware:'V2.820',  installedAt:'2022-11-05' },
  { id:'CAM-009', name:'Meeting Room 3',  ip:'192.168.1.109', mac:'B8:27:EB:55:66:09', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', room:'Meeting Room 301',  type:'indoor',  model:'Axis P3245-V',           resolution:'1920×1080', fps:30, codec:'H.264', nvr:'NVR-HQ-02', switchPort:'SW-F3 / Gi0/5',    firmware:'10.12.1', installedAt:'2023-03-08' },
  { id:'CAM-010', name:'Meeting Room 5A', ip:'192.168.1.110', mac:'A4:C3:F0:55:66:10', status:'warn',  site:'HQ Bangkok',    building:'Building A', floor:'F5', room:'Meeting Room 501',  type:'indoor',  model:'Hikvision DS-2CD2143G2', resolution:'2688×1520', fps:25, codec:'H.265', nvr:'NVR-HQ-02', switchPort:'SW-F5 / Gi0/1',    firmware:'V5.7.15', installedAt:'2023-06-12' },
  { id:'CAM-011', name:'Executive 6A',    ip:'192.168.1.111', mac:'B8:27:EB:66:77:11', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F6', room:'Executive Suite',   type:'indoor',  model:'Axis P3245-V',           resolution:'1920×1080', fps:30, codec:'H.264', nvr:'NVR-HQ-02', switchPort:'SW-F6 / Gi0/1',    firmware:'10.12.1', installedAt:'2023-09-01' },
  { id:'CAM-012', name:'Main Gate Out',   ip:'192.168.1.112', mac:'A4:C3:F0:77:88:12', status:'ok',    site:'HQ Bangkok',    building:'Building D', floor:'F1', room:'Gate Entrance',     type:'outdoor', model:'Hikvision DS-2CD2T47G2', resolution:'2560×1440', fps:25, codec:'H.265', nvr:'NVR-HQ-01', switchPort:'SW-GATE / Gi0/1',  firmware:'V5.7.16', installedAt:'2022-08-15' },
  { id:'CAM-013', name:'Parking Lot A',   ip:'192.168.1.113', mac:'A4:C3:F0:77:88:13', status:'ok',    site:'HQ Bangkok',    building:'Building D', floor:'F1', room:'Parking Zone A',    type:'outdoor', model:'Hikvision DS-2CD2T47G2', resolution:'2560×1440', fps:25, codec:'H.265', nvr:'NVR-HQ-01', switchPort:'SW-GATE / Gi0/2',  firmware:'V5.7.16', installedAt:'2022-08-15' },
  { id:'CAM-014', name:'Annex Lobby',     ip:'192.168.1.114', mac:'A4:C3:F0:88:99:14', status:'ok',    site:'HQ Bangkok',    building:'Building B', floor:'F1', room:'Annex Lobby',       type:'indoor',  model:'Dahua IPC-HDW2831T',     resolution:'2592×1944', fps:20, codec:'H.264', nvr:'NVR-HQ-02', switchPort:'SW-B1 / Gi0/1',    firmware:'V2.820',  installedAt:'2023-02-14' },
  { id:'CAM-015', name:'Warehouse Gate',  ip:'192.168.10.10', mac:'A4:C3:F0:10:20:15', status:'ok',    site:'Chiang Mai DC', building:'Building A', floor:'F1', room:'Warehouse Entrance', type:'outdoor', model:'Hikvision DS-2CD2T47G2', resolution:'2560×1440', fps:25, codec:'H.265', nvr:'NVR-CM-01', switchPort:'SW-CM / Gi0/1',    firmware:'V5.7.16', installedAt:'2023-04-18' },
  { id:'CAM-016', name:'DC Floor 01',     ip:'192.168.10.11', mac:'A4:C3:F0:10:20:16', status:'ok',    site:'Chiang Mai DC', building:'Building A', floor:'F1', room:'Data Center Floor', type:'indoor',  model:'Dahua IPC-HDW2831T',     resolution:'2592×1944', fps:20, codec:'H.264', nvr:'NVR-CM-01', switchPort:'SW-CM / Gi0/2',    firmware:'V2.820',  installedAt:'2023-04-18' },
]

const STATUS_LABEL: Record<Status, string> = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

/* ── Deterministic pseudo-random ─────────────────────────────── */
function rng(seed: number, i: number): number {
  return (((seed * 1103515245 + i * 12345) >>> 0) & 0x7fffffff) / 0x7fffffff
}

function camSeed(id: string): number {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

/* ── Ping history (48 samples = every 30 min = last 24h) ─────── */
function generatePings(id: string, status: Status): Array<number | null> {
  const s = camSeed(id)
  return Array.from({ length: 48 }, (_, i) => {
    if (status === 'alert' && i >= 32) return null
    if (status === 'warn') {
      if (rng(s, i * 7) > 0.88) return null
      return Math.round(20 + rng(s, i) * 80)
    }
    return Math.round(2 + rng(s, i) * 13)
  })
}

/* ── 30-day uptime blocks ────────────────────────────────────── */
function dayStatus(id: string, status: Status, day: number): Status {
  const s = camSeed(id)
  if (status === 'alert' && day === 29) return 'alert'
  const r = rng(s, day * 97)
  if (status === 'warn') return r > 0.55 ? 'warn' : 'ok'
  return r > 0.96 ? 'warn' : 'ok'
}

/* ── Ping chart ──────────────────────────────────────────────── */
function PingChart({ pings }: { pings: Array<number | null> }) {
  const H = 72
  const W = 7
  const GAP = 1

  return (
    <svg
      viewBox={`0 0 ${pings.length * (W + GAP)} ${H}`}
      style={{ width: '100%', height: H, display: 'block' }}
      preserveAspectRatio="none"
    >
      {pings.map((rtt, i) => {
        const x = i * (W + GAP)
        if (rtt === null) {
          return <rect key={i} x={x} y={H - 7} width={W} height={7} fill="var(--alert)" opacity=".7" rx="1" />
        }
        const bh = Math.max(3, Math.round(rtt / 200 * H))
        const fill = rtt > 50 ? 'var(--warn)' : 'var(--ok)'
        return <rect key={i} x={x} y={H - bh} width={W} height={bh} fill={fill} opacity=".8" rx="1" />
      })}
    </svg>
  )
}

export default function CameraDetailPage() {
  const { cameraId } = useParams<{ cameraId: string }>()
  const navigate = useNavigate()

  const cam = CAMERAS.find(c => c.id === cameraId) ?? CAMERAS[0]
  const pings   = generatePings(cam.id, cam.status)
  const valid   = pings.filter((p): p is number => p !== null)
  const avgRtt  = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0
  const maxRtt  = valid.length ? Math.max(...valid) : 0
  const lossRaw = Math.round((pings.filter(p => p === null).length / pings.length) * 100)

  const uptimeDays  = Array.from({ length: 30 }, (_, i) => dayStatus(cam.id, cam.status, i))
  const okDays      = uptimeDays.filter(d => d === 'ok').length
  const uptimePct   = ((okDays / 30) * 100).toFixed(1)
  const uptimeCls   = lossRaw > 20 ? 'alert' : lossRaw > 5 ? 'warn' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button
            className="icon-btn"
            style={{ marginTop: 2, flex: 'none' }}
            onClick={() => navigate('/dashboard/cameras')}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Video size={18} style={{ color: 'var(--ink-3)' }} />
              <h1 style={{ margin: 0 }}>{cam.name}</h1>
              <span className={`cam-status-badge ${cam.status}`}>
                <span className="sb-dot" />
                {STATUS_LABEL[cam.status]}
              </span>
            </div>
            <p className="page-sub" style={{ marginTop: 0 }}>{cam.id} · {cam.model}</p>
          </div>
        </div>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div className="canvas" style={{ overflowY: 'auto' }}>
          <div className="cam-detail">

            {/* ── Left: info cards ── */}
            <div className="cam-info-col">

              <div className="cam-card">
                <div className="cam-card-title">Location</div>
                <div className="cam-row">
                  <span className="cam-row-label">Site</span>
                  <span className="cam-row-val">{cam.site}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Building</span>
                  <span className="cam-row-val">{cam.building}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Floor</span>
                  <span className="cam-row-val">{cam.floor}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Room</span>
                  <span className="cam-row-val">{cam.room}</span>
                </div>
              </div>

              <div className="cam-card">
                <div className="cam-card-title">Network</div>
                <div className="cam-row">
                  <span className="cam-row-label">IP</span>
                  <span className="cam-row-val mono">{cam.ip}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">MAC</span>
                  <span className="cam-row-val mono">{cam.mac}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">NVR</span>
                  <span className="cam-row-val mono">{cam.nvr}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Switch port</span>
                  <span className="cam-row-val mono">{cam.switchPort}</span>
                </div>
              </div>

              <div className="cam-card">
                <div className="cam-card-title">Device</div>
                <div className="cam-row">
                  <span className="cam-row-label">Type</span>
                  <span className="cam-row-val" style={{ textTransform: 'capitalize' }}>{cam.type}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Resolution</span>
                  <span className="cam-row-val mono">{cam.resolution}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Frame rate</span>
                  <span className="cam-row-val mono">{cam.fps} fps</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Codec</span>
                  <span className="cam-row-val mono">{cam.codec}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Firmware</span>
                  <span className="cam-row-val mono">{cam.firmware}</span>
                </div>
                <div className="cam-row">
                  <span className="cam-row-label">Installed</span>
                  <span className="cam-row-val">{cam.installedAt}</span>
                </div>
              </div>

            </div>

            {/* ── Right: ping chart + uptime ── */}
            <div className="cam-chart-col">

              <div className="ping-chart-wrap">
                <div className="ping-chart-title">Ping History — Last 24 Hours</div>
                <div className="ping-svg-wrap">
                  <PingChart pings={pings} />
                </div>
                <div className="ping-stats">
                  <div className="ping-stat">
                    <span className="ping-stat-label">Avg RTT</span>
                    <span className={`ping-stat-val${avgRtt > 50 ? ' warn' : ''}`}>
                      {cam.status === 'alert' ? '—' : avgRtt}
                      {cam.status !== 'alert' && <span className="ping-stat-unit">ms</span>}
                    </span>
                  </div>
                  <div className="ping-stat">
                    <span className="ping-stat-label">Max RTT</span>
                    <span className={`ping-stat-val${maxRtt > 100 ? ' warn' : ''}`}>
                      {cam.status === 'alert' ? '—' : maxRtt}
                      {cam.status !== 'alert' && <span className="ping-stat-unit">ms</span>}
                    </span>
                  </div>
                  <div className="ping-stat">
                    <span className="ping-stat-label">Packet Loss</span>
                    <span className={`ping-stat-val${lossRaw > 0 ? ' alert' : ''}`}>
                      {lossRaw}<span className="ping-stat-unit">%</span>
                    </span>
                  </div>
                  <div className="ping-stat" style={{ marginLeft: 'auto' }}>
                    <span className="ping-stat-label">Last seen</span>
                    <span className="ping-stat-val" style={{ fontSize: 14 }}>
                      {cam.status === 'alert' ? '8m ago' : cam.status === 'warn' ? '5m ago' : 'just now'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="uptime-wrap">
                <div className="uptime-header">
                  <span className="uptime-title">30-Day Uptime</span>
                  <span className={`uptime-pct${uptimeCls ? ' ' + uptimeCls : ''}`}>{uptimePct}%</span>
                </div>
                <div className="uptime-blocks">
                  {uptimeDays.map((s, i) => (
                    <div key={i} className={`uptime-block ${s}`} title={`Day ${i + 1}`} />
                  ))}
                </div>
                <div className="uptime-footer">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
