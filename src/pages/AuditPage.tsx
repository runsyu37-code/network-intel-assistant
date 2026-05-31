import { useState, useMemo } from 'react'
import { Search, Download, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getCameras } from '../api/cameras'
import { getHierarchyTree } from '../api/hierarchy'
import type { CameraApi, SiteTreeDto } from '../api/types'

const STALE_MS = 10 * 60 * 1000

function timeAgo(iso: string | null): { label: string; stale: boolean } {
  if (!iso) return { label: '—', stale: true }
  const diff = Date.now() - new Date(iso).getTime()
  const stale = diff > STALE_MS
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return { label: 'เมื่อกี้', stale }
  if (mins < 60) return { label: `${mins} นาทีที่แล้ว`, stale }
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return { label: `${hrs} ชม.ที่แล้ว`, stale }
  return { label: `${Math.floor(hrs / 24)} วันที่แล้ว`, stale: true }
}

interface AuditRow {
  id: number
  siteName: string
  buildingName: string
  floorName: string
  cameraName: string
  ip: string
  status: string
  lastSeenLabel: string
  stale: boolean
}

function buildNameMaps(tree: SiteTreeDto[]) {
  const sites: Record<string, string> = {}
  const buildings: Record<string, string> = {}
  const floors: Record<string, string> = {}
  for (const site of tree) {
    sites[site.siteId] = site.siteName
    for (const bld of site.buildings) {
      buildings[bld.buildingId] = bld.buildingName
      for (const fl of bld.floors) {
        floors[fl.floorId] = fl.floorName ?? `ชั้น ${fl.floorNumber}`
      }
    }
  }
  return { sites, buildings, floors }
}

function exportCsv(rows: AuditRow[]) {
  const header = 'Site,Building,Floor,Camera,IP,Status,Last Seen\n'
  const body = rows.map(r =>
    [r.siteName, r.buildingName, r.floorName, `"${r.cameraName}"`, r.ip, r.status, r.lastSeenLabel].join(',')
  ).join('\n')
  const blob = new Blob(['﻿' + header + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-cameras-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type FilterMode = 'all' | 'offline' | 'stale'

export default function AuditPage() {
  const [q, setQ]                   = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const { data: cameras = [], isLoading: camLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => getCameras(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const { data: tree = [], isLoading: treeLoading } = useQuery({
    queryKey: ['hierarchy'],
    queryFn: () => getHierarchyTree(),
    staleTime: 60_000,
  })

  const nameMaps = useMemo(() => buildNameMaps(tree), [tree])

  const rows = useMemo<AuditRow[]>(() => {
    return (cameras as CameraApi[]).map(c => {
      const { label, stale } = timeAgo(c.last_seen)
      return {
        id: c.id,
        siteName:     nameMaps.sites[c.Site_ID]         ?? c.Site_ID,
        buildingName: nameMaps.buildings[c.Building_ID] ?? c.Building_ID,
        floorName:    nameMaps.floors[c.Floor_ID]       ?? c.Floor_ID,
        cameraName:   c.device_name,
        ip:           c.ip_address ?? '—',
        status:       c.status ?? 'unknown',
        lastSeenLabel: label,
        stale,
      }
    })
  }, [cameras, nameMaps])

  const counts = useMemo(() => ({
    total:   rows.length,
    online:  rows.filter(r => r.status === 'online').length,
    offline: rows.filter(r => r.status === 'offline').length,
    warning: rows.filter(r => r.status === 'warning').length,
    stale:   rows.filter(r => r.stale).length,
  }), [rows])

  const filtered = useMemo(() => {
    let result = rows
    if (filterMode === 'offline') result = result.filter(r => r.status === 'offline')
    if (filterMode === 'stale')   result = result.filter(r => r.stale)
    if (q) {
      const lower = q.toLowerCase()
      result = result.filter(r =>
        r.cameraName.toLowerCase().includes(lower) ||
        r.ip.includes(lower) ||
        r.siteName.toLowerCase().includes(lower) ||
        r.buildingName.toLowerCase().includes(lower)
      )
    }
    return result
  }, [rows, filterMode, q])

  if (camLoading || treeLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', height: '100%' }}>
      Loading audit data...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>Audit View</h1>
          <p className="page-sub">กล้อง CCTV ทั้งหมดในระบบ — ตรวจสอบสถานะออนไลน์</p>
        </div>
        <button className="btn-ghost" onClick={() => exportCsv(filtered)}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input
            placeholder="ค้นหากล้อง, IP, สาขา..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        <select
          className="dl-filter-select"
          value={filterMode}
          onChange={e => setFilterMode(e.target.value as FilterMode)}
        >
          <option value="all">ทั้งหมด ({counts.total})</option>
          <option value="offline">Offline เท่านั้น ({counts.offline})</option>
          <option value="stale">Stale เท่านั้น ({counts.stale})</option>
        </select>

        <span className="dl-stat">
          <span className="ds-dot" style={{ background: 'var(--ok)' }} />
          {counts.online} online
        </span>
        {counts.warning > 0 && (
          <span className="dl-stat">
            <span className="ds-dot" style={{ background: 'var(--warn)' }} />
            {counts.warning} warning
          </span>
        )}
        <span className="dl-stat">
          <span className="ds-dot" style={{ background: 'var(--alert)' }} />
          {counts.offline} offline
        </span>
        {counts.stale > 0 && (
          <span className="dl-stat" style={{ color: 'var(--warn)' }}>
            {counts.stale} stale
          </span>
        )}
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>
          {filtered.length} / {counts.total} กล้อง
        </span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th>สถานะ</th>
              <th>ชื่อกล้อง</th>
              <th>IP Address</th>
              <th>สาขา</th>
              <th>อาคาร</th>
              <th>ชั้น</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="dl-empty">ไม่พบกล้อง</td></tr>
            )}
            {filtered.map(r => {
              const statusCls = r.status === 'online'
                ? 'dl-badge ok'
                : r.status === 'warning'
                  ? 'dl-badge warn'
                  : 'dl-badge alert'
              return (
                <tr key={r.id}>
                  <td><span className={statusCls}>{r.status}</span></td>
                  <td className="td-name">{r.cameraName}</td>
                  <td className="td-mono">{r.ip}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{r.siteName}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{r.buildingName}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{r.floorName}</td>
                  <td>
                    <span style={{ fontSize: 12, color: r.stale ? 'var(--warn)' : 'var(--ink-3)' }}>
                      {r.lastSeenLabel}
                    </span>
                    {r.stale && r.status === 'online' && (
                      <AlertTriangle
                        size={11}
                        style={{ marginLeft: 5, color: 'var(--warn)', verticalAlign: 'middle' }}
                      />
                    )}
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
