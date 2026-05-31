import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2, AlertTriangle, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Tooltip } from 'antd'
import { getNvrs, createNvr, updateNvr, deleteNvr } from '../api/nvrs'
import { getSites } from '../api/hierarchy'
import type { NvrApi, SiteApi } from '../api/types'

type Status = 'online' | 'warning' | 'offline'

interface NVR {
  id: string
  name: string
  ip: string
  ipCctv: string
  model: string
  brand: string
  chUsed: number
  chTotal: number
  hddPct: number
  site: string
  status: Status
}

const BADGE: Record<Status, { cls: string; label: string }> = {
  online:  { cls: 'dl-badge ok',    label: 'Online' },
  warning: { cls: 'dl-badge warn',  label: 'Warning' },
  offline: { cls: 'dl-badge alert', label: 'Offline' },
}

function toStatus(s: string | null): Status {
  if (s === 'online' || s === 'warning' || s === 'offline') return s
  return 'offline'
}

function mapNvr(a: NvrApi, siteMap: Record<string, string>): NVR {
  return {
    id: a.NVR_ID,
    name: a.device_name,
    ip: a.ip_internet ?? '—',
    ipCctv: a.ip_cctv ?? '—',
    model: a.model ?? '',
    brand: a.brand ?? '—',
    chUsed: a.active_channels ?? 0,
    chTotal: a.total_channels ?? 0,
    hddPct: Math.round(a.hdd_used_pct ?? 0),
    site: siteMap[a.Site_ID] ?? a.Site_ID,
    status: toStatus(a.status),
  }
}

interface FormState { nvrId: string; name: string; ip: string; model: string; chTotal: string; site: string }

export default function NVRsPage() {
  const navigate    = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const { data: apiNvrs = [], isLoading: nvrLoading } = useQuery({
    queryKey: ['nvrs'],
    queryFn: () => getNvrs(),
    refetchOnWindowFocus: false,
  })

  const { data: apiSites = [], isLoading: siteLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => getSites(),
    refetchOnWindowFocus: false,
  })

  const siteMap = useMemo(() => {
    const m: Record<string, string> = {}
    apiSites.forEach((s: SiteApi) => { m[s.Site_ID] = s.name })
    return m
  }, [apiSites])

  const siteNames = useMemo(() => apiSites.map((s: SiteApi) => s.name), [apiSites])

  const [q, setQ]                   = useState('')
  const [siteFilter, setSiteFilter] = useState('all')
  const [modalMode, setModalMode]   = useState<null | 'create' | NVR>(null)
  const [deleteTarget, setDel]      = useState<NVR | null>(null)
  const [form, setForm]             = useState<FormState>({ nvrId: '', name: '', ip: '', model: '', chTotal: '16', site: '' })
  const [saving, setSaving]         = useState(false)

  const nvrs = useMemo(
    () => (nvrLoading || siteLoading) ? [] : apiNvrs.map(a => mapNvr(a, siteMap)),
    [apiNvrs, nvrLoading, siteLoading, siteMap],
  )

  const createMut = useMutation({
    mutationFn: () => createNvr({ NVR_ID: form.nvrId.trim(), device_name: form.name.trim(), ip_internet: form.ip.trim(), model: form.model.trim(), total_channels: parseInt(form.chTotal) || 16, Site_ID: form.site }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nvrs'] }),
  })
  const updateMut = useMutation({
    mutationFn: (id: string) => updateNvr(id, { device_name: form.name.trim(), ip_internet: form.ip.trim(), model: form.model.trim(), total_channels: parseInt(form.chTotal) || 16 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nvrs'] }),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteNvr(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nvrs'] }),
  })

  const filtered = nvrs.filter(n => {
    if (siteFilter !== 'all' && n.site !== siteFilter) return false
    if (!q) return true
    const lower = q.toLowerCase()
    return [n.name, n.ip, n.model, n.site].some(v => v.toLowerCase().includes(lower))
  })

  function openCreate() {
    setForm({ nvrId: '', name: '', ip: '', model: '', chTotal: '16', site: siteNames[0] ?? '' })
    setModalMode('create')
  }

  function openEdit(n: NVR) {
    setForm({ nvrId: n.id, name: n.name, ip: n.ip === '—' ? '' : n.ip, model: n.model, chTotal: String(n.chTotal), site: n.site })
    setModalMode(n)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.ip.trim()) return
    if (modalMode === 'create' && !form.nvrId.trim()) return
    setSaving(true)
    try {
      if (modalMode === 'create') {
        await createMut.mutateAsync()
        message.success('เพิ่ม NVR สำเร็จ')
      } else if (modalMode && typeof modalMode === 'object') {
        await updateMut.mutateAsync(modalMode.id)
        message.success('บันทึกการเปลี่ยนแปลงสำเร็จ')
      }
      setModalMode(null)
    } catch {
      message.error('บันทึกไม่สำเร็จ — กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      message.success(`ลบ ${deleteTarget.name} สำเร็จ`)
      setDel(null)
    } catch {
      message.error('ลบไม่สำเร็จ — กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  const isEditing = modalMode !== null && modalMode !== 'create'
  const modalOpen = modalMode !== null

  if (nvrLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', height: '100%' }}>
      Loading NVRs...
    </div>
  )

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
          {siteNames.map(s => <option key={s}>{s}</option>)}
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
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="dl-empty">ไม่พบ NVR</td></tr>
            )}
            {filtered.map(n => {
              const hddAlert = n.hddPct >= 85
              return (
                <tr
                  key={n.id}
                  onClick={() => navigate(`/dashboard/nvrs/${n.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td><span className={BADGE[n.status].cls}>{BADGE[n.status].label}</span></td>
                  <td>
                    <Tooltip
                      title={
                        <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                          <div>ETH1 (Internet): {n.ip}</div>
                          <div>ETH2 (CCTV): {n.ipCctv}</div>
                          <div>Brand: {n.brand}</div>
                          <div>Status: {n.status}</div>
                        </div>
                      }
                      placement="right"
                      mouseEnterDelay={0.4}
                    >
                      <div className="td-name">{n.name}</div>
                    </Tooltip>
                  </td>
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
                  {siteNames.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="crud-modal-ft">
              <button className="btn-ghost" onClick={() => setModalMode(null)}>ยกเลิก</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
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
              <button className="btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'กำลังลบ...' : 'ลบ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
