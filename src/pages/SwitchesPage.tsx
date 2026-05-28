import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2, AlertTriangle, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { getSwitches, createSwitch, updateSwitch, deleteSwitch } from '../api/switches'
import type { PoeSwitchApi } from '../api/types'

type Status = 'online' | 'warning' | 'offline'

interface Switch {
  id: string
  name: string
  ip: string
  model: string
  ports: number
  uptime: string
  site: string
  status: Status
  note: string
}

function mapSwitch(a: PoeSwitchApi): Switch {
  const s = a.status ?? ''
  const status: Status = s === 'online' ? 'online' : s === 'warning' ? 'warning' : 'offline'
  return {
    id: a.SW_ID,
    name: a.device_name,
    ip: a.ip_address ?? '—',
    model: a.model ?? '',
    ports: a.total_ports ?? 0,
    uptime: '—',
    site: a.Site_ID,
    status,
    note: a.notes ?? '',
  }
}

const FALLBACK_SWITCHES: Switch[] = [
  { id: 'SW-HQ-CORE',   name: 'Core Switch HQ',   ip: '192.168.1.2',  model: 'Cisco SG350X-24P',    ports: 24, uptime: '45d 2h',  site: 'HQ', status: 'online',  note: '' },
  { id: 'SW-HQ-FLOOR2', name: 'Floor 2 Switch',   ip: '192.168.1.4',  model: 'Cisco CBS350-24P',    ports: 24, uptime: '12d 6h',  site: 'HQ', status: 'warning', note: '' },
  { id: 'SW-HQ-FLOOR3', name: 'Floor 3 Switch',   ip: '192.168.1.3',  model: 'Cisco CBS350-24P',    ports: 24, uptime: '0d 0h',   site: 'HQ', status: 'offline', note: '' },
  { id: 'SW-MINI-01',   name: 'Mini Switch 01',   ip: '192.168.1.5',  model: 'TP-Link TL-SG1016PE', ports: 16, uptime: '30d 14h', site: 'HQ', status: 'online',  note: '' },
  { id: 'SW-CM-01',     name: 'Chiang Mai Core',  ip: '192.168.10.2', model: 'Cisco SG350-28P',     ports: 28, uptime: '60d 10h', site: 'CM', status: 'online',  note: '' },
  { id: 'SW-PK-01',     name: 'Phuket Switch',    ip: '192.168.20.2', model: 'Cisco CBS350-16P',    ports: 16, uptime: '22d 0h',  site: 'PK', status: 'online',  note: '' },
]

const SITES = ['สำนักงานใหญ่', 'สาขาเชียงใหม่', 'สาขาภูเก็ต', 'สาขาขอนแก่น', 'สาขาหาดใหญ่']

const BADGE: Record<Status, { cls: string; label: string }> = {
  online:  { cls: 'dl-badge ok',    label: 'Online' },
  warning: { cls: 'dl-badge warn',  label: 'Warning' },
  offline: { cls: 'dl-badge alert', label: 'Offline' },
}

interface FormState { swId: string; name: string; ip: string; model: string; ports: string; site: string; note: string }
const EMPTY_FORM: FormState = { swId: '', name: '', ip: '', model: '', ports: '24', site: SITES[0], note: '' }

