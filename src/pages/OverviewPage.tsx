import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, HardDrive, PlugZap, AlertTriangle, RefreshCw } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardSummary, getAlertLogs, getDeviceStatus } from '../api/hierarchy'
import type { AlertLogApi, DashboardSummaryDto } from '../api/types'

const MOCK_STATS = {
  cameras:  { total: 128, offline: 3, warning: 2 },
  nvrs:     { total: 8,   warning: 0 },
  switches: { total: 12,  warning: 1 },
  alerts:   { active: 4,  delta: 2 },
}

const MOCK_ALERTS = [
  { id: 1, sev: 'critical', device: 'NVR-03',     msg: 'HDD2 storage at 91%',       time: '14 นาทีที่แล้ว'   },
  { id: 2, sev: 'warning',  device: 'CAM-A3-07',  msg: 'ไม่ได้รับสัญญาณ 5 นาที',  time: '32 นาทีที่แล้ว'   },
  { id: 3, sev: 'info',     device: 'SW-CORE-01', msg: 'Port 14 reconnected',        time: '1 ชั่วโมงที่แล้ว' },
  { id: 4, sev: 'critical', device: 'CAM-B2-03',  msg: 'Connection lost',            time: '1 ชั่วโมงที่แล้ว' },
]

const MOCK_OFFLINE = [
  { id: 'nvr-05',   name: 'NVR-05',    site: 'สาขาบางนา',    dur: '5h 12m', status: 'offline'  },
  { id: 'cam-a307', name: 'CAM-A3-07', site: 'สำนักงานใหญ่', dur: '2h 44m', status: 'warning'  },
  { id: 'cam-b203', name: 'CAM-B2-03', site: 'สำนักงานใหญ่', dur: '1h 58m', status: 'offline'  },
]

const REFRESH_INTERVAL = 30

function alertSev(type: string | null): 'critical' | 'warning' | 'info' {
  if (!type) return 'info'
  const t = type.toLowerCase()
  if (t.includes('critical') || t.includes('offline') || t.includes('lost') || t.includes('fail') || t.includes('hdd')) return 'critical'
  if (t.includes('warn') || t.includes('high') || t.includes('latency')) return 'warning'
  return 'info'
}

