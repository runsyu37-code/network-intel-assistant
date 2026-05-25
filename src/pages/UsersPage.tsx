import { useState } from 'react'
import { Form, Input, Modal, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Plus, Trash2 } from 'lucide-react'

type Role = 'admin' | 'user' | 'guest'

interface User {
  key: string; id: number; username: string; displayName: string
  role: Role; email: string; lastLogin: string; sites: string[]
}

const ROLE_COLOR: Record<Role, string> = {
  admin: 'var(--alert)',
  user:  'var(--accent)',
  guest: 'var(--ink-3)',
}

const USERS_INIT: User[] = [
  { key:'1', id:1, username:'anan.d',    displayName:'Anan Doungchan',  role:'admin', email:'anan.d@ssm.co.th',    lastLogin:'just now',  sites:['All'] },
  { key:'2', id:2, username:'ran.s',     displayName:'Ran Suphaphon',   role:'admin', email:'ran.s@ssm.co.th',     lastLogin:'2h ago',    sites:['All'] },
  { key:'3', id:3, username:'niran.k',   displayName:'Niran Khampa',    role:'user',  email:'niran.k@ssm.co.th',   lastLogin:'1d ago',    sites:['HQ Bangkok'] },
  { key:'4', id:4, username:'pimchan.w', displayName:'Pimchan Wannas',  role:'user',  email:'pimchan.w@ssm.co.th', lastLogin:'3d ago',    sites:['HQ Bangkok', 'Chiang Mai DC'] },
  { key:'5', id:5, username:'somchai.t', displayName:'Somchai Thonburi',role:'guest', email:'somchai.t@ssm.co.th', lastLogin:'7d ago',    sites:['Phuket Branch'] },
]

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>(USERS_INIT)
  const [addOpen, setAddOpen]   = useState(false)
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

  const handleDelete = (key: string) =>
    setUsers(u => u.filter(x => x.key !== key))

  const columns: ColumnsType<User> = [
    {
      title: 'User', dataIndex: 'username',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{r.displayName}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>@{r.username}</div>
        </div>
      ),
    },
    {
      title: 'Email', dataIndex: 'email',
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--ink-2)' }}>{v}</span>,
    },
    {
      title: 'Role', dataIndex: 'role',
      render: (v: Role) => (
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: 999,
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em',
          background: `${ROLE_COLOR[v]}22`, color: ROLE_COLOR[v],
          border: `1px solid ${ROLE_COLOR[v]}44`,
        }}>{v}</span>
      ),
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User',  value: 'user'  },
        { text: 'Guest', value: 'guest' },
      ],
      onFilter: (v, r) => r.role === v,
    },
    {
      title: 'Sites', dataIndex: 'sites',
      render: (v: string[]) => (
        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{v.join(', ')}</span>
      ),
    },
    {
      title: 'Last login', dataIndex: 'lastLogin',
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--ink-3)' }}>{v}</span>,
    },
    {
      title: '', key: 'action', width: 40,
      render: (_, r) => (
        <button
          onClick={e => { e.stopPropagation(); handleDelete(r.key) }}
          style={{ color: 'var(--ink-3)', cursor: 'pointer', background: 'none', border: 'none', display: 'grid', placeItems: 'center' }}
          title="Remove user"
        >
          <Trash2 size={14} />
        </button>
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

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 24px' }}>
        <Table
          columns={columns}
          dataSource={users}
          pagination={false}
          size="middle"
          rowKey="key"
        />
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
              { value: 'admin', label: 'Admin — full access' },
              { value: 'user',  label: 'User — view + edit assigned sites' },
              { value: 'guest', label: 'Guest — view only' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
