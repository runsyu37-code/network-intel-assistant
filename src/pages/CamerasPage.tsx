import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw } from 'lucide-react'
import { getCameras } from '../api/cameras'
import type { CameraApi } from '../api/types'

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

function formatLastSeen(raw: string | null): string {
  if (!raw) return '—'
  const d = new Date(raw + (raw.endsWith('Z') ? '' : 'Z'))
  if (isNaN(d.getTime())) return raw
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 120)   return `${Math.round(diff)}s ago`
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

function buildLocation(cam: CameraApi): string {
  const parts = [cam.Site_ID, cam.Building_ID, cam.Floor_ID].filter(Boolean)
  if (cam.install_location) return cam.install_location
  return parts.join(' · ') || '—'
}

export default function CamerasPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const { data: cameras = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => getCameras(),
    refetchInterval: 30_000,
  })

  const filtered = cameras.filter(c => {
    if (!q) return true
    const search = q.toLowerCase()
    return [c.device_name, c.ip_address ?? '', c.Site_ID, c.Building_ID, c.mac_address ?? ''].some(v =>
      v.toLowerCase().includes(search)
    )
  })

  const online  = cameras.filter(c => statusOf(c.status) === 'online').length
  const offline = cameras.filter(c => statusOf(c.status) === 'offline').length
  const warning = cameras.filter(c => statusOf(c.status) === 'warning').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>Cameras</h1>
          <p className="page-sub">All CCTV cameras across every site and building</p>
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
        <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--ok)' }} />{online} online</span>
        {warning > 0 && <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--warn)' }} />{warning} warning</span>}
        <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--alert)' }} />{offline} offline</span>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{cameras.length} total</span>
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
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="dl-empty" style={{ color: 'var(--ink-3)' }}>Loading cameras…</td></tr>
            )}
            {isError && !isLoading && (
              <tr><td colSpan={6} className="dl-empty" style={{ color: 'var(--alert)' }}>Failed to load cameras — check API connection</td></tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr><td colSpan={6} className="dl-empty">No cameras found</td></tr>
            )}
            {filtered.map(c => {
              const st = statusOf(c.status)
              return (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/cameras/${c.id}`)}>
                  <td>
                    <span className="dl-status">
                      <span className="s-dot" style={{ background: STATUS_COLOR[st] }} />
                      {STATUS_LABEL[st]}
                    </span>
                  </td>
                  <td>
                    <div className="td-name">{c.device_name}</div>
                    <div className="td-sub">{buildLocation(c)}</div>
                  </td>
                  <td className="td-mono">{c.ip_address ?? '—'}</td>
                  <td><span className={`dl-badge${st !== 'online' ? ' ' + st : ''}`}>{c.camera_type ?? 'indoor'}</span></td>
                  <td className="td-mono">{c.mac_address ?? '—'}</td>
                  <td className="td-mono" style={{ color: st === 'offline' ? 'var(--alert)' : undefined }}>
                    {formatLastSeen(c.last_seen)}
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
