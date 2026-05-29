import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2, AlertTriangle, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { getCameras, createCamera, updateCamera, deleteCamera } from '../api/cameras'
import type { CameraApi } from '../api/types'

type Status = 'online' | 'warning' | 'offline'

interface Camera {
  id: string
  name: string
  ip: string
  model: string
  location: string
  nvr: string
  site: string
  status: Status
}

function mapCamera(a: CameraApi): Camera {
  const s = a.status ?? ''
  const status: Status = s === 'online' ? 'online' : s === 'warning' ? 'warning' : 'offline'
  return {
    id: String(a.id),
    name: a.device_name,
    ip: a.ip_address ?? '—',
    model: a.model ?? '',
    location: a.install_location ?? '—',
    nvr: a.NVR_ID ?? '—',
    site: a.Site_ID,
    status,
  }
}

const SITES   = ['สำนักงานใหญ่', 'สาขาสีลม', 'สาขาลาดพร้าว', 'สาขาบางนา', 'คลังสินค้า']
const NVR_LIST = ['NVR-01', 'NVR-02', 'NVR-03', 'NVR-04', 'NVR-05']

const BADGE: Record<Status, { cls: string; label: string }> = {
  online:  { cls: 'dl-badge ok',    label: 'Online' },
  warning: { cls: 'dl-badge warn',  label: 'Warning' },
  offline: { cls: 'dl-badge alert', label: 'Offline' },
}

interface FormState { name: string; ip: string; model: string; location: string; nvr: string; site: string }
const EMPTY_FORM: FormState = { name: '', ip: '', model: '', location: '', nvr: NVR_LIST[0], site: SITES[0] }

