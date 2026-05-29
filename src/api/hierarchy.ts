import client from './client'
import type { SiteTreeDto, DashboardSummaryDto, DeviceStatusDto, AlertLogApi, SiteApi, BuildingApi } from './types'

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

export async function getBuildings(): Promise<BuildingApi[]> {
  const res = await client.get<BuildingApi[]>('/buildings')
  return res.data
}
