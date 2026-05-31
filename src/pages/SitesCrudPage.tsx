import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2, AlertTriangle, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getSites, getDashboardSummary } from '../api/hierarchy'
import type { SiteApi, DashboardSummaryDto } from '../api/types'

type Status = 'online' | 'warning' | 'offline'

interface Site {
  id: string
  name: string
  address: string
  province: string
  buildings: number
  cameras: number
  status: Status
  note: string
}

function toStatus(summary: DashboardSummaryDto | undefined): Status {
  if (!summary) return 'online'
  if (summary.camerasOffline > 0) return 'warning'
  return 'online'
}

function mapSite(a: SiteApi, summary: DashboardSummaryDto | undefined): Site {
  return {
    id:        a.Site_ID,
    name:      a.name,
    address:   a.location ?? '',
    province:  '',
    buildings: summary?.totalBuildings ?? 0,
    cameras:   summary?.totalCameras   ?? 0,
    status:    toStatus(summary),
    note:      a.code ?? '',
  }
}

const BADGE: Record<Status, { cls: string; label: string }> = {
  online:  { cls: 'dl-badge ok',    label: 'Online' },
  warning: { cls: 'dl-badge warn',  label: 'Warning' },
  offline: { cls: 'dl-badge alert', label: 'Offline' },
}

const PROVINCES = ['กรุงเทพฯ', 'สมุทรปราการ', 'นนทบุรี', 'ปทุมธานี', 'สมุทรสาคร']

interface FormState { name: string; address: string; province: string; note: string }
const EMPTY_FORM: FormState = { name: '', address: '', province: 'กรุงเทพฯ', note: '' }

export default function SitesCrudPage() {
  const navigate = useNavigate()
  const [sites, setSites]           = useState<Site[]>([])
  const [q, setQ]                   = useState('')
  const [statusFilter, setStatus]   = useState<string>('all')
  const [modalMode, setModalMode]   = useState<null | 'create' | Site>(null)
  const [deleteTarget, setDel]      = useState<Site | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)

  const { data: apiSites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: getSites,
    staleTime: 30_000,
  })

  const { data: summaryData = [] } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    staleTime: 30_000,
  })

  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current || sitesLoading) return
    initialized.current = true
    const summaryMap: Record<string, DashboardSummaryDto> = {}
    summaryData.forEach(s => { summaryMap[s.siteId] = s })
    setSites(apiSites.map(a => mapSite(a, summaryMap[a.Site_ID])))
  }, [apiSites, summaryData, sitesLoading])

  const filtered = sites.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (!q) return true
    const lower = q.toLowerCase()
    return s.name.toLowerCase().includes(lower) || s.address.toLowerCase().includes(lower)
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setModalMode('create')
  }

  function openEdit(s: Site) {
    setForm({ name: s.name, address: s.address, province: s.province, note: s.note })
    setModalMode(s)
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (modalMode === 'create') {
      const newSite: Site = {
        id: `site-${Date.now()}`,
        name: form.name.trim(),
        address: form.address.trim(),
        province: form.province,
        note: form.note.trim(),
        buildings: 0, cameras: 0, status: 'online',
      }
      setSites(prev => [...prev, newSite])
    } else if (modalMode && typeof modalMode === 'object') {
      setSites(prev => prev.map(s =>
        s.id === modalMode.id
          ? { ...s, name: form.name.trim(), address: form.address.trim(), province: form.province, note: form.note.trim() }
          : s
      ))
    }
    setModalMode(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    setSites(prev => prev.filter(s => s.id !== deleteTarget.id))
    setDel(null)
  }

  const isEditing = modalMode !== null && modalMode !== 'create'
  const modalOpen = modalMode !== null

  if (sitesLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', height: '100%' }}>
      Loading sites...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>Sites</h1>
          <p className="page-sub">จัดการสาขาและพื้นที่ติดตั้ง</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Site
        </button>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input
            placeholder="ค้นหาสาขา..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <select
          className="dl-filter-select"
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">ทุกสถานะ</option>
          <option value="online">Online</option>
          <option value="warning">Warning</option>
          <option value="offline">Offline</option>
        </select>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{sites.length} สาขา</span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th>ชื่อสาขา</th>
              <th>ที่อยู่</th>
              <th>อาคาร</th>
              <th>กล้อง</th>
              <th>สถานะ</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="dl-empty">ไม่พบสาขา</td></tr>
            )}
            {filtered.map(s => (
              <tr
                key={s.id}
                onClick={() => navigate(`/dashboard/sites/${s.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div className="td-name">{s.name}</div>
                  {s.note && <div className="td-sub">{s.note}</div>}
                </td>
                <td style={{ color: 'var(--ink-2)', fontSize: 12.5 }}>{s.address}</td>
                <td className="td-mono">{s.buildings}</td>
                <td className="td-mono">{s.cameras}</td>
                <td><span className={BADGE[s.status].cls}>{BADGE[s.status].label}</span></td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="tbl-icon-btn" onClick={() => openEdit(s)} title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button className="tbl-icon-btn" onClick={() => setDel(s)} title="Delete"
                      style={{ color: 'var(--alert)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="crud-overlay" onClick={() => setModalMode(null)}>
          <div className="crud-modal" onClick={e => e.stopPropagation()}>
            <div className="crud-modal-hd">
              <h2 className="crud-modal-title">{isEditing ? 'แก้ไข สาขา' : 'เพิ่ม สาขา'}</h2>
              <button className="crud-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="crud-modal-body">
              <div className="form-group">
                <label className="form-label">ชื่อสาขา</label>
                <input
                  className="form-ctrl"
                  placeholder="e.g. สาขารัชดา"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ที่อยู่</label>
                <textarea
                  className="form-ctrl"
                  rows={3}
                  placeholder="ระบุที่อยู่"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">จังหวัด</label>
                <select
                  className="form-ctrl"
                  value={form.province}
                  onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                >
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">หมายเหตุ</label>
                <input
                  className="form-ctrl"
                  placeholder="ระบุหมายเหตุ (ถ้ามี)"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>
            <div className="crud-modal-ft">
              <button className="btn-ghost" onClick={() => setModalMode(null)}>ยกเลิก</button>
              <button className="btn-primary" onClick={handleSave}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="crud-overlay" onClick={() => setDel(null)}>
          <div className="del-modal" onClick={e => e.stopPropagation()}>
            <div className="del-modal-body">
              <AlertTriangle size={48} className="del-modal-icon" />
              <h2 className="del-modal-title">ยืนยันการลบ</h2>
              <p className="del-modal-desc">
                คุณต้องการลบ <strong>{deleteTarget.name}</strong> ออกจากระบบ?<br />
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="del-modal-ft">
              <button className="btn-ghost" onClick={() => setDel(null)}>ยกเลิก</button>
              <button className="btn-danger" onClick={handleDelete}>ลบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
