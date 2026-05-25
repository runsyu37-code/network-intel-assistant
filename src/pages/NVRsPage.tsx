import { useState } from 'react'
import { Search } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'

interface NVR {
  id: string; name: string; ip: string; status: Status
  site: string; building: string; rack: string
  model: string; channels: number; usedCh: number
  storage: string; storageUsed: number
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const STATUS_LABEL: Record<Status, string>  = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

const NVRS: NVR[] = [
  { id:'NVR-HQ-01', name:'NVR HQ 01',       ip:'192.168.1.200', status:'ok',   site:'HQ Bangkok',    building:'Building A', rack:'Rack A1', model:'Hikvision DS-7732NI', channels:32, usedCh:28, storage:'8 TB',  storageUsed:72 },
  { id:'NVR-HQ-02', name:'NVR HQ 02',       ip:'192.168.1.201', status:'ok',   site:'HQ Bangkok',    building:'Building A', rack:'Rack A1', model:'Hikvision DS-7732NI', channels:32, usedCh:16, storage:'8 TB',  storageUsed:41 },
  { id:'NVR-HQ-03', name:'NVR HQ 03',       ip:'192.168.1.202', status:'warn', site:'HQ Bangkok',    building:'Building B', rack:'Rack B1', model:'Dahua NVR5232-EI',   channels:32, usedCh:18, storage:'16 TB', storageUsed:85 },
  { id:'NVR-CM-01', name:'NVR Chiang Mai',   ip:'192.168.10.200',status:'ok',   site:'Chiang Mai DC', building:'Building A', rack:'Rack C1', model:'Hikvision DS-7616NI', channels:16, usedCh:10, storage:'4 TB',  storageUsed:53 },
  { id:'NVR-PK-01', name:'NVR Phuket',       ip:'192.168.20.200',status:'ok',   site:'Phuket Branch', building:'Building A', rack:'Rack P1', model:'Dahua NVR5216-EI',   channels:16, usedCh:8,  storage:'4 TB',  storageUsed:31 },
  { id:'NVR-KK-01', name:'NVR Khon Kaen',    ip:'192.168.30.200',status:'ok',   site:'Khon Kaen',     building:'Building A', rack:'Rack K1', model:'Axis S3008',          channels:8,  usedCh:5,  storage:'2 TB',  storageUsed:44 },
]

export default function NVRsPage() {
  const [q, setQ] = useState('')
  const filtered = NVRS.filter(n =>
    !q || [n.id, n.name, n.ip, n.site].some(v => v.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>NVRs</h1>
          <p className="page-sub">Network Video Recorders across all sites</p>
        </div>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="Search by name, IP, or site…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{NVRS.length} total</span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>NVR</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Model</th>
              <th>Channels</th>
              <th>Storage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="dl-empty">No NVRs found</td></tr>
            )}
            {filtered.map(n => (
              <tr key={n.id}>
                <td>
                  <span className="dl-status">
                    <span className="s-dot" style={{ background: STATUS_COLOR[n.status] }} />
                    {STATUS_LABEL[n.status]}
                  </span>
                </td>
                <td>
                  <div className="td-name">{n.name}</div>
                  <div className="td-sub">{n.id} · {n.rack}</div>
                </td>
                <td className="td-mono">{n.ip}</td>
                <td>
                  <div style={{ fontSize: 12, color: 'var(--ink)' }}>{n.site}</div>
                  <div className="td-sub">{n.building}</div>
                </td>
                <td className="td-mono" style={{ fontSize: 11 }}>{n.model}</td>
                <td>
                  <div style={{ fontSize: 12, color: 'var(--ink)' }}>{n.usedCh} / {n.channels} ch</div>
                  <div style={{ marginTop: 4, height: 4, background: 'var(--surface-2)', borderRadius: 999, width: 80, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${n.usedCh / n.channels * 100}%`, background: 'var(--accent)', borderRadius: 999 }} />
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 12, color: n.storageUsed > 80 ? 'var(--warn)' : 'var(--ink)' }}>{n.storage} · {n.storageUsed}%</div>
                  <div style={{ marginTop: 4, height: 4, background: 'var(--surface-2)', borderRadius: 999, width: 80, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${n.storageUsed}%`, background: n.storageUsed > 80 ? 'var(--warn)' : 'var(--accent)', borderRadius: 999 }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
