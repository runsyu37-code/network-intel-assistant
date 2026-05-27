import { useState } from 'react'
import { Search, Plus, Pencil, PauseCircle, Trash2, X } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

type Role   = 'admin' | 'user' | 'viewer'
type Status = 'active' | 'inactive'

interface User {
  id: number
  username: string
  displayName: string
  email: string
  role: Role
  status: Status
}

const INIT_USERS: User[] = [
  { id: 1, username: 'admin_test',  displayName: 'System Admin',  email: 'admin@ssm.local',   role: 'admin',  status: 'active'   },
  { id: 2, username: 'ran_user',    displayName: 'Ran M.',         email: 'ran.m@example.com', role: 'user',   status: 'active'   },
  { id: 3, username: 'viewer01',    displayName: 'Guest Viewer',   email: 'viewer@ssm.local',  role: 'viewer', status: 'active'   },
  { id: 4, username: 'old_staff',   displayName: 'Ex Employee',    email: 'old@ssm.local',     role: 'user',   status: 'inactive' },
  { id: 5, username: 'temp_access', displayName: 'Contractor',     email: 'temp@external.com', role: 'viewer', status: 'active'   },
]

const ROLE_STYLE: Record<Role, { bg: string; color: string }> = {
  admin:  { bg: 'var(--alert-soft)',  color: 'var(--alert)'  },
  user:   { bg: 'var(--accent-soft)', color: 'var(--accent)' },
  viewer: { bg: 'var(--surface-2)',   color: 'var(--ink-3)'  },
}
const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', user: 'User', viewer: 'Viewer' }

type ModalMode = null | 'create' | User

export default function UsersPage() {
  const isAdmin = useAuthStore(s => s.isAdmin())
  const [users, setUsers]               = useState<User[]>(INIT_USERS)
  const [q, setQ]                       = useState('')
  const [roleFilter, setRoleFilter]     = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalMode, setModalMode]       = useState<ModalMode>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [form, setForm]                 = useState({ displayName: '', email: '', role: 'user' as Role, status: 'active' as Status })
  const [addForm, setAddForm]           = useState({ username: '', displayName: '', email: '', role: 'user' as Role, password: '' })

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (statusFilter === 'active' && u.status !== 'active') return false
    if (statusFilter === 'inactive' && u.status !== 'inactive') return false
    if (q) {
      const s = q.toLowerCase()
      return [u.username, u.displayName].some(v => v.toLowerCase().includes(s))
    }
    return true
  })

  function openEdit(u: User) {
    setForm({ displayName: u.displayName, email: u.email, role: u.role, status: u.status })
    setModalMode(u)
  }

  function openCreate() {
    setAddForm({ username: '', displayName: '', email: '', role: 'user', password: '' })
    setModalMode('create')
  }

  function handleSave() {
    if (modalMode === null) return
    if (typeof modalMode === 'string') {
      setUsers(prev => [...prev, {
        id: Date.now(),
        username: addForm.username, displayName: addForm.displayName,
        email: addForm.email, role: addForm.role, status: 'active',
      }])
    } else {
      const target = modalMode
      setUsers(prev => prev.map(u => u.id === target.id ? { ...u, ...form } : u))
    }
    setModalMode(null)
  }

  function toggleActive(u: User) {
    setUsers(prev => prev.map(x => x.id === u.id
      ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' }
      : x
    ))
  }

  function handleDelete() {
    if (!deleteTarget) return
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const isEditing = typeof modalMode === 'object' && modalMode !== null
  const editUser  = isEditing ? (modalMode as User) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p className="page-sub">Manage system access and role permissions</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={15} /> Add User
          </button>
        )}
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="Search users…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="dl-filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="viewer">Viewer</option>
        </select>
        <select className="dl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>
          {filtered.length} / {users.length} users
        </span>
      </div>

      <div className="dl-table-wrap">
        <table className="dl-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Display Name</th>
              <th>Role</th>
              <th>Status</th>
              {isAdmin && <th style={{ width: 120 }}></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="dl-empty">No users found</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} style={{ opacity: u.status === 'inactive' ? 0.6 : 1, cursor: 'default' }}>
                <td>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    {u.username}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{u.displayName}</td>
                <td>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                    fontSize: 11, fontWeight: 700,
                    background: ROLE_STYLE[u.role].bg, color: ROLE_STYLE[u.role].color,
                  }}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flex: 'none',
                      background: u.status === 'active' ? 'var(--ok)' : 'var(--ink-3)',
                    }} />
                    {u.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                </td>
                {isAdmin && (
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="tbl-icon-btn" title="Edit" onClick={() => openEdit(u)}>
                        <Pencil size={14} />
                      </button>
                      <button
                        className="tbl-icon-btn"
                        title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleActive(u)}
                      >
                        <PauseCircle size={14} />
                      </button>
                      <button
                        className="tbl-icon-btn"
                        title="Delete"
                        style={{ color: 'var(--alert)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--alert-soft)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Edit / Add Modal ─────────────────────────────── */}
      {modalMode !== null && (
        <div className="crud-overlay" onClick={() => setModalMode(null)}>
          <div className="crud-modal" onClick={e => e.stopPropagation()}>
            <div className="crud-modal-hd">
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {isEditing ? 'Edit User' : 'Add User'}
              </span>
              <button className="tbl-icon-btn" onClick={() => setModalMode(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="crud-modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                {isEditing ? (
                  <input
                    className="form-ctrl mono"
                    value={editUser!.username}
                    disabled
                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                  />
                ) : (
                  <input
                    className="form-ctrl mono"
                    value={addForm.username}
                    placeholder="e.g. op_new"
                    onChange={e => setAddForm(f => ({ ...f, username: e.target.value }))}
                  />
                )}
              </div>
              {!isEditing && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-ctrl"
                    type="password"
                    value={addForm.password}
                    placeholder="••••••••"
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  className="form-ctrl"
                  value={isEditing ? form.displayName : addForm.displayName}
                  onChange={e => isEditing
                    ? setForm(f => ({ ...f, displayName: e.target.value }))
                    : setAddForm(f => ({ ...f, displayName: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-ctrl"
                  type="email"
                  value={isEditing ? form.email : addForm.email}
                  onChange={e => isEditing
                    ? setForm(f => ({ ...f, email: e.target.value }))
                    : setAddForm(f => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-ctrl"
                  value={isEditing ? form.role : addForm.role}
                  onChange={e => isEditing
                    ? setForm(f => ({ ...f, role: e.target.value as Role }))
                    : setAddForm(f => ({ ...f, role: e.target.value as Role }))
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              {isEditing && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-ctrl"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            <div className="crud-modal-ft">
              <button className="btn-ghost" onClick={() => setModalMode(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                {isEditing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────── */}
      {deleteTarget && (
        <div className="crud-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="del-modal" onClick={e => e.stopPropagation()}>
            <div className="del-modal-body">
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--alert-soft)', color: 'var(--alert)',
                display: 'grid', placeItems: 'center',
              }}>
                <Trash2 size={24} />
              </div>
              <p className="del-modal-title">Delete Account</p>
              <p className="del-modal-desc">
                Delete <strong>{deleteTarget.username}</strong> from the system?
                This action cannot be undone.
              </p>
            </div>
            <div className="del-modal-ft">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
