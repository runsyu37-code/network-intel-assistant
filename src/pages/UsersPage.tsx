import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Form, Input, Modal, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Plus, Pencil, RefreshCw } from 'lucide-react'
import { getUsers } from '../api/users'
import type { UserApi } from '../api/types'
import { useAuthStore } from '../stores/authStore'

type Role = 'admin' | 'user' | 'viewer'

const ROLE_COLOR: Record<Role, string> = {
  admin:  'var(--accent)',
  user:   'var(--ink-2)',
  viewer: 'var(--ink-4)',
}
const ROLE_BG: Record<Role, string> = {
  admin:  'color-mix(in srgb, var(--accent) 14%, transparent)',
  user:   'var(--surface-2)',
  viewer: 'var(--surface-2)',
}
const ROLE_LABEL: Record<string, string> = {
  admin:  'Admin',
  user:   'User',
  viewer: 'Viewer',
}

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

export default function UsersPage() {
  const isAdmin = useAuthStore(s => s.isAdmin())
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm()

  const { data: users = [], isLoading, isError, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  })

  const activeUsers = users.filter(u => u.is_active)

  const columns: ColumnsType<UserApi> = [
    {
      title: '', key: 'avatar', width: 52,
      render: (_: unknown, r: UserApi) => {
        const name = r.display_name || r.username
        const role = r.role as Role
        return (
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: role === 'admin' ? 'var(--accent)' : 'var(--surface-3)',
            color: role === 'admin' ? '#0b0e16' : 'var(--ink-2)',
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 12, flex: 'none', userSelect: 'none',
          }}>
            {initials(name)}
          </div>
        )
      },
    },
    {
      title: 'User', dataIndex: 'username',
      render: (_: unknown, r: UserApi) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{r.display_name || r.username}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>@{r.username}</div>
        </div>
      ),
    },
    {
      title: 'Role', dataIndex: 'role',
      render: (v: string) => {
        const role = (v as Role) in ROLE_COLOR ? (v as Role) : 'viewer'
        return (
          <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
            background: ROLE_BG[role], color: ROLE_COLOR[role],
            border: `1px solid ${ROLE_COLOR[role]}44`,
          }}>{ROLE_LABEL[v] ?? v}</span>
        )
      },
      filters: [
        { text: 'Admin',  value: 'admin'  },
        { text: 'User',   value: 'user'   },
        { text: 'Viewer', value: 'viewer' },
      ],
      onFilter: (v, r) => r.role === v,
    },
    {
      title: 'Status', dataIndex: 'is_active',
      render: (v: boolean) => (
        <span style={{ fontSize: 12, color: v ? 'var(--ok)' : 'var(--ink-4)' }}>
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Last login', dataIndex: 'last_login',
      render: (v: string | null) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--ink-3)' }}>
          {formatLastLogin(v)}
        </span>
      ),
    },
    ...(isAdmin ? [{
      title: '', key: 'action', width: 150,
      render: (_: unknown, _r: UserApi) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            background: 'none', border: '1px solid var(--accent)', borderRadius: 6,
            padding: '3px 10px', cursor: 'pointer',
          }}>
            <Pencil size={11} /> Edit
          </button>
          <button style={{
            fontSize: 12, fontWeight: 600, color: 'var(--ink-3)',
            background: 'none', border: '1px solid var(--border)', borderRadius: 6,
            padding: '3px 10px', cursor: 'pointer',
          }}>
            Deactivate
          </button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Users</h1>
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
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', width: 'auto', borderRadius: 8, color: 'var(--accent)', borderColor: 'var(--accent)', fontWeight: 600, fontSize: 13 }}
              onClick={() => setAddOpen(true)}
            >
              <Plus size={15} /> Add user
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px' }}>
        {isError && (
          <div style={{ padding: '16px 0', color: 'var(--alert)', fontSize: 13 }}>
            Failed to load users — check API connection
          </div>
        )}
        <Table
          columns={columns}
          dataSource={activeUsers}
          loading={isLoading}
          pagination={false}
          size="middle"
          rowKey="User_ID"
        />
      </div>

      <div style={{ padding: '10px 24px', fontSize: 12, color: 'var(--ink-4)', borderTop: '1px solid var(--border)', flex: 'none' }}>
        Showing {activeUsers.length} of {users.length} users
      </div>

      <Modal
        title="Add new user"
        open={addOpen}
        onOk={() => form.validateFields().then(() => { form.resetFields(); setAddOpen(false) })}
        onCancel={() => { setAddOpen(false); form.resetFields() }}
        okText="Add user"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="displayName" label="Full name" rules={[{ required: true, message: 'Enter full name' }]}>
            <Input placeholder="Firstname Lastname" />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Enter username' }]}>
            <Input placeholder="firstname.l" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter password' }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Select role' }]}>
            <Select placeholder="Select role" options={[
              { value: 'admin',  label: 'Admin — full access' },
              { value: 'user',   label: 'User — view + manage devices' },
              { value: 'viewer', label: 'Viewer — view only' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
