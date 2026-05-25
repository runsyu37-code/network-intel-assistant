import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography } from 'antd'
import { useAuthStore } from '../stores/authStore'

const { Title } = Typography

interface LoginValues {
  username: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const onFinish = (values: LoginValues) => {
    setAuth({ id: 1, username: values.username, role: 'admin' }, 'mock-token')
    navigate('/dashboard/topology')
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <Card style={{ width: 360 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>SSM Login</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: 'กรุณากรอก username' }]}>
            <Input autoFocus placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'กรุณากรอก password' }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
