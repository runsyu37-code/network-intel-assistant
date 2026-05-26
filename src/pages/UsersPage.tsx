import { useState } from 'react'
import { Form, Input, Modal, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Plus, Pencil } from 'lucide-react'

type Role = 'admin' | 'operator' | 'viewer'

interface User {
  key: string; id: number; username: string; displayName: string
  role: Role; email: string; lastLogin: string; sites: string[]
}

const ROLE_COLOR: Record<Role, string> = {
  admin:    'var(--accent)',
  operator: 'var(--ink-2)',
  viewer:   'var(--ink-4)',
}
const ROLE_BG: Record<Role, string> = {
  admin:    'color-mix(in srgb, var(--accent) 14%, transparent)',
  operator: 'var(--surface-2)',
  viewer:   'var(--surface-2)',
}

const USERS_INIT: User[] = [
  { key:'1', id:1, username:'anan.d',    displayName:'Anan Doungchan',   role:'admin',    email:'anan.d@ssm.co.th',    lastLogin:'just now', sites:['All'] },
  { key:'2', id:2, username:'ran.s',     displayName:'Ran Suphaphon',    role:'admin',    email:'ran.s@ssm.co.th',     lastLogin:'2h ago',   sites:['All'] },
  { key:'3', id:3, username:'niran.k',   displayName:'Niran Khampa',     role:'operator', email:'niran.k@ssm.co.th',   lastLogin:'1d ago',   sites:['HQ Bangkok'] },
  { key:'4', id:4, username:'pimchan.w', displayName:'Pimchan Wannas',   role:'operator', email:'pimchan.w@ssm.co.th', lastLogin:'3d ago',   sites:['HQ Bangkok', 'Chiang Mai DC'] },
  { key:'5', id:5, username:'somchai.t', displayName:'Somchai Thonburi', role:'viewer',   email:'somchai.t@ssm.co.th', lastLogin:'7d ago',   sites:['Phuket Branch'] },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>(USERS_INIT)
  const [totalCount]          = useState(USERS_INIT.length)
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm()

  const handleAdd = () => {
    form.validateFields().then(vals => {
      const nu: User = {
        key: String(Date.now()), id: users.length + 1,
        username: vals.username, displayName: vals.displayName,
        role: vals.role, email: vals.email,
        lastLogin: '—', sites: ['All'],
      }
      setUsers(u => [...u, nu])
      form.resetFields()
      setAddOpen(false)
    })
  }

  const handleDeactivate = (key: string) =>
    setUsers(u => u.filter(x => x.key !== key))

  const columns: ColumnsType<User> = [
    {
      title: '', key: 'avatar', width: 52,
      render: (_: unknown, r: User) => (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: r.role === 'admin' ? 'var(--accent)' : 'var(--surface-3)',
          color: r.role === 'admin' ? '#0b0e16' : 'var(--ink-2)',
          display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 12, flex: 'none', userSelect: 'none',
        }}>
          {initials(r.displayName)}
        </div>
      ),
    },
    {
      title: 'User', dataIndex: 'username',
      render: (_: unknown, r: User) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{r.displayName}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>@{r.username}</div>
        </div>
      ),
    },
    {
      title: 'Email', dataIndex: 'email',
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--ink-2)' }}>{v}</span>,
    },
    {
      title: 'Role', dataIndex: 'role',
      render: (v: Role) => (
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: 999,
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
          background: ROLE_BG[v], color: ROLE_COLOR[v],
          border: `1px solid ${ROLE_COLOR[v]}44`,
        }}>{v}</span>
      ),
      filters: [
        { text: 'Admin',    value: 'admin'    },
        { text: 'Operator', value: 'operator' },
        { text: 'Viewer',   value: 'viewer'   },
      ],
      onFilter: (v, r) => r.role === v,
    },
    {
      title: 'Sites', dataIndex: 'sites',
      render: (v: string[]) => <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{v.join(', ')}</span>,
    },
    {
      title: 'Last login', dataIndex: 'lastLogin',
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--ink-3)' }}>{v}</span>,
    },
    {
      title: '', key: 'action', width: 150,
      render: (_: unknown, r: User) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            background: 'none', border: '1px solid var(--accent)', borderRadius: 6,
            padding: '3px 10px', cursor: 'pointer',
          }}>
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleDeactivate(r.key) }}
            style={{
              fontSize: 12, fontWeight: 600, color: 'var(--ink-3)',
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              padding: '3px 10px', cursor: 'pointer',
            }}
          >
            Deactivate
          </button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p className="page-sub">Manage system access and role permissions</p>
        </div>
        <button
          className="icon-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', width: 'auto', borderRadius: 8, color: 'var(--accent)', borderColor: 'var(--accent)', fontWeight: 600, fontSize: 13 }}
          onClick={() => setAddOpen(true)}
        >
          <Plus size={15} /> Add user
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px' }}>
        <Table
          columns={columns}
          dataSource={users}
          pagination={false}
          size="middle"
          rowKey="key"
        />
      </div>

      <div style={{ padding: '10px 24px', fontSize: 12, color: 'var(--ink-4)', borderTop: '1px solid var(--border)', flex: 'none' }}>
        Showing {users.length} of {totalCount} users
      </div>

      <Modal
        title="Add new user"
        open={addOpen}
        onOk={handleAdd}
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
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter valid email' }]}>
            <Input placeholder="user@ssm.co.th" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Select role' }]}>
            <Select placeholder="Select role" options={[
              { value: 'admin',    label: 'Admin — full access' },
              { value: 'operator', label: 'Operator — view + manage assigned sites' },
              { value: 'viewer',   label: 'Viewer — view only' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
