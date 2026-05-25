import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import TopologyPage from './TopologyPage'
import SitesPage from './SitesPage'

const Placeholder = ({ title }: { title: string }) => (
  <div style={{ padding: '22px 24px', color: 'var(--ink-3)' }}>{title} — coming soon</div>
)

export default function DashboardPage() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="topology" replace />} />
        <Route path="topology" element={<TopologyPage />} />
        <Route path="sites"    element={<SitesPage />} />
        <Route path="cameras"  element={<Placeholder title="Cameras" />} />
        <Route path="nvrs"     element={<Placeholder title="NVRs" />} />
        <Route path="switches" element={<Placeholder title="PoE Switches" />} />
        <Route path="racks"    element={<Placeholder title="Racks" />} />
        <Route path="users"    element={<Placeholder title="Users" />} />
      </Route>
    </Routes>
  )
}
