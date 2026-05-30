import { Routes, Route } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { RouteGuard } from '../components/RouteGuard'
import OverviewPage from './OverviewPage'
import TopologyPage from './TopologyPage'
import SitesCrudPage from './SitesCrudPage'
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
import BuildingMapPage from './BuildingMapPage'

const ADMIN      = ['admin'] as const
const ADMIN_USER = ['admin', 'user'] as const

export default function DashboardPage() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index                        element={<OverviewPage />} />
        <Route path="topology"              element={<TopologyPage />} />
        <Route path="map"                   element={<BuildingMapPage />} />
        <Route path="sites/:siteId"         element={<SitesPage />} />
        <Route path="buildings/:buildingId" element={<BuildingDetailPage />} />
        <Route path="floors/:floorId" element={
          <RouteGuard allowed={ADMIN_USER}><FloorPlanPage /></RouteGuard>
        } />

        <Route path="sites" element={
          <RouteGuard allowed={ADMIN}><SitesCrudPage /></RouteGuard>
        } />
        <Route path="racks" element={
          <RouteGuard allowed={ADMIN_USER}><RacksListPage /></RouteGuard>
        } />
        <Route path="racks/:rackId" element={
          <RouteGuard allowed={ADMIN_USER}><RackDetailPage /></RouteGuard>
        } />
        <Route path="cameras" element={
          <RouteGuard allowed={ADMIN}><CamerasPage /></RouteGuard>
        } />
        <Route path="cameras/:cameraId" element={
          <RouteGuard allowed={ADMIN}><CameraDetailPage /></RouteGuard>
        } />
        <Route path="nvrs" element={
          <RouteGuard allowed={ADMIN}><NVRsPage /></RouteGuard>
        } />
        <Route path="nvrs/:nvrId" element={
          <RouteGuard allowed={ADMIN}><NVRDetailPage /></RouteGuard>
        } />
        <Route path="switches" element={
          <RouteGuard allowed={ADMIN}><SwitchesPage /></RouteGuard>
        } />
        <Route path="switches/:switchId" element={
          <RouteGuard allowed={ADMIN}><SwitchDetailPage /></RouteGuard>
        } />
        <Route path="users" element={
          <RouteGuard allowed={ADMIN}><UsersPage /></RouteGuard>
        } />
      </Route>
    </Routes>
  )
}
