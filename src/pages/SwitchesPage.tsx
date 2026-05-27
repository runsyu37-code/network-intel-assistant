import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw } from 'lucide-react'
import { getSwitches } from '../api/switches'

const STATUS_COLOR: Record<string, string> = {
  online:  'var(--ok)',
  warning: 'var(--warn)',
  offline: 'var(--alert)',
}
const STATUS_LABEL: Record<string, string> = {
  online:  'Online',
  warning: 'Warning',
  offline: 'Offline',
}

function statusOf(s: string | null): string {
  const v = (s ?? '').toLowerCase()
  if (v === 'online')  return 'online'
  if (v === 'warning') return 'warning'
  return 'offline'
}

export default function SwitchesPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const { data: switches = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['poe-switches'],
    queryFn: () => getSwitches(),
    refetchInterval: 30_000,
  })

  const filtered = switches.filter(s => {
    if (!q) return true
    const search = q.toLowerCase()
    return [s.SW_ID, s.device_name, s.ip_address ?? '', s.Site_ID].some(v => v.toLowerCase().includes(search))
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>PoE Switches</h1>
          <p className="page-sub">Power over Ethernet switches managing camera power delivery</p>
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

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="Search by name, IP, or site…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{switches.length} total</span>
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
              <th>PoE Budget</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="dl-empty" style={{ color: 'var(--ink-3)' }}>Loading switches…</td></tr>
            )}
            {isError && !isLoading && (
              <tr><td colSpan={7} className="dl-empty" style={{ color: 'var(--alert)' }}>Failed to load switches — check API connection</td></tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr><td colSpan={7} className="dl-empty">No switches found</td></tr>
            )}
            {filtered.map(s => {
              const st = statusOf(s.status)
              const budget = s.poe_budget_w ?? 0
              return (
                <tr key={s.SW_ID} style={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/switches/${s.SW_ID}`)}>
                  <td>
                    <span className="dl-status">
                      <span className="s-dot" style={{ background: STATUS_COLOR[st] }} />
                      {STATUS_LABEL[st]}
                    </span>
                  </td>
                  <td>
                    <div className="td-name">{s.device_name}</div>
                    <div className="td-sub">{s.SW_ID} · {s.Rack_ID || '—'} · {s.Floor_ID || '—'}</div>
                  </td>
                  <td className="td-mono">{s.ip_address ?? '—'}</td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--ink)' }}>{s.Site_ID}</div>
                    <div className="td-sub">{s.Building_ID}</div>
                  </td>
                  <td className="td-mono" style={{ fontSize: 11 }}>
                    {[s.brand, s.model].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: st === 'offline' ? 'var(--alert)' : 'var(--ink)' }}>
                      {s.total_ports ?? '—'} ports
                    </div>
                    <div className="td-sub">{s.poe_ports != null ? `${s.poe_ports} PoE` : ''}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--ink)' }}>
                      {budget > 0 ? `${budget} W` : '—'}
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
