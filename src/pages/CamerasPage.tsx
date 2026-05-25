import { useState } from 'react'
import { Search } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'

interface Camera {
  id: string; name: string; ip: string; status: Status
  site: string; building: string; floor: string; type: 'indoor' | 'outdoor'
  model: string; lastSeen: string
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const STATUS_LABEL: Record<Status, string>  = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

const CAMERAS: Camera[] = [
  { id:'CAM-001', name:'Lobby Cam A',       ip:'192.168.1.101', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F1', type:'indoor',  model:'Hikvision DS-2CD2143G2', lastSeen:'just now'  },
  { id:'CAM-002', name:'Lobby Cam B',       ip:'192.168.1.102', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F1', type:'indoor',  model:'Hikvision DS-2CD2143G2', lastSeen:'just now'  },
  { id:'CAM-003', name:'Server Room 01',    ip:'192.168.1.103', status:'alert', site:'HQ Bangkok',    building:'Building A', floor:'F2', type:'indoor',  model:'Dahua IPC-HDW2831T',     lastSeen:'8m ago'    },
  { id:'CAM-004', name:'Server Room 02',    ip:'192.168.1.104', status:'alert', site:'HQ Bangkok',    building:'Building A', floor:'F2', type:'indoor',  model:'Dahua IPC-HDW2831T',     lastSeen:'8m ago'    },
  { id:'CAM-005', name:'Office 3A',         ip:'192.168.1.105', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Hikvision DS-2CD2143G2', lastSeen:'just now'  },
  { id:'CAM-006', name:'Office 3B',         ip:'192.168.1.106', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Hikvision DS-2CD2143G2', lastSeen:'just now'  },
  { id:'CAM-007', name:'Office 3C',         ip:'192.168.1.107', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Axis P3245-V',           lastSeen:'just now'  },
  { id:'CAM-008', name:'Break Room 3',      ip:'192.168.1.108', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Dahua IPC-HDW2831T',     lastSeen:'just now'  },
  { id:'CAM-009', name:'Meeting Room 3',    ip:'192.168.1.109', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F3', type:'indoor',  model:'Axis P3245-V',           lastSeen:'2m ago'    },
  { id:'CAM-010', name:'Meeting Room 5A',   ip:'192.168.1.110', status:'warn',  site:'HQ Bangkok',    building:'Building A', floor:'F5', type:'indoor',  model:'Hikvision DS-2CD2143G2', lastSeen:'5m ago'    },
  { id:'CAM-011', name:'Executive 6A',      ip:'192.168.1.111', status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F6', type:'indoor',  model:'Axis P3245-V',           lastSeen:'just now'  },
  { id:'CAM-012', name:'Main Gate Out',     ip:'192.168.1.112', status:'ok',    site:'HQ Bangkok',    building:'Building D', floor:'F1', type:'outdoor', model:'Hikvision DS-2CD2T47G2', lastSeen:'just now'  },
  { id:'CAM-013', name:'Parking Lot A',     ip:'192.168.1.113', status:'ok',    site:'HQ Bangkok',    building:'Building D', floor:'F1', type:'outdoor', model:'Hikvision DS-2CD2T47G2', lastSeen:'just now'  },
  { id:'CAM-014', name:'Annex Lobby',       ip:'192.168.1.114', status:'ok',    site:'HQ Bangkok',    building:'Building B', floor:'F1', type:'indoor',  model:'Dahua IPC-HDW2831T',     lastSeen:'just now'  },
  { id:'CAM-015', name:'Warehouse Gate',    ip:'192.168.10.10', status:'ok',    site:'Chiang Mai DC', building:'Building A', floor:'F1', type:'outdoor', model:'Hikvision DS-2CD2T47G2', lastSeen:'just now'  },
  { id:'CAM-016', name:'DC Floor 01',       ip:'192.168.10.11', status:'ok',    site:'Chiang Mai DC', building:'Building A', floor:'F1', type:'indoor',  model:'Dahua IPC-HDW2831T',     lastSeen:'just now'  },
]

export default function CamerasPage() {
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
              <th>Camera</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Type</th>
              <th>Model</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="dl-empty">No cameras found</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <span className="dl-status">
                    <span className="s-dot" style={{ background: STATUS_COLOR[c.status] }} />
                    {STATUS_LABEL[c.status]}
                  </span>
                </td>
                <td>
                  <div className="td-name">{c.name}</div>
                  <div className="td-sub">{c.id}</div>
                </td>
                <td className="td-mono">{c.ip}</td>
                <td>
                  <div style={{ fontSize: 12, color: 'var(--ink)' }}>{c.site}</div>
                  <div className="td-sub">{c.building} · {c.floor}</div>
                </td>
                <td><span className={`dl-badge ${c.status === 'ok' ? '' : c.status}`}>{c.type}</span></td>
                <td className="td-mono" style={{ fontSize: 11 }}>{c.model}</td>
                <td className="td-mono" style={{ color: c.status === 'alert' ? 'var(--alert)' : undefined }}>{c.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
