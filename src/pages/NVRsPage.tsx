import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw } from 'lucide-react'
import { getNvrs } from '../api/nvrs'

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

export default function NVRsPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const { data: nvrs = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['nvrs'],
    queryFn: () => getNvrs(),
    refetchInterval: 30_000,
  })

  const filtered = nvrs.filter(n => {
    if (!q) return true
    const s = q.toLowerCase()
    return [n.NVR_ID, n.device_name, n.ip_cctv ?? '', n.Site_ID].some(v => v.toLowerCase().includes(s))
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>NVRs</h1>
          <p className="page-sub">Network Video Recorders across all sites</p>
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
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{nvrs.length} total</span>
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
            {isLoading && (
              <tr><td colSpan={7} className="dl-empty" style={{ color: 'var(--ink-3)' }}>Loading NVRs…</td></tr>
            )}
            {isError && !isLoading && (
              <tr><td colSpan={7} className="dl-empty" style={{ color: 'var(--alert)' }}>Failed to load NVRs — check API connection</td></tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr><td colSpan={7} className="dl-empty">No NVRs found</td></tr>
            )}
            {filtered.map(n => {
              const st = statusOf(n.status)
              const usedCh = n.active_channels ?? 0
              const totalCh = n.total_channels ?? 0
              const chPct = totalCh > 0 ? (usedCh / totalCh) * 100 : 0
              const hddPct = n.hdd_used_pct ?? 0
              return (
                <tr key={n.NVR_ID} style={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/nvrs/${n.NVR_ID}`)}>
                  <td>
                    <span className="dl-status">
                      <span className="s-dot" style={{ background: STATUS_COLOR[st] }} />
                      {STATUS_LABEL[st]}
                    </span>
                  </td>
                  <td>
                    <div className="td-name">{n.device_name}</div>
                    <div className="td-sub">{n.NVR_ID} · {n.Rack_ID || '—'}</div>
                  </td>
                  <td className="td-mono">{n.ip_cctv ?? n.ip_internet ?? '—'}</td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--ink)' }}>{n.Site_ID}</div>
                    <div className="td-sub">{n.Building_ID}</div>
                  </td>
                  <td className="td-mono" style={{ fontSize: 11 }}>{[n.brand, n.model].filter(Boolean).join(' ') || '—'}</td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--ink)' }}>{usedCh} / {totalCh} ch</div>
                    <div style={{ marginTop: 4, height: 4, background: 'var(--surface-2)', borderRadius: 999, width: 80, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${chPct}%`, background: 'var(--accent)', borderRadius: 999 }} />
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: hddPct > 80 ? 'var(--warn)' : 'var(--ink)' }}>
                      {n.hdd_total_tb != null ? `${n.hdd_total_tb} TB` : '—'} · {Math.round(hddPct)}%
                    </div>
                    <div style={{ marginTop: 4, height: 4, background: 'var(--surface-2)', borderRadius: 999, width: 80, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${hddPct}%`, background: hddPct > 80 ? 'var(--warn)' : 'var(--accent)', borderRadius: 999 }} />
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