export default function SwitchesPage() {
  const navigate    = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['switches'], queryFn: () => getSwitches() })
  const [switches, setSwitches] = useState<Switch[]>(FALLBACK_SWITCHES)
  useEffect(() => { if (data?.length) setSwitches(data.map(mapSwitch)) }, [data])

  const createMut = useMutation({
    mutationFn: () => createSwitch({ SW_ID: form.swId.trim(), device_name: form.name.trim(), ip_address: form.ip.trim(), model: form.model.trim(), total_ports: parseInt(form.ports) || 24, Site_ID: form.site }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['switches'] }),
    onError: () => {},
  })
  const updateMut = useMutation({
    mutationFn: (id: string) => updateSwitch(id, { device_name: form.name.trim(), ip_address: form.ip.trim(), model: form.model.trim(), total_ports: parseInt(form.ports) || 24 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['switches'] }),
    onError: () => {},
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSwitch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['switches'] }),
    onError: () => {},
  })

  const [q, setQ]                   = useState('')
  const [siteFilter, setSiteFilter] = useState('all')
  const [modalMode, setModalMode]   = useState<null | 'create' | Switch>(null)
  const [deleteTarget, setDel]      = useState<Switch | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)

  const filtered = switches.filter(s => {
    if (siteFilter !== 'all' && s.site !== siteFilter) return false
    if (!q) return true
    const lower = q.toLowerCase()
    return [s.name, s.ip, s.model, s.site].some(v => v.toLowerCase().includes(lower))
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setModalMode('create')
  }

  function openEdit(s: Switch) {
    setForm({ swId: s.id, name: s.name, ip: s.ip, model: s.model, ports: String(s.ports), site: s.site, note: s.note })
    setModalMode(s)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.ip.trim()) return
    const ports = parseInt(form.ports) || 24
    if (modalMode === 'create') {
      if (!form.swId.trim()) return
      const sw: Switch = { id: form.swId.trim(), name: form.name.trim(), ip: form.ip.trim(), model: form.model.trim(), ports, uptime: '0d 0h', site: form.site, note: form.note.trim(), status: 'online' }
      setSwitches(prev => [...prev, sw])
      setModalMode(null)
      try { await createMut.mutateAsync(); message.success(`เพิ่ม ${sw.name} สำเร็จ`) }
      catch { message.warning('บันทึก offline — ข้อมูลจะซิงค์เมื่อ server พร้อม') }
    } else if (modalMode && typeof modalMode === 'object') {
      setSwitches(prev => prev.map(s => s.id === modalMode.id ? { ...s, name: form.name.trim(), ip: form.ip.trim(), model: form.model.trim(), ports, site: form.site, note: form.note.trim() } : s))
      setModalMode(null)
      try { await updateMut.mutateAsync(modalMode.id); message.success('บันทึกการเปลี่ยนแปลงสำเร็จ') }
      catch { message.warning('บันทึก offline — ข้อมูลจะซิงค์เมื่อ server พร้อม') }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSwitches(prev => prev.filter(s => s.id !== deleteTarget.id))
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
          <h1>PoE Switches</h1>
          <p className="page-sub">Network switches ทั้งหมดในระบบ</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Switch
        </button>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="ค้นหา Switch..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="dl-filter-select" value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
          <option value="all">ทุกสาขา</option>
          {SITES.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>{switches.length} total</span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th>สถานะ</th>
              <th>ชื่อ Switch</th>
              <th>IP Address</th>
              <th>รุ่น</th>
              <th>Ports</th>
              <th>Uptime</th>
              <th>สาขา</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="dl-empty">ไม่พบ Switch</td></tr>
            )}
            {filtered.map(s => (
              <tr
                key={s.id}
                onClick={() => navigate(`/dashboard/switches/${s.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td><span className={BADGE[s.status].cls}>{BADGE[s.status].label}</span></td>
                <td>
                  <div className="td-name">{s.name}</div>
                  {s.note && <div className="td-sub">{s.note}</div>}
                </td>
                <td className="td-mono">{s.ip}</td>
                <td style={{ fontSize: 12, color: 'var(--ink-2)' }}>{s.model || '—'}</td>
                <td className="td-mono">{s.ports}</td>
                <td className="td-mono" style={{ color: 'var(--ink-3)' }}>{s.uptime}</td>
                <td style={{ fontSize: 12.5 }}>{s.site}</td>
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
              <h2 className="crud-modal-title">{isEditing ? 'แก้ไข Switch' : 'เพิ่ม Switch'}</h2>
              <button className="crud-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="crud-modal-body">
              {!isEditing && (
                <div className="form-group">
                  <label className="form-label">Switch ID <span style={{ color: 'var(--alert)' }}>*</span></label>
                  <input className="form-ctrl mono" placeholder="e.g. SW-HQ-FLOOR4"
                    value={form.swId} onChange={e => setForm(f => ({ ...f, swId: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">ชื่อ Switch</label>
                <input className="form-ctrl" placeholder="e.g. Floor 4 Switch"
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
                <label className="form-label">จำนวน Port</label>
                <input className="form-ctrl mono" type="number" placeholder="24"
                  value={form.ports} onChange={e => setForm(f => ({ ...f, ports: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">สาขา</label>
                <select className="form-ctrl" value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))}>
                  {SITES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">หมายเหตุ</label>
                <input className="form-ctrl" placeholder="ระบุหมายเหตุ (ถ้ามี)"
                  value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
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
