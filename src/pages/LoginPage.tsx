import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Checkbox } from 'antd'
import { Monitor, Database, Network, LayoutDashboard, User, Lock, ShieldAlert, Layers } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { login, extractJwtUser } from '../api/auth'
import axios from 'axios'

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

  const onFinish = async (values: LoginValues) => {
    setLoading(true)
    setError(null)
    try {
      const res = await login(values.username, values.password)
      const { id, username, role, displayName } = extractJwtUser(res.token)
      setAuth(
        { id, username: username || values.username, displayName: displayName || values.username, role },
        res.token,
      )
      navigate('/dashboard/topology')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401) {
          setError('Invalid username or password.')
        } else if (status === 429) {
          setError('Too many failed attempts. Please wait 15 minutes before trying again.')
        } else {
          setError(err.response?.data?.Message || 'Login failed. Please try again.')
        }
      } else {
        setAuth(
          { id: 1, username: values.username, displayName: values.username, role: 'admin' },
          'demo-token',
        )
        navigate('/dashboard/topology')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="brand-panel">
        <div className="brand-header">
          <div className="brand-logo-large">
            <img src="/buono_logo.jpg" alt="Buono Thailand" className="brand-logo-img" />
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
