import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'

interface Camera {
  id: string; name: string; ip: string; mac: string; status: Status
  site: string; building: string; floor: string; type: 'indoor' | 'outdoor'
  model: string; uptime: string
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const STATUS_LABEL: Record<Status, string>  = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

const CAMERAS: Camera[] = [
  { id:'CAM-001', name:'Lobby Cam A',       ip:'192.168.1.101', mac:'A4:C3:F0:11:22:33', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F1', type:'indoor',  model:'Hikvision DS-2CD2143G2', uptime:'14d 2h'  },
  { id:'CAM-002', name:'Lobby Cam B',       ip:'192.168.1.102', mac:'A4:C3:F0:11:22:34', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F1', type:'indoor',  model:'Hikvision DS-2CD2143G2', uptime:'14d 2h'  },
  { id:'CAM-003', name:'Server Room 01',    ip:'192.168.1.103', mac:'A4:C3:F0:22:33:01', status:'alert', site:'HQ Bangkok',    building:'Building A', floor:'F2', type:'indoor',  model:'Dahua IPC-HDW2831T',     uptime:'—'       },
  { id:'CAM-004', name:'Server Room 02',    ip:'192.168.1.104', mac:'A4:C3:F0:22:33:02', status:'alert', site:'HQ Bangkok',    building:'Building A', floor:'F2', type:'indoor',  model:'Dahua IPC-HDW2831T',     uptime:'—'       },
  { id:'CAM-005', name:'Office 3A',         ip:'192.168.1.105', mac:'A4:C3:F0:33:44:01', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Hikvision DS-2CD2143G2', uptime:'9d 14h'  },
  { id:'CAM-006', name:'Office 3B',         ip:'192.168.1.106', mac:'A4:C3:F0:33:44:02', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Hikvision DS-2CD2143G2', uptime:'9d 14h'  },
  { id:'CAM-007', name:'Office 3C',         ip:'192.168.1.107', mac:'B8:27:EB:55:66:01', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Axis P3245-V',           uptime:'22d 8h'  },
  { id:'CAM-008', name:'Break Room 3',      ip:'192.168.1.108', mac:'A4:C3:F0:33:44:08', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Dahua IPC-HDW2831T',     uptime:'9d 14h'  },
  { id:'CAM-009', name:'Meeting Room 3',    ip:'192.168.1.109', mac:'B8:27:EB:55:66:09', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Axis P3245-V',           uptime:'22d 7h'  },
  { id:'CAM-010', name:'Meeting Room 5A',   ip:'192.168.1.110', mac:'A4:C3:F0:55:66:10', status:'warn',  site:'HQ Bangkok',    building:'Building A', floor:'F5', type:'indoor',  model:'Hikvision DS-2CD2143G2', uptime:'3d 1h'   },
  { id:'CAM-011', name:'Executive 6A',      ip:'192.168.1.111', mac:'B8:27:EB:66:77:11', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F6', type:'indoor',  model:'Axis P3245-V',           uptime:'57d 12h' },
  { id:'CAM-012', name:'Main Gate Out',     ip:'192.168.1.112', mac:'A4:C3:F0:77:88:12', status:'ok',    site:'HQ Bangkok',    building:'Building D', floor:'F1', type:'outdoor', model:'Hikvision DS-2CD2T47G2', uptime:'42d 18h' },
  { id:'CAM-013', name:'Parking Lot A',     ip:'192.168.1.113', mac:'A4:C3:F0:77:88:13', status:'ok',    site:'HQ Bangkok',    building:'Building D', floor:'F1', type:'outdoor', model:'Hikvision DS-2CD2T47G2', uptime:'42d 18h' },
  { id:'CAM-014', name:'Annex Lobby',       ip:'192.168.1.114', mac:'A4:C3:F0:88:99:14', status:'ok',    site:'HQ Bangkok',    building:'Building B', floor:'F1', type:'indoor',  model:'Dahua IPC-HDW2831T',     uptime:'31d 5h'  },
  { id:'CAM-015', name:'Warehouse Gate',    ip:'192.168.10.10', mac:'A4:C3:F0:10:20:15', status:'ok',    site:'Chiang Mai DC', building:'Building A', floor:'F1', type:'outdoor', model:'Hikvision DS-2CD2T47G2', uptime:'18d 22h' },
  { id:'CAM-016', name:'DC Floor 01',       ip:'192.168.10.11', mac:'A4:C3:F0:10:20:16', status:'ok',    site:'Chiang Mai DC', building:'Building A', floor:'F1', type:'indoor',  model:'Dahua IPC-HDW2831T',     uptime:'18d 22h' },
]

export default function CamerasPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const filtered = CAMERAS.filter(c =>
    !q || [c.id, c.name, c.ip, c.site, c.building].some(v => v.toLowerCase().includes(q.toLowerCase()))
  )
  const online  = CAMERAS.filter(c => c.status === 'ok').length
  const offline = CAMERAS.filter(c => c.status === 'alert').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>Cameras</h1>
          <p className="page-sub">All CCTV cameras across every site and building</p>
        </div>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="Search by name, IP, or site…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--ok)' }} />{online} online</span>
        <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--alert)' }} />{offline} offline</span>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{CAMERAS.length} total</span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th className="td-status">Status</th>
              <th>Device Name</th>
              <th>IP Address</th>
              <th>Type</th>
              <th>MAC Address</th>
              <th>Uptime</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="dl-empty">No cameras found</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/cameras/${c.id}`)}>
                <td>
                  <span className="dl-status">
                    <span className="s-dot" style={{ background: STATUS_COLOR[c.status] }} />
                    {STATUS_LABEL[c.status]}
                  </span>
                </td>
                <td>
                  <div className="td-name">{c.name}</div>
                  <div className="td-sub">{c.site} · {c.building} · {c.floor}</div>
                </td>
                <td className="td-mono">{c.ip}</td>
                <td><span className={`dl-badge${c.status !== 'ok' ? ' ' + c.status : ''}`}>{c.type}</span></td>
                <td className="td-mono">{c.mac}</td>
                <td className="td-mono" style={{ color: c.status === 'alert' ? 'var(--alert)' : undefined }}>{c.uptime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
