import client from './client'
import type { RackApi, RackDetailApi } from './types'

export async function getRacks(siteId?: string): Promise<RackApi[]> {
  const params = siteId ? { Site_ID: siteId } : undefined
  const res = await client.get<RackApi[]>('/racks', { params })
  return res.data
}

export async function getRackById(rackId: string): Promise<RackDetailApi> {
  const res = await client.get<RackDetailApi>(`/racks/${rackId}`)
  return res.data
}
