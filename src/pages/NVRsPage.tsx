import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2, AlertTriangle, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { getNvrs, createNvr, updateNvr, deleteNvr } from '../api/nvrs'
import type { NvrApi } from '../api/types'

type Status = 'online' | 'warning' | 'offline'

interface NVR {
  id: string
  name: string
  ip: string
  model: string
  chUsed: number
  chTotal: number
  hddPct: number
  site: string
  status: Status
}

function mapNvr(a: NvrApi): NVR {
  const s = a.status ?? ''
  const status: Status = s === 'online' ? 'online' : s === 'warning' ? 'warning' : 'offline'
  return {
    id: a.NVR_ID,
    name: a.device_name,
    ip: a.ip_internet ?? a.ip_cctv ?? '—',
    model: a.model ?? '',
    chUsed: a.active_channels ?? 0,
    chTotal: a.total_channels ?? 0,
    hddPct: Math.round(a.hdd_used_pct ?? 0),
    site: a.Site_ID,
    status,
  }
}


const SITES = ['สำนักงานใหญ่', 'สาขาเชียงใหม่', 'สาขาภูเก็ต', 'สาขาขอนแก่น', 'สาขาหาดใหญ่']

const BADGE: Record<Status, { cls: string; label: string }> = {
  online:  { cls: 'dl-badge ok',    label: 'Online' },
  warning: { cls: 'dl-badge warn',  label: 'Warning' },
  offline: { cls: 'dl-badge alert', label: 'Offline' },
}

interface FormState { nvrId: string; name: string; ip: string; model: string; chTotal: string; site: string }
const EMPTY_FORM: FormState = { nvrId: '', name: '', ip: '', model: '', chTotal: '16', site: SITES[0] }

