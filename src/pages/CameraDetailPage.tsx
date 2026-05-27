import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Video, RefreshCw } from 'lucide-react'
import { getCameraById, getPingLogs } from '../api/cameras'
import type { CameraApi, PingLogApi } from '../api/types'

/* ── Status mapping ──────────────────────────────────────────── */
type UiStatus = 'ok' | 'warn' | 'alert'
const STATUS_LABEL: Record<UiStatus, string> = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

function toUiStatus(s: string | null): UiStatus {
  const v = (s ?? '').toLowerCase()
  if (v === 'online')  return 'ok'
  if (v === 'warning') return 'warn'
  return 'alert'
}

/* ── Ping helpers ────────────────────────────────────────────── */
type PingPoint = number | null

function pingLogsToChart(logs: PingLogApi[]): PingPoint[] {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.pinged_at + (a.pinged_at.endsWith('Z') ? '' : 'Z')).getTime()
           - new Date(b.pinged_at + (b.pinged_at.endsWith('Z') ? '' : 'Z')).getTime()
  )
  const last48 = sorted.slice(-48)
  if (last48.length === 0) return Array(48).fill(null)
  return last48.map(p => (p.is_alive && p.latency_ms != null) ? Math.round(Number(p.latency_ms)) : null)
}

function pingLogsToUptime(logs: PingLogApi[]): UiStatus[] {
  const now = Date.now()
  return Array.from({ length: 30 }, (_, i) => {
    const dayStart = now - (29 - i + 1) * 86400_000
    const dayEnd   = dayStart + 86400_000
    const dayLogs  = logs.filter(p => {
      const t = new Date(p.pinged_at + (p.pinged_at.endsWith('Z') ? '' : 'Z')).getTime()
      return t >= dayStart && t < dayEnd
    })
    if (dayLogs.length === 0) return 'ok'
    const failCount = dayLogs.filter(p => !p.is_alive).length
    const pct = failCount / dayLogs.length
    if (pct > 0.2) return 'alert'
    if (pct > 0)   return 'warn'
    return 'ok'
  })
}

/* ── Pseudo-random fallback (when ping-logs unavailable) ─────── */
function rng(seed: number, i: number): number {
  return (((seed * 1103515245 + i * 12345) >>> 0) & 0x7fffffff) / 0x7fffffff
}
function camSeed(id: string | number): number {
  return String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}
function mockPings(id: string | number, status: UiStatus): PingPoint[] {
  const s = camSeed(id)
  return Array.from({ length: 48 }, (_, i) => {
    if (status === 'alert' && i >= 32) return null
    if (status === 'warn') { if (rng(s, i * 7) > 0.88) return null; return Math.round(20 + rng(s, i) * 80) }
    return Math.round(2 + rng(s, i) * 13)
  })
}
function mockUptime(id: string | number, status: UiStatus): UiStatus[] {
  const s = camSeed(id)
  return Array.from({ length: 30 }, (_, i) => {
    if (status === 'alert' && i === 29) return 'alert'
    const r = rng(s, i * 97)
    if (status === 'warn') return r > 0.55 ? 'warn' : 'ok'
    return r > 0.96 ? 'warn' : 'ok'
  })
}

