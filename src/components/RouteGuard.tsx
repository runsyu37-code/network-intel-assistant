import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

type Role = 'admin' | 'user' | 'viewer'
type Props = { allowed: readonly Role[]; children: React.ReactNode }

export function RouteGuard({ allowed, children }: Props) {
  const role = useAuthStore(s => s.user?.role)
  if (!role || !allowed.includes(role)) return <Navigate to="/403" replace />
  return <>{children}</>
}
