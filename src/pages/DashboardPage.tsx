import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import TopologyPage from './TopologyPage'
import SitesPage from './SitesPage'
import BuildingDetailPage from './BuildingDetailPage'
import FloorPlanPage from './FloorPlanPage'
import RackDetailPage from './RackDetailPage'
import RacksListPage from './RacksListPage'
import CamerasPage from './CamerasPage'
import CameraDetailPage from './CameraDetailPage'
import NVRsPage from './NVRsPage'
import NVRDetailPage from './NVRDetailPage'
import SwitchesPage from './SwitchesPage'
import SwitchDetailPage from './SwitchDetailPage'
import UsersPage from './UsersPage'

export default function DashboardPage() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="topology" replace />} />
        <Route path="topology"                element={<TopologyPage />} />
        <Route path="sites/:siteId"           element={<SitesPage />} />
        <Route path="sites"                   element={<Navigate to="topology" replace />} />
        <Route path="buildings/:buildingId"   element={<BuildingDetailPage />} />
        <Route path="floors/:floorId"         element={<FloorPlanPage />} />
        <Route path="racks"                   element={<RacksListPage />} />
        <Route path="racks/:rackId"           element={<RackDetailPage />} />
        <Route path="cameras"                 element={<CamerasPage />} />
        <Route path="cameras/:cameraId"       element={<CameraDetailPage />} />
        <Route path="nvrs"                    element={<NVRsPage />} />
        <Route path="nvrs/:nvrId"             element={<NVRDetailPage />} />
        <Route path="switches"                element={<SwitchesPage />} />
        <Route path="switches/:switchId"      element={<SwitchDetailPage />} />
        <Route path="users"                   element={<UsersPage />} />
      </Route>
    </Routes>
  )
}