function timeAgo(ts: string | null): string {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts + 'Z').getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'เมื่อสักครู่'
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`
  return `${Math.floor(h / 24)} วันที่แล้ว`
}

function sumField(data: DashboardSummaryDto[], key: keyof DashboardSummaryDto): number {
  return data.reduce((s, d) => s + ((d[key] as number) || 0), 0)
}

function mapAlertRow(a: AlertLogApi) {
  return {
    id: a.id,
    sev: alertSev(a.alert_type),
    device: a.device_name ?? a.device_id ?? '—',
    msg: a.message,
    time: timeAgo(a.alerted_at),
  }
}

export default function OverviewPage() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [lastUpdate, setLastUpdate] = useState(0)

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => getDashboardSummary(),
    refetchInterval: 30_000,
  })
  const { data: alertData } = useQuery({
    queryKey: ['alert-logs-dash'],
    queryFn: () => getAlertLogs({ limit: 8 }),
    refetchInterval: 30_000,
  })
  const { data: statusData } = useQuery({
    queryKey: ['device-status'],
    queryFn: () => getDeviceStatus(),
    refetchInterval: 30_000,
  })

  const stats = useMemo(() => {
    if (!summaryData?.length) return MOCK_STATS
    const activeAlerts = alertData?.filter(a => !a.resolved_at).length ?? MOCK_STATS.alerts.active
    return {
      cameras:  { total: sumField(summaryData, 'totalCameras'),  offline: sumField(summaryData, 'camerasOffline'), warning: sumField(summaryData, 'camerasWarning') },
      nvrs:     { total: sumField(summaryData, 'totalNvrs'),     warning: sumField(summaryData, 'nvrsOffline')     },
      switches: { total: sumField(summaryData, 'totalSwitches'), warning: sumField(summaryData, 'switchesOffline') },
      alerts:   { active: activeAlerts, delta: 0 },
    }
  }, [summaryData, alertData])

  const displayAlerts = useMemo(() =>
    alertData?.length ? alertData.slice(0, 8).map(mapAlertRow) : MOCK_ALERTS
  , [alertData])

  const displayOffline = useMemo(() => {
    if (!statusData?.length) return MOCK_OFFLINE
    return statusData
      .filter(d => d.status !== 'online')
      .slice(0, 5)
      .map(d => ({ id: d.id, name: d.name, site: d.siteId, dur: timeAgo(d.lastSeen), status: d.status }))
  }, [statusData])

  const displaySites = useMemo(() => {
    if (!summaryData?.length) return null
    return summaryData.map(s => ({
      id: s.siteId,
      name: s.siteName || s.siteCode,
      total: s.totalCameras,
      online: s.camerasOnline,
      offline: s.camerasOffline,
      alerts: s.nvrsOffline + s.switchesOffline,
      status: (s.camerasOffline > 0 || s.nvrsOffline > 0) ? 'warning' : 'ok',
    }))
  }, [summaryData])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { setLastUpdate(u => u + REFRESH_INTERVAL); return REFRESH_INTERVAL }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    queryClient.invalidateQueries({ queryKey: ['alert-logs-dash'] })
    queryClient.invalidateQueries({ queryKey: ['device-status'] })
    setCountdown(REFRESH_INTERVAL)
    setLastUpdate(0)
  }

  function formatLastUpdate() {
    if (lastUpdate === 0) return 'เมื่อสักครู่'
    const m = Math.floor(lastUpdate / 60)
    const s = lastUpdate % 60
    return m === 0 ? `${s}วิที่แล้ว` : `${m}นาทีที่แล้ว`
  }

  const FALLBACK_SITES = [
    { id: 'hq', name: 'สำนักงานใหญ่',  total: 48, online: 46, offline: 2, alerts: 3, status: 'warning' },
    { id: 'sl', name: 'สาขาสีลม',      total: 36, online: 35, offline: 0, alerts: 1, status: 'warning' },
    { id: 'lp', name: 'สาขาลาดพร้าว', total: 44, online: 43, offline: 1, alerts: 0, status: 'warning' },
    { id: 'bn', name: 'สาขาบางนา',     total: 20, online: 20, offline: 0, alerts: 0, status: 'ok'      },
  ]

  const sitesRows = displaySites ?? FALLBACK_SITES

  return (
    <div className="db-page">
      <div className="db-header">
        <div>
          <h1>Dashboard</h1>
          <p className="db-sub">ภาพรวมระบบ</p>
        </div>
        <div className="db-refresh">
          อัปเดต {formatLastUpdate()} · รีเฟรชใน {countdown}s
          <button className="tbl-icon-btn" onClick={handleRefresh} title="Refresh now">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="db-grid4">
        <div className="db-stat-card" onClick={() => navigate('/dashboard/cameras')} role="link" tabIndex={0}>
          <div className="db-stat-hd">
            <Camera size={20} className="db-stat-icon" />
            <span className="db-stat-label">Cameras</span>
          </div>
          <div className="db-stat-val">{stats.cameras.total}</div>
          <div className={`db-stat-trend ${stats.cameras.offline > 0 ? 'db-trend-alert' : stats.cameras.warning > 0 ? 'db-trend-warn' : 'db-trend-ok'}`}>
            {stats.cameras.offline > 0
              ? `${stats.cameras.offline} offline${stats.cameras.warning > 0 ? ` · ${stats.cameras.warning} warning` : ''}`
              : stats.cameras.warning > 0 ? `${stats.cameras.warning} warning` : 'All online'}
          </div>
        </div>

        <div className="db-stat-card" onClick={() => navigate('/dashboard/nvrs')} role="link" tabIndex={0}>
          <div className="db-stat-hd">
            <HardDrive size={20} className="db-stat-icon" />
            <span className="db-stat-label">NVRs</span>
          </div>
          <div className="db-stat-val">{stats.nvrs.total}</div>
          <div className={`db-stat-trend ${stats.nvrs.warning > 0 ? 'db-trend-warn' : 'db-trend-ok'}`}>
            {stats.nvrs.warning > 0 ? `${stats.nvrs.warning} offline` : 'All healthy'}
          </div>
        </div>

        <div className="db-stat-card" onClick={() => navigate('/dashboard/switches')} role="link" tabIndex={0}>
          <div className="db-stat-hd">
            <PlugZap size={20} className="db-stat-icon" />
            <span className="db-stat-label">Switches</span>
          </div>
          <div className="db-stat-val">{stats.switches.total}</div>
          <div className={`db-stat-trend ${stats.switches.warning > 0 ? 'db-trend-warn' : 'db-trend-ok'}`}>
            {stats.switches.warning > 0 ? `${stats.switches.warning} offline` : 'All healthy'}
          </div>
        </div>

        <div className="db-stat-card alert" role="link" tabIndex={0}>
          <div className="db-stat-hd">
            <AlertTriangle size={20} className="db-stat-icon" style={{ color: 'var(--alert)' }} />
            <span className="db-stat-label">Active Alerts</span>
          </div>
          <div className="db-stat-val">{stats.alerts.active}</div>
          <div className="db-stat-trend db-trend-alert">
            {stats.alerts.active > 0 ? 'ต้องการตรวจสอบ' : 'ไม่มีแจ้งเตือน'}
          </div>
        </div>
      </div>

      <div className="db-grid2">
        <div className="db-card">
          <div className="db-card-hd">
            <h2 className="db-card-title">Recent Alerts</h2>
          </div>
          <table className="db-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Device</th>
                <th>Message</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {displayAlerts.map(a => (
                <tr key={a.id}>
                  <td><span className={`db-badge ${a.sev}`}>{a.sev}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{a.device}</td>
                  <td>{a.msg}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ink-3)' }}>{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="db-card">
          <div className="db-card-hd">
            <h2 className="db-card-title">
              อุปกรณ์ที่มีปัญหา
              <span className="db-badge-count">{displayOffline.length}</span>
            </h2>
          </div>
          <div>
            {displayOffline.length === 0
              ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ok)', fontSize: 13 }}>ทุกอุปกรณ์ออนไลน์</div>
              : displayOffline.map(d => (
                <div key={d.id} className="db-dev-row">
                  <span className={`db-status-dot ${d.status === 'warning' ? 'yellow' : 'red'}`} />
                  <div className="db-dev-info">
                    <div className="db-dev-name">{d.name}</div>
                    <div className="db-dev-site">{d.site}</div>
                  </div>
                  <span className="db-dev-dur">{d.dur}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="db-card">
        <div className="db-card-hd">
          <h2 className="db-card-title">สถานะแต่ละสาขา</h2>
        </div>
        <table className="db-table">
          <thead>
            <tr>
              <th>สาขา</th>
              <th>กล้องทั้งหมด</th>
              <th>ออนไลน์</th>
              <th>ออฟไลน์</th>
              <th>แจ้งเตือน</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {sitesRows.map(s => (
              <tr key={s.id}>
                <td>
                  <span className="db-site-link" onClick={() => navigate(`/dashboard/sites/${s.id}`)} style={{ cursor: 'pointer' }}>
                    {s.name}
                  </span>
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{s.total}</td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{s.online}</td>
                <td style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                  color: s.offline > 0 ? 'var(--alert)' : undefined,
                  fontWeight: s.offline > 0 ? 700 : undefined,
                }}>
                  {s.offline}
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{s.alerts}</td>
                <td>
                  <span className={`db-badge ${s.status === 'ok' ? 'ok' : 'warning'}`}>
                    {s.status === 'ok' ? 'ปกติ' : 'มีปัญหา'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