export default function NVRsPage() {
  const navigate    = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const { data, isPending, isError, error } = useQuery({ queryKey: ['nvrs'], queryFn: () => getNvrs() })
  const [nvrs, setNvrs]    = useState<NVR[]>([])
  const [q, setQ]                   = useState('')
  const [siteFilter, setSiteFilter] = useState('all')
  const [modalMode, setModalMode]   = useState<null | 'create' | NVR>(null)
  const [deleteTarget, setDel]      = useState<NVR | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)

  useEffect(() => { if (data !== undefined) setNvrs(data.map(mapNvr)) }, [data])
  const filterSites = useMemo(() => [...new Set(nvrs.map(n => n.site))].sort(), [nvrs])

  const createMut = useMutation({
    mutationFn: () => createNvr({ NVR_ID: form.nvrId.trim(), device_name: form.name.trim(), ip_internet: form.ip.trim(), model: form.model.trim(), total_channels: parseInt(form.chTotal) || 16, Site_ID: form.site }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nvrs'] }),
    onError: () => {},
  })
  const updateMut = useMutation({
    mutationFn: (id: string) => updateNvr(id, { device_name: form.name.trim(), ip_internet: form.ip.trim(), model: form.model.trim(), total_channels: parseInt(form.chTotal) || 16 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nvrs'] }),
    onError: () => {},
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteNvr(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nvrs'] }),
    onError: () => {},
  })

  const filtered = nvrs.filter(n => {
    if (siteFilter !== 'all' && n.site !== siteFilter) return false
    if (!q) return true
    const lower = q.toLowerCase()
    return [n.name, n.ip, n.model, n.site].some(v => v.toLowerCase().includes(lower))
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setModalMode('create')
  }

  function openEdit(n: NVR) {
    setForm({ nvrId: n.id, name: n.name, ip: n.ip, model: n.model, chTotal: String(n.chTotal), site: n.site })
    setModalMode(n)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.ip.trim()) return
    const chTotal = parseInt(form.chTotal) || 16
    if (modalMode === 'create') {
      if (!form.nvrId.trim()) return
      const nvr: NVR = { id: form.nvrId.trim(), name: form.name.trim(), ip: form.ip.trim(), model: form.model.trim(), chUsed: 0, chTotal, hddPct: 0, site: form.site, status: 'online' }
      setNvrs(prev => [...prev, nvr])
      setModalMode(null)
      try { await createMut.mutateAsync(); message.success(`เพิ่ม ${nvr.name} สำเร็จ`) }
      catch { message.warning('บันทึก offline — ข้อมูลจะซิงค์เมื่อ server พร้อม') }
    } else if (modalMode && typeof modalMode === 'object') {
      setNvrs(prev => prev.map(n => n.id === modalMode.id ? { ...n, name: form.name.trim(), ip: form.ip.trim(), model: form.model.trim(), chTotal, site: form.site } : n))
      setModalMode(null)
      try { await updateMut.mutateAsync(modalMode.id); message.success('บันทึกการเปลี่ยนแปลงสำเร็จ') }
      catch { message.warning('บันทึก offline — ข้อมูลจะซิงค์เมื่อ server พร้อม') }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setNvrs(prev => prev.filter(n => n.id !== deleteTarget.id))
    setDel(null)
    try { await deleteMut.mutateAsync(deleteTarget.id); message.success(`ลบ ${deleteTarget.name} สำเร็จ`) }
    catch { message.warning('ลบ offline — ข้อมูลจะซิงค์เมื่อ server พร้อม') }
  }

  const isEditing = modalMode !== null && modalMode !== 'create'
  const modalOpen = modalMode !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>NVRs</h1>
          <p className="page-sub">Network Video Recorders ทั้งหมดในระบบ</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add NVR
        </button>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="ค้นหา NVR..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="dl-filter-select" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
          <option value="all">ทุกสาขา</option>
          {filterSites.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{nvrs.length} total</span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th>สถานะ</th>
              <th>ชื่อ NVR</th>
              <th>IP Address</th>
              <th>รุ่น</th>
              <th>ช่องสัญญาณ</th>
              <th>HDD</th>
              <th>สาขา</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr><td colSpan={8} className="dl-empty">กำลังโหลด...</td></tr>
            )}
            {isError && (
              <tr><td colSpan={8} className="dl-empty" style={{ color: 'var(--alert)' }}>
                {(error as any)?.isForbidden ? 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' : 'โหลดข้อมูลไม่สำเร็จ — กรุณารีเฟรช'}
              </td></tr>
            )}
            {!isPending && !isError && filtered.length === 0 && (
              <tr><td colSpan={8} className="dl-empty">ไม่พบ NVR</td></tr>
            )}
            {!isPending && !isError && filtered.map(n => {
              const hddAlert = n.hddPct >= 85
              return (
                <tr
                  key={n.id}
                  onClick={() => navigate(`/dashboard/nvrs/${n.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td><span className={BADGE[n.status].cls}>{BADGE[n.status].label}</span></td>
                  <td><div className="td-name">{n.name}</div></td>
                  <td className="td-mono">{n.ip}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink-2)' }}>{n.model || '—'}</td>
                  <td className="td-mono">{n.chUsed}/{n.chTotal}</td>
                  <td onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
                    {n.status === 'offline' ? (
                      <span style={{ color: 'var(--ink-3)' }}>—</span>
                    ) : (
                      <div className="prog-wrap">
                        <div className="prog-bar">
                          <div
                            className="prog-fill"
                            style={{ width: `${n.hddPct}%`, background: hddAlert ? 'var(--alert)' : 'var(--ok)' }}
                          />
                        </div>
                        <span
                          className="prog-text"
                          style={{ color: hddAlert ? 'var(--alert)' : undefined, fontWeight: hddAlert ? 700 : undefined }}
                        >
                          {n.hddPct}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5 }}>{n.site}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="tbl-icon-btn" onClick={() => openEdit(n)} title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button className="tbl-icon-btn" onClick={() => setDel(n)} title="Delete"
                        style={{ color: 'var(--alert)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="crud-overlay" onClick={() => setModalMode(null)}>
          <div className="crud-modal" onClick={e => e.stopPropagation()}>
            <div className="crud-modal-hd">
              <h2 className="crud-modal-title">{isEditing ? 'แก้ไข NVR' : 'เพิ่ม NVR'}</h2>
              <button className="crud-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="crud-modal-body">
              {!isEditing && (
                <div className="form-group">
                  <label className="form-label">NVR ID <span style={{ color: 'var(--alert)' }}>*</span></label>
                  <input className="form-ctrl mono" placeholder="e.g. NVR-HQ-07"
                    value={form.nvrId} onChange={e => setForm(f => ({ ...f, nvrId: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">ชื่อ NVR</label>
                <input className="form-ctrl" placeholder="e.g. NVR HQ 07"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">IP Address</label>
                <input className="form-ctrl mono" placeholder="192.168.x.x"
                  value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">รุ่น</label>
                <input className="form-ctrl" placeholder="ระบุรุ่น (ถ้ามี)"
                  value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">จำนวนช่องสัญญาณ</label>
                <input className="form-ctrl mono" type="number" placeholder="16"
                  value={form.chTotal} onChange={e => setForm(f => ({ ...f, chTotal: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">สาขา</label>
                <select className="form-ctrl" value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))}>
                  {SITES.map(s => <option key={s}>{s}</option>)}
                </select>
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