/* ── Ping chart SVG ──────────────────────────────────────────── */
function PingChart({ pings }: { pings: PingPoint[] }) {
  const H = 100, W = 800, PAD = 8
  const valid = pings.filter((p): p is number => p !== null)
  const maxRtt = Math.max(...valid, 1)
  const pts = pings.map((rtt, i) => {
    const x = (i / (pings.length - 1)) * W
    const y = rtt === null ? H - PAD : PAD + (1 - rtt / maxRtt) * (H - PAD * 2)
    return [x, y] as [number, number]
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = line + ` L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ping-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ping-fill)" />
      <path d={line}  fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Format helpers ──────────────────────────────────────────── */
function fmtLastSeen(raw: string | null): string {
  if (!raw) return '—'
  const d = new Date(raw + (raw.endsWith('Z') ? '' : 'Z'))
  if (isNaN(d.getTime())) return raw
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 120)   return `${Math.round(diff)}s ago`
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return d.toLocaleDateString('th-TH')
}

/* ── Main component ──────────────────────────────────────────── */
export default function CameraDetailPage() {
  const { cameraId } = useParams<{ cameraId: string }>()
  const navigate = useNavigate()
  const numId = parseInt(cameraId ?? '', 10)
  const isNumeric = !isNaN(numId)

  const { data: cam, isLoading, isError, refetch, isFetching } = useQuery<CameraApi | null>({
    queryKey: ['camera', cameraId],
    queryFn: () => isNumeric ? getCameraById(numId) : Promise.resolve(null),
    enabled: isNumeric,
  })

  const { data: pingLogs = [], isError: pingError } = useQuery<PingLogApi[]>({
    queryKey: ['ping-logs', cameraId],
    queryFn: () => getPingLogs(numId),
    enabled: isNumeric,
    retry: false,
  })

  /* ── Derived data ── */
  const status = cam ? toUiStatus(cam.status) : 'ok'
  const hasPings = pingLogs.length > 0 && !pingError

  const pings      = hasPings ? pingLogsToChart(pingLogs)  : mockPings(cameraId ?? '', status)
  const uptimeDays = hasPings ? pingLogsToUptime(pingLogs) : mockUptime(cameraId ?? '', status)

  const valid   = pings.filter((p): p is number => p !== null)
  const minRtt  = valid.length ? Math.min(...valid) : 0
  const maxRtt  = valid.length ? Math.max(...valid) : 0
  const avgRtt  = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0
  const jitter  = valid.length > 1
    ? Math.round(valid.slice(1).reduce((s, v, i) => s + Math.abs(v - valid[i]), 0) / (valid.length - 1) * 10) / 10
    : 0
  const lossRaw = Math.round((pings.filter(p => p === null).length / pings.length) * 100)

  const okDays    = uptimeDays.filter(d => d === 'ok').length
  const uptimePct = ((okDays / 30) * 100).toFixed(1)
  const uptimeCls = lossRaw > 20 ? 'alert' : lossRaw > 5 ? 'warn' : ''

  /* ── Loading / error states ── */
  if (isLoading) return (
    <div style={{ padding: 48, color: 'var(--ink-3)', textAlign: 'center' }}>Loading camera…</div>
  )
  if (isError || (!isLoading && cam === null && isNumeric)) return (
    <div style={{ padding: 48, color: 'var(--alert)', textAlign: 'center' }}>
      Camera {cameraId} not found.
      <div style={{ marginTop: 8 }}>
        <button className="icon-btn" onClick={() => navigate('/dashboard/cameras')}>
          <ArrowLeft size={14} /> Back to list
        </button>
      </div>
    </div>
  )

  const displayName   = cam?.device_name ?? `Camera ${cameraId}`
  const displayId     = cam ? `#${cam.id}` : cameraId ?? ''
  const displayModel  = [cam?.brand, cam?.model].filter(Boolean).join(' ') || '—'
  const displayIp     = cam?.ip_address ?? '—'
  const displayMac    = cam?.mac_address ?? '—'
  const displayNvr    = cam?.NVR_ID ?? '—'
  const displaySite   = cam?.Site_ID ?? '—'
  const displayBldg   = cam?.Building_ID ?? '—'
  const displayFloor  = cam?.Floor_ID ?? '—'
  const displayLoc    = cam?.install_location ?? '—'
  const displayType   = cam?.camera_type ?? '—'
  const displayRes    = cam?.resolution ?? '—'
  const displayFw     = cam?.firmware_version ?? '—'
  const displaySeen   = fmtLastSeen(cam?.last_seen ?? null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button className="icon-btn" style={{ marginTop: 2, flex: 'none' }} onClick={() => navigate('/dashboard/cameras')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Video size={18} style={{ color: 'var(--ink-3)' }} />
              <h1 style={{ margin: 0 }}>{displayName}</h1>
              <span className={`cam-status-badge ${status}`}>
                <span className="sb-dot" />
                {STATUS_LABEL[status]}
              </span>
            </div>
            <p className="page-sub" style={{ marginTop: 0 }}>{displayId} · {displayModel}</p>
          </div>
        </div>
        <button
          className="icon-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', width: 'auto' }}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div className="canvas-wrap" style={{ flex: 1, minHeight: 0 }}>
        <div className="canvas" style={{ overflowY: 'auto' }}>
          <div className="cam-detail">

            {/* ── Left: info cards ── */}
            <div className="cam-info-col">

              <div className="cam-card">
                <div className="cam-card-title">Location</div>
                <div className="cam-row"><span className="cam-row-label">Site</span><span className="cam-row-val">{displaySite}</span></div>
                <div className="cam-row"><span className="cam-row-label">Building</span><span className="cam-row-val">{displayBldg}</span></div>
                <div className="cam-row"><span className="cam-row-label">Floor</span><span className="cam-row-val">{displayFloor}</span></div>
                <div className="cam-row"><span className="cam-row-label">Location</span><span className="cam-row-val">{displayLoc}</span></div>
              </div>

              <div className="cam-card">
                <div className="cam-card-title">Network</div>
                <div className="cam-row"><span className="cam-row-label">IP</span><span className="cam-row-val mono">{displayIp}</span></div>
                <div className="cam-row"><span className="cam-row-label">MAC</span><span className="cam-row-val mono">{displayMac}</span></div>
                <div className="cam-row"><span className="cam-row-label">NVR</span><span className="cam-row-val mono">{displayNvr}</span></div>
                {cam?.nvr_channel != null && (
                  <div className="cam-row"><span className="cam-row-label">NVR Channel</span><span className="cam-row-val mono">CH {cam.nvr_channel}</span></div>
                )}
                <div className="cam-row"><span className="cam-row-label">Last seen</span><span className="cam-row-val">{displaySeen}</span></div>
              </div>

              <div className="cam-card">
                <div className="cam-card-title">Device</div>
                <div className="cam-row"><span className="cam-row-label">Type</span><span className="cam-row-val" style={{ textTransform: 'capitalize' }}>{displayType}</span></div>
                {displayRes !== '—' && <div className="cam-row"><span className="cam-row-label">Resolution</span><span className="cam-row-val mono">{displayRes}</span></div>}
                {displayFw !== '—'  && <div className="cam-row"><span className="cam-row-label">Firmware</span><span className="cam-row-val mono">{displayFw}</span></div>}
                {cam?.serial_no && <div className="cam-row"><span className="cam-row-label">Serial</span><span className="cam-row-val mono">{cam.serial_no}</span></div>}
                {cam?.vlan_id && <div className="cam-row"><span className="cam-row-label">VLAN</span><span className="cam-row-val mono">{cam.vlan_id}</span></div>}
              </div>

            </div>

            {/* ── Right: ping chart + uptime ── */}
            <div className="cam-chart-col">

              <div className="ping-chart-wrap">
                <div className="ping-chart-title">
                  Ping History — Last 24 Hours
                  {pingError && <span style={{ fontSize: 10, color: 'var(--ink-4)', fontWeight: 400, marginLeft: 8 }}>(estimated — admin access required for live data)</span>}
                </div>
                <div className="ping-svg-wrap">
                  <PingChart pings={pings} />
                </div>
                <div className="ping-stats">
                  <div className="ping-stat">
                    <span className="ping-stat-label">Min</span>
                    <span className="ping-stat-val">
                      {status === 'alert' ? '—' : minRtt}
                      {status !== 'alert' && <span className="ping-stat-unit">ms</span>}
                    </span>
                  </div>
                  <div className="ping-stat">
                    <span className="ping-stat-label">Max</span>
                    <span className={`ping-stat-val${maxRtt > 100 ? ' alert' : ''}`}>
                      {status === 'alert' ? '—' : maxRtt}
                      {status !== 'alert' && <span className="ping-stat-unit">ms</span>}
                    </span>
                  </div>
                  <div className="ping-stat">
                    <span className="ping-stat-label">Average</span>
                    <span className={`ping-stat-val${avgRtt > 50 ? ' warn' : ''}`}>
                      {status === 'alert' ? '—' : avgRtt}
                      {status !== 'alert' && <span className="ping-stat-unit">ms</span>}
                    </span>
                  </div>
                  <div className="ping-stat">
                    <span className="ping-stat-label">Jitter</span>
                    <span className={`ping-stat-val${jitter > 10 ? ' warn' : ''}`}>
                      {status === 'alert' ? '—' : jitter}
                      {status !== 'alert' && <span className="ping-stat-unit">ms</span>}
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

              {cam?.notes && (
                <div className="cam-card">
                  <div className="cam-card-title">Notes</div>
                  <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>{cam.notes}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
