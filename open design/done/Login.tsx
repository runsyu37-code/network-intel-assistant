import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, SafetyOutlined, MonitorOutlined, DatabaseOutlined, ClusterOutlined, LayoutOutlined } from '@ant-design/icons';
import './login.css';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const onFinish = (values: any) => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (values.username === 'error') {
        setError('Invalid credentials. Please check your username and password.');
      } else {
        console.log('Success:', values);
        // Redirect logic would go here
      }
    }, 1500);
  };

  if (showSkeleton) {
    return (
      <div className="login-page">
        <div className="brand-panel">
          <div className="brand-header">
             <div className="skeleton" style={{ width: '120px', height: '40px', marginBottom: '24px' }}></div>
             <div className="skeleton" style={{ width: '300px', height: '80px', marginBottom: '16px' }}></div>
             <div className="skeleton" style={{ width: '260px', height: '20px' }}></div>
          </div>
          <div className="feature-cards">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '8px' }}></div>
            ))}
          </div>
          <div className="skeleton" style={{ width: '100px', height: '20px' }}></div>
        </div>
        <div className="form-panel">
          <div className="login-card">
             <div className="skeleton" style={{ width: '180px', height: '32px', marginBottom: '8px' }}></div>
             <div className="skeleton" style={{ width: '240px', height: '20px', marginBottom: '32px' }}></div>
             <div className="skeleton" style={{ height: '40px', marginBottom: '24px' }}></div>
             <div className="skeleton" style={{ height: '40px', marginBottom: '24px' }}></div>
             <div className="skeleton" style={{ height: '44px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="brand-panel">
        <div className="brand-header">
          <div className="brand-logo-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Buono
          </div>
          <h1 className="brand-title">SSM Surveillance Smart-Monitor</h1>
          <p className="brand-desc">
            Centralized surveillance, monitoring and inventory management platform for high-security network operations.
          </p>

          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon"><MonitorOutlined /></div>
              <h3>Camera Monitoring</h3>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><DatabaseOutlined /></div>
              <h3>Device Management</h3>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><ClusterOutlined /></div>
              <h3>Rack Inventory</h3>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><LayoutOutlined /></div>
              <h3>Survey Dashboard</h3>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <span>&copy; 2026 Buono Systems</span>
          <span>&bull;</span>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
        </div>
      </div>

      <div className="form-panel">
        <div className="login-card">
          <div className="env-badge env-production">Production</div>
          
          <div className="login-card-header">
            <h1>Welcome back</h1>
            <p>Sign in to access SSM platform</p>
          </div>

          {error && (
            <div className="error-msg">
              <SafetyOutlined />
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
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: 'var(--ink-3)' }} />} 
                placeholder="admin@buono.net" 
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--ink-3)' }} />}
                placeholder="••••••••"
                iconRender={visible => (visible ? <EyeTwoTone twoToneColor="var(--accent)" /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <a className="forgot-link" href="">Forgot password?</a>
            </div>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="btn-primary" 
                loading={loading}
              >
                Sign In
              </Button>
            </Form.Item>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button className="btn-sso">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                Sign in with SSO
              </Button>
            </Space>
          </Form>

          <div className="form-footer">
            SSM v1.0 &bull; Build 2026.05.26
          </div>
        </div>

        {/* Debug Toggles */}
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', gap: '8px' }}>
           <button onClick={() => setShowSkeleton(!showSkeleton)} style={{ padding: '4px 8px', fontSize: '10px', opacity: 0.5 }}>Toggle Skeleton</button>
           <button onClick={() => setError(error ? null : 'Invalid credentials')} style={{ padding: '4px 8px', fontSize: '10px', opacity: 0.5 }}>Toggle Error</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
