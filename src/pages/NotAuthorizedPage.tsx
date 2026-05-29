import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function NotAuthorizedPage() {
  const navigate = useNavigate()
  const role = useAuthStore(s => s.user?.role ?? 'viewer')

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: 16,
    }}>
      <ShieldAlert size={48} style={{ color: 'var(--alert)', opacity: 0.8 }} />
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
        Access Denied
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
        Your role (<strong>{role}</strong>) does not have permission to view this page.
      </p>
      <button
        className="btn-primary"
        style={{ marginTop: 8 }}
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
  )
}
