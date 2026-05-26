import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Checkbox } from 'antd'
import { Monitor, Database, Network, LayoutDashboard, User, Lock, ShieldAlert, Layers } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

interface LoginValues {
  username: string
  password: string
  remember: boolean
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFinish = (values: LoginValues) => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setLoading(false)
      setAuth({ id: 1, username: values.username, role: 'admin' }, 'mock-token')
      navigate('/dashboard/topology')
    }, 800)
  }

  return (
    <div className="login-page">
      <div className="brand-panel">
        <div className="brand-header">
          <div className="brand-logo-large">
            <Layers size={36} strokeWidth={2.5} />
            Buono
          </div>
          <h1 className="brand-title">SSM Surveillance Smart-Monitor</h1>
          <p className="brand-desc">
            Centralized surveillance, monitoring and inventory management platform for high-security network operations.
          </p>

          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon"><Monitor size={18} /></div>
              <h3>Camera Monitoring</h3>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Database size={18} /></div>
              <h3>Device Management</h3>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Network size={18} /></div>
              <h3>Rack Inventory</h3>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><LayoutDashboard size={18} /></div>
              <h3>Survey Dashboard</h3>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <span>&copy; 2026 Buono Systems</span>
          <span>&bull;</span>
          <a href="#">Privacy Policy</a>
        </div>
      </div>

      <div className="form-panel">
        <div className="login-card">
          <div className="env-badge">Production</div>

          <div className="login-card-header">
            <h1>Welcome back</h1>
            <p>Sign in to access SSM platform</p>
          </div>

          {error && (
            <div className="login-error">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          <Form
            name="login"
            layout="vertical"
            className="login-form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            disabled={loading}
          >
            <Form.Item
              label="Email / Username"
              name="username"
              rules={[{ required: true, message: 'กรุณากรอก username' }]}
            >
              <Input
                prefix={<User size={14} color="var(--ink-3)" />}
                placeholder="admin@buono.net"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'กรุณากรอก password' }]}
            >
              <Input.Password
                prefix={<Lock size={14} color="var(--ink-3)" />}
                placeholder="••••••••"
              />
            </Form.Item>

            <div className="login-remember-row">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <a className="forgot-link" href="#">Forgot password?</a>
            </div>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                className="btn-login"
                loading={loading}
              >
                Sign In
              </Button>
            </Form.Item>

            <Button className="btn-sso" disabled={loading}>
              <Layers size={16} />
              Sign in with SSO
            </Button>
          </Form>

          <div className="form-footer">
            SSM v1.0 &bull; Build 2026.05.26
          </div>
        </div>
      </div>
    </div>
  )
}
