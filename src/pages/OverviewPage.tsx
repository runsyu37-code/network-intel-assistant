import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, HardDrive, PlugZap, AlertTriangle, RefreshCw } from 'lucide-react'

const MOCK_STATS = {
  cameras:  { total: 128, offline: 3 },
  nvrs:     { total: 8,   warning: 0 },
  switches: { total: 12,  warning: 1 },
  alerts:   { active: 4,  delta: 2 },
}

const MOCK_ALERTS = [
  { id: 1, sev: 'critical', device: 'NVR-03',      msg: 'HDD2 storage at 91%',          time: '14 นาทีที่แล้ว' },
  { id: 2, sev: 'warning',  device: 'CAM-A3-07',   msg: 'ไม่ได้รับสัญญาณ 5 นาที',     time: '32 นาทีที่แล้ว' },
  { id: 3, sev: 'info',     device: 'SW-CORE-01',  msg: 'Port 14 reconnected',           time: '1 ชั่วโมงที่แล้ว' },
  { id: 4, sev: 'critical', device: 'CAM-B2-03',   msg: 'Connection lost',               time: '1 ชั่วโมงที่แล้ว' },
  { id: 5, sev: 'warning',  device: 'SW-FLOOR-B2', msg: 'High packet loss detected',     time: '2 ชั่วโมงที่แล้ว' },
  { id: 6, sev: 'info',     device: 'CAM-C1-01',   msg: 'Camera back online',            time: '3 ชั่วโมงที่แล้ว' },
  { id: 7, sev: 'warning',  device: 'NVR-05',      msg: 'Offline — no ping response',    time: '5 ชั่วโมงที่แล้ว' },
  { id: 8, sev: 'info',     device: 'SW-FLOOR-A1', msg: 'Firmware update available',     time: '6 ชั่วโมงที่แล้ว' },
]

const MOCK_OFFLINE = [
  { id: 'nvr-05',   name: 'NVR-05',       site: 'สาขาบางนา',      dur: '5h 12m' },
  { id: 'cam-a307', name: 'CAM-A3-07',    site: 'สำนักงานใหญ่',   dur: '2h 44m' },
  { id: 'cam-b203', name: 'CAM-B2-03',    site: 'สำนักงานใหญ่',   dur: '1h 58m' },
  { id: 'cam-d109', name: 'CAM-D1-09',    site: 'สาขาลาดพร้าว',   dur: '47m' },
  { id: 'sw-b2',    name: 'SW-FLOOR-B2',  site: 'สาขาสีลม',       dur: '12m' },
]

const MOCK_SITES = [
  { id: 'hq', name: 'สำนักงานใหญ่', total: 48, online: 46, offline: 2, alerts: 3, status: 'warning' },
  { id: 'sl', name: 'สาขาสีลม',     total: 36, online: 35, offline: 0, alerts: 1, status: 'warning' },
  { id: 'lp', name: 'สาขาลาดพร้าว', total: 44, online: 43, offline: 1, alerts: 0, status: 'warning' },
  { id: 'bn', name: 'สาขาบางนา',    total: 20, online: 20, offline: 0, alerts: 0, status: 'ok' },
  { id: 'wh', name: 'คลังสินค้า',   total: 16, online: 16, offline: 0, alerts: 0, status: 'ok' },
] as const

const REFRESH_INTERVAL = 30

export default function OverviewPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [lastUpdate, setLastUpdate] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setLastUpdate(u => u + REFRESH_INTERVAL)
          return REFRESH_INTERVAL
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function formatLastUpdate() {
    if (lastUpdate === 0) return 'เมื่อสักครู่'
    const m = Math.floor(lastUpdate / 60)
    const s = lastUpdate % 60
    if (m === 0) return `${s}วิที่แล้ว`
    return `${m}นาทีที่แล้ว`
  }

  function handleRefresh() {
    setCountdown(REFRESH_INTERVAL)
    setLastUpdate(0)
  }

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
          <div className="db-stat-val">{MOCK_STATS.cameras.total}</div>
          <div className={`db-stat-trend ${MOCK_STATS.cameras.offline > 0 ? 'db-trend-alert' : 'db-trend-ok'}`}>
            {MOCK_STATS.cameras.offline > 0 ? `${MOCK_STATS.cameras.offline} offline` : 'All online'}
          </div>
        </div>

        <div className="db-stat-card" onClick={() => navigate('/dashboard/nvrs')} role="link" tabIndex={0}>
          <div className="db-stat-hd">
            <HardDrive size={20} className="db-stat-icon" />
            <span className="db-stat-label">NVRs</span>
          </div>
          <div className="db-stat-val">{MOCK_STATS.nvrs.total}</div>
          <div className={`db-stat-trend ${MOCK_STATS.nvrs.warning > 0 ? 'db-trend-warn' : 'db-trend-ok'}`}>
            {MOCK_STATS.nvrs.warning > 0 ? `${MOCK_STATS.nvrs.warning} warning` : 'All healthy'}
          </div>
        </div>

        <div className="db-stat-card" onClick={() => navigate('/dashboard/switches')} role="link" tabIndex={0}>
          <div className="db-stat-hd">
            <PlugZap size={20} className="db-stat-icon" />
            <span className="db-stat-label">Switches</span>
          </div>
          <div className="db-stat-val">{MOCK_STATS.switches.total}</div>
          <div className={`db-stat-trend ${MOCK_STATS.switches.warning > 0 ? 'db-trend-warn' : 'db-trend-ok'}`}>
            {MOCK_STATS.switches.warning > 0 ? `${MOCK_STATS.switches.warning} warning` : 'All healthy'}
          </div>
        </div>

        <div className="db-stat-card alert" role="link" tabIndex={0}>
          <div className="db-stat-hd">
            <AlertTriangle size={20} className="db-stat-icon" style={{ color: 'var(--alert)' }} />
            <span className="db-stat-label">Active Alerts</span>
          </div>
          <div className="db-stat-val">{MOCK_STATS.alerts.active}</div>
          <div className="db-stat-trend db-trend-alert">
            ↑ {MOCK_STATS.alerts.delta} from yesterday
          </div>
        </div>
      </div>

      <div className="db-grid2">
        <div className="db-card">
          <div className="db-card-hd">
            <h2 className="db-card-title">Recent Alerts</h2>
            <span className="db-link-all">ดูทั้งหมด →</span>
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
              {MOCK_ALERTS.map(a => (
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
              อุปกรณ์ที่ออฟไลน์
              <span className="db-badge-count">{MOCK_OFFLINE.length}</span>
            </h2>
          </div>
          <div>
            {MOCK_OFFLINE.map(d => (
              <div key={d.id} className="db-dev-row">
                <span className="db-status-dot red" />
                <div className="db-dev-info">
                  <div className="db-dev-name">{d.name}</div>
                  <div className="db-dev-site">{d.site}</div>
                </div>
                <span className="db-dev-dur">{d.dur}</span>
              </div>
            ))}
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
            {MOCK_SITES.map(s => (
              <tr key={s.id}>
                <td>
                  <span
                    className="db-site-link"
                    onClick={() => navigate(`/dashboard/sites/${s.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
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
