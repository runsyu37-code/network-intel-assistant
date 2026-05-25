import { useState } from 'react'
import { Search } from 'lucide-react'

type Status = 'ok' | 'warn' | 'alert'

interface Switch {
  id: string; name: string; ip: string; status: Status
  site: string; building: string; rack: string; floor: string
  model: string; ports: number; activePorts: number; powerW: number; budgetW: number
}

const STATUS_COLOR: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const STATUS_LABEL: Record<Status, string>  = { ok: 'Online', warn: 'Warning', alert: 'Offline' }

const SWITCHES: Switch[] = [
  { id:'SW-HQ-CORE',    name:'Core Switch HQ',     ip:'192.168.1.2',   status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F2', rack:'Rack A1', model:'Cisco SG350X-24P',  ports:24, activePorts:22, powerW:185, budgetW:370 },
  { id:'SW-HQ-FLOOR3',  name:'Floor 3 Switch',     ip:'192.168.1.3',   status:'alert', site:'HQ Bangkok',    building:'Building A', floor:'F3', rack:'Rack A1', model:'Cisco CBS350-24P',  ports:24, activePorts:0,  powerW:0,   budgetW:370 },
  { id:'SW-HQ-FLOOR2',  name:'Floor 2 Switch',     ip:'192.168.1.4',   status:'warn',  site:'HQ Bangkok',    building:'Building A', floor:'F2', rack:'Rack A1', model:'Cisco CBS350-24P',  ports:24, activePorts:20, powerW:310, budgetW:370 },
  { id:'SW-MINI-01',    name:'Mini Switch 01',      ip:'192.168.1.5',   status:'ok',    site:'HQ Bangkok',    building:'Building A', floor:'F2', rack:'Rack A1', model:'TP-Link TL-SG1016PE',ports:16,activePorts:12, powerW:95,  budgetW:150 },
  { id:'SW-MINI-02',    name:'Mini Switch 02',      ip:'192.168.1.6',   status:'warn',  site:'HQ Bangkok',    building:'Building A', floor:'F2', rack:'Rack A1', model:'TP-Link TL-SG1016PE',ports:16,activePorts:14, powerW:128, budgetW:150 },
  { id:'SW-CM-01',      name:'Chiang Mai Core',     ip:'192.168.10.2',  status:'ok',    site:'Chiang Mai DC', building:'Building A', floor:'F1', rack:'Rack C1', model:'Cisco SG350-28P',   ports:28, activePorts:14, powerW:120, budgetW:375 },
  { id:'SW-PK-01',      name:'Phuket Switch',       ip:'192.168.20.2',  status:'ok',    site:'Phuket Branch', building:'Building A', floor:'F1', rack:'Rack P1', model:'Cisco CBS350-16P',  ports:16, activePorts:8,  powerW:74,  budgetW:240 },
  { id:'SW-KK-01',      name:'Khon Kaen Switch',    ip:'192.168.30.2',  status:'ok',    site:'Khon Kaen',     building:'Building A', floor:'F1', rack:'Rack K1', model:'TP-Link TL-SG1016PE',ports:16,activePorts:5,  powerW:42,  budgetW:150 },
]

export default function SwitchesPage() {
  const [q, setQ] = useState('')
  const filtered = SWITCHES.filter(s =>
    !q || [s.id, s.name, s.ip, s.site].some(v => v.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>PoE Switches</h1>
          <p className="page-sub">Power over Ethernet switches managing camera power delivery</p>
        </div>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="Search by name, IP, or site…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{SWITCHES.length} total</span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Switch</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Model</th>
              <th>Ports</th>
              <th>PoE Power</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="dl-empty">No switches found</td></tr>
            )}
            {filtered.map(s => {
              const powerPct = s.budgetW > 0 ? Math.round(s.powerW / s.budgetW * 100) : 0
              const powerHigh = powerPct > 75
              return (
                <tr key={s.id}>
                  <td>
                    <span className="dl-status">
                      <span className="s-dot" style={{ background: STATUS_COLOR[s.status] }} />
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td>
                    <div className="td-name">{s.name}</div>
                    <div className="td-sub">{s.id} · {s.rack} · {s.floor}</div>
                  </td>
                  <td className="td-mono">{s.ip}</td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--ink)' }}>{s.site}</div>
                    <div className="td-sub">{s.building}</div>
                  </td>
                  <td className="td-mono" style={{ fontSize: 11 }}>{s.model}</td>
                  <td>
                    <div style={{ fontSize: 12, color: s.status === 'alert' ? 'var(--alert)' : 'var(--ink)' }}>
                      {s.activePorts} / {s.ports} active
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: powerHigh ? 'var(--warn)' : 'var(--ink)' }}>
                      {s.powerW} W · {powerPct}%
                    </div>
                    <div style={{ marginTop: 4, height: 4, background: 'var(--surface-2)', borderRadius: 999, width: 80, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${powerPct}%`, background: powerHigh ? 'var(--warn)' : 'var(--accent)', borderRadius: 999 }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
