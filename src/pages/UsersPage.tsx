import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Form, Input, Modal, Select } from 'antd'
import { Plus, Pencil, X, Search, RefreshCw } from 'lucide-react'
import { getUsers } from '../api/users'
import type { UserApi } from '../api/types'
import { useAuthStore } from '../stores/authStore'

type Role = 'admin' | 'user' | 'viewer'

const ROLE_STYLE: Record<Role, { bg: string; color: string }> = {
  admin:  { bg: 'var(--alert-soft)',  color: 'var(--alert)'  },
  user:   { bg: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' },
  viewer: { bg: 'var(--surface-2)',   color: 'var(--ink-2)'  },
}
const ROLE_LABEL: Record<string, string> = { admin: 'Admin', user: 'Operator', viewer: 'Viewer' }

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatLastLogin(raw: string | null): string {
  if (!raw) return '—'
  const d = new Date(raw + (raw.endsWith('Z') ? '' : 'Z'))
  if (isNaN(d.getTime())) return raw
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 120)   return 'just now'
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

const AVATAR_BG: Record<Role, string> = {
  admin:  'var(--alert)',
  user:   'var(--accent)',
  viewer: 'var(--ink-3)',
}

export default function UsersPage() {
  const isAdmin = useAuthStore(s => s.isAdmin())
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm()
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: users = [], isLoading, isError, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  })

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (statusFilter === 'active' && !u.is_active) return false
    if (statusFilter === 'inactive' && u.is_active) return false
    if (q) {
      const s = q.toLowerCase()
      return [u.username, u.display_name ?? ''].some(v => v.toLowerCase().includes(s))
    }
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>User Management</h1>
          <p className="page-sub">Manage system access and role permissions</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="icon-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', width: 'auto' }}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
            disabled={isFetching}
          >
            <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          {isAdmin && (
            <button
              className="icon-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', width: 'auto', background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', borderRadius: 8, fontWeight: 600, fontSize: 13 }}
              onClick={() => setAddOpen(true)}
            >
              <Plus size={15} /> Add User
            </button>
          )}
        </div>
      </div>

      <div className="dl-toolbar">
        <div className="dl-search">
          <Search size={14} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input placeholder="Search users…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select
          className="dl-filter-select"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">Operator</option>
          <option value="viewer">Viewer</option>
        </select>
        <select
          className="dl-filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="dl-stat" style={{ marginLeft: 'auto' }}>
          {filtered.length} / {users.length} users
        </span>
      </div>

      <div className="dl-table-wrap">
        {isError && (
          <div style={{ padding: '16px 0', color: 'var(--alert)', fontSize: 13 }}>
            Failed to load users — check API connection
          </div>
        )}
        <table className="dl-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Status</th>
              {isAdmin && <th style={{ width: 72 }}></th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="dl-empty" style={{ color: 'var(--ink-3)' }}>Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="dl-empty">No users found</td></tr>
            )}
            {filtered.map(u => {
              const role = (u.role as Role) in ROLE_STYLE ? (u.role as Role) : 'viewer'
              const name = u.display_name || u.username
              return (
                <tr key={u.User_ID} style={{ opacity: u.is_active ? 1 : 0.55 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flex: 'none',
                        background: AVATAR_BG[role], color: '#fff',
                        display: 'grid', placeItems: 'center',
                        fontWeight: 700, fontSize: 12, userSelect: 'none',
                      }}>
                        {initials(name)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{u.username}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{u.display_name || '—'}</td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 9px', borderRadius: 999,
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
                      background: ROLE_STYLE[role].bg, color: ROLE_STYLE[role].color,
                    }}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--ink-4)' }}>
                      {formatLastLogin(u.last_login)}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
                      background: u.is_active ? 'var(--ok-soft)' : 'var(--surface-2)',
                      color: u.is_active ? 'var(--ok)' : 'var(--ink-3)',
                    }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="tbl-icon-btn" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="tbl-icon-btn" title="Deactivate">
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        title="Add New User"
        open={addOpen}
        onOk={() => form.validateFields().then(() => { form.resetFields(); setAddOpen(false) })}
        onCancel={() => { setAddOpen(false); form.resetFields() }}
        okText="Create User"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Enter username' }]}>
            <Input placeholder="e.g. op_new" />
          </Form.Item>
          <Form.Item name="displayName" label="Full Name" rules={[{ required: true, message: 'Enter full name' }]}>
            <Input placeholder="e.g. สมศรี ใจภักดี" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="name@company.com" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Select role' }]}>
            <Select placeholder="Select role" options={[
              { value: 'admin',  label: 'Admin — full access' },
              { value: 'user',   label: 'Operator — view + manage devices' },
              { value: 'viewer', label: 'Viewer — view only' },
            ]} />
          </Form.Item>
          <Form.Item name="password" label="Temporary Password" rules={[{ required: true, message: 'Enter password' }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
