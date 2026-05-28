import client from './client'
import type { NvrApi } from './types'

export async function getNvrs(params?: { Site_ID?: string; Rack_ID?: string; status?: string }): Promise<NvrApi[]> {
  const res = await client.get<NvrApi[]>('/nvrs', { params })
  return res.data
}

export async function createNvr(body: {
  NVR_ID: string
  device_name: string
  ip_internet?: string
  ip_cctv?: string
  model?: string
  total_channels?: number
  hdd_total_tb?: number
  retention_days?: number
  Site_ID: string
  Rack_ID?: string
}): Promise<void> {
  await client.post('/nvrs', [body])
}

export async function updateNvr(id: string, body: {
  device_name?: string
  ip_internet?: string
  ip_cctv?: string
  model?: string
  total_channels?: number
  retention_days?: number
}): Promise<void> {
  await client.post(`/nvrs/${id}`, body)
}

export async function deleteNvr(id: string): Promise<void> {
  await client.post(`/nvrs/delete/${id}`)
}
