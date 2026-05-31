import client from './client'
import type { SiteTreeDto, DashboardSummaryDto, DeviceStatusDto, AlertLogApi, SiteApi, BuildingApi, FloorApi, RackApi } from './types'

export async function getHierarchyTree(): Promise<SiteTreeDto[]> {
  const res = await client.get<SiteTreeDto[]>('/hierarchy/tree')
  return res.data
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto[]> {
  const res = await client.get<DashboardSummaryDto[]>('/dashboard/summary')
  return res.data
}

export async function getDeviceStatus(): Promise<DeviceStatusDto[]> {
  const res = await client.get<DeviceStatusDto[]>('/status/devices')
  return res.data
}

export async function getAlertLogs(params?: { limit?: number }): Promise<AlertLogApi[]> {
  const res = await client.get<AlertLogApi[]>('/alert-logs', { params })
  return res.data
}

export async function getSites(): Promise<SiteApi[]> {
  const res = await client.get<SiteApi[]>('/sites')
  return res.data
}

export async function getBuildings(params?: { Site_ID?: string; Building_ID?: string }): Promise<BuildingApi[]> {
  const res = await client.get<BuildingApi[]>('/buildings', { params })
  return res.data
}

export async function getFloors(params?: { Building_ID?: string; Site_ID?: string }): Promise<FloorApi[]> {
  const res = await client.get<FloorApi[]>('/floors', { params })
  return res.data
}

export async function getRacks(params?: { Site_ID?: string; Building_ID?: string; Floor_ID?: string }): Promise<RackApi[]> {
  const res = await client.get<RackApi[]>('/racks', { params })
  return res.data
}

export async function getRackById(id: string): Promise<RackApi | null> {
  const res = await client.get<RackApi[]>('/racks', { params: { Rack_ID: id } })
  return res.data[0] ?? null
}

export async function getBuildingById(id: string): Promise<BuildingApi> {
  const res = await client.get<BuildingApi>(`/buildings/${id}`)
  return res.data
}

export async function getFloorById(id: string): Promise<FloorApi> {
  const res = await client.get<FloorApi>(`/floors/${id}`)
  return res.data
}

export async function patchSitePosition(siteId: string, x: number, y: number): Promise<void> {
  await client.patch(`/sites/${siteId}/position`, { x, y })
}

export async function patchBuildingCoordinates(buildingId: string, lat: number, lng: number): Promise<void> {
  await client.patch(`/buildings/${buildingId}/coordinates`, { lat, lng })
}