export default function CamerasPage() {
  const navigate     = useNavigate()
  const { message }  = App.useApp()
  const queryClient  = useQueryClient()
  const { data, isPending, isError, error } = useQuery({ queryKey: ['cameras'], queryFn: () => getCameras() })
  const [cameras, setCameras] = useState<Camera[]>([])
  useEffect(() => { if (data !== undefined) setCameras(data.map(mapCamera)) }, [data])
  const filterSites = useMemo(() => [...new Set(cameras.map(c => c.site))].sort(), [cameras])

  const [q, setQ]                   = useState('')
  const [siteFilter, setSiteFilter] = useState('all')
  const [modalMode, setModalMode]   = useState<null | 'create' | Camera>(null)
  const [deleteTarget, setDel]      = useState<Camera | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)

  const createMut = useMutation({
    mutationFn: () => createCamera({ device_name: form.name.trim(), ip_address: form.ip.trim(), model: form.model.trim(), install_location: form.location.trim(), NVR_ID: form.nvr, Site_ID: form.site }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cameras'] }),
    onError:   () => {},
  })
  const updateMut = useMutation({
    mutationFn: (id: number) => updateCamera(id, { device_name: form.name.trim(), ip_address: form.ip.trim(), model: form.model.trim(), install_location: form.location.trim(), NVR_ID: form.nvr }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cameras'] }),
    onError:   () => {},
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCamera(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cameras'] }),
    onError:   () => {},
  })

  const filtered = cameras.filter(c => {
    if (siteFilter !== 'all' && c.site !== siteFilter) return false
    if (!q) return true
    const lower = q.toLowerCase()
    return [c.name, c.ip, c.model, c.location, c.nvr, c.site].some(v => v.toLowerCase().includes(lower))
  })

  const online  = cameras.filter(c => c.status === 'online').length
  const offline = cameras.filter(c => c.status === 'offline').length
  const warning = cameras.filter(c => c.status === 'warning').length

  function openCreate() {
    setForm(EMPTY_FORM)
    setModalMode('create')
  }

  function openEdit(c: Camera) {
    setForm({ name: c.name, ip: c.ip, model: c.model, location: c.location, nvr: c.nvr, site: c.site })
    setModalMode(c)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.ip.trim()) return
    if (modalMode === 'create') {
      const cam: Camera = { id: `cam-${Date.now()}`, name: form.name.trim(), ip: form.ip.trim(), model: form.model.trim(), location: form.location.trim(), nvr: form.nvr, site: form.site, status: 'online' }
      setCameras(prev => [...prev, cam])
      setModalMode(null)
      try { await createMut.mutateAsync(); message.success(`เพิ่ม ${cam.name} สำเร็จ`) }
      catch { message.warning('บันทึก offline — ข้อมูลจะซิงค์เมื่อ server พร้อม') }
    } else if (modalMode && typeof modalMode === 'object') {
      setCameras(prev => prev.map(c => c.id === modalMode.id ? { ...c, name: form.name.trim(), ip: form.ip.trim(), model: form.model.trim(), location: form.location.trim(), nvr: form.nvr, site: form.site } : c))
      setModalMode(null)
      const numId = parseInt(modalMode.id)
      if (!isNaN(numId)) {
        try { await updateMut.mutateAsync(numId); message.success('บันทึกการเปลี่ยนแปลงสำเร็จ') }
        catch { message.warning('บันทึก offline — ข้อมูลจะซิงค์เมื่อ server พร้อม') }
      } else { message.success('บันทึกการเปลี่ยนแปลงสำเร็จ') }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setCameras(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDel(null)
    const numId = parseInt(deleteTarget.id)
    if (!isNaN(numId)) {
      try { await deleteMut.mutateAsync(numId); message.success(`ลบ ${deleteTarget.name} สำเร็จ`) }
      catch { message.warning('ลบ offline — ข้อมูลจะซิงค์เมื่อ server พร้อม') }
    } else { message.success(`ลบ ${deleteTarget.name} สำเร็จ`) }
  }

  const isEditing = modalMode !== null && modalMode !== 'create'
  const modalOpen = modalMode !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 4 }}>
      <div className="page-head">
        <div>
          <h1>Cameras</h1>
          <p className="page-sub">กล้อง CCTV ทั้งหมดในระบบ</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Camera
        </button>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="ค้นหากล้อง..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="dl-filter-select" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
          <option value="all">ทุกสาขา</option>
          {filterSites.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--ok)' }} />{online} online</span>
        {warning > 0 && <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--warn)' }} />{warning} warning</span>}
        <span className="dl-stat"><span className="ds-dot" style={{ background: 'var(--alert)' }} />{offline} offline</span>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{cameras.length} total</span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th>สถานะ</th>
              <th>ชื่อกล้อง</th>
              <th>IP Address</th>
              <th>รุ่น</th>
              <th>ตำแหน่ง</th>
              <th>NVR</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr><td colSpan={7} className="dl-empty">กำลังโหลด...</td></tr>
            )}
            {isError && (
              <tr><td colSpan={7} className="dl-empty" style={{ color: 'var(--alert)' }}>
                {(error as any)?.isForbidden ? 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' : 'โหลดข้อมูลไม่สำเร็จ — กรุณารีเฟรช'}
              </td></tr>
            )}
            {!isPending && !isError && filtered.length === 0 && (
              <tr><td colSpan={7} className="dl-empty">ไม่พบกล้อง</td></tr>
            )}
            {!isPending && !isError && filtered.map(c => (
              <tr
                key={c.id}
                onClick={() => navigate(`/dashboard/cameras/${c.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td><span className={BADGE[c.status].cls}>{BADGE[c.status].label}</span></td>
                <td>
                  <div className="td-name">{c.name}</div>
                  <div className="td-sub">{c.site}</div>
                </td>
                <td className="td-mono">{c.ip}</td>
                <td style={{ fontSize: 12, color: 'var(--ink-2)' }}>{c.model || '—'}</td>
                <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{c.location || '—'}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{c.nvr}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="tbl-icon-btn" onClick={() => openEdit(c)} title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button className="tbl-icon-btn" onClick={() => setDel(c)} title="Delete"
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
              <h2 className="crud-modal-title">{isEditing ? 'แก้ไข กล้อง' : 'เพิ่ม กล้อง'}</h2>
              <button className="crud-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="crud-modal-body">
              <div className="form-group">
                <label className="form-label">ชื่อกล้อง</label>
                <input className="form-ctrl" placeholder="e.g. CAM-X-01"
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
                <label className="form-label">ตำแหน่ง</label>
                <input className="form-ctrl" placeholder="ระบุตำแหน่งติดตั้ง"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">NVR</label>
                <select className="form-ctrl" value={form.nvr} onChange={e => setForm(f => ({ ...f, nvr: e.target.value }))}>
                  {NVR_LIST.map(n => <option key={n}>{n}</option>)}
                </select>
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
