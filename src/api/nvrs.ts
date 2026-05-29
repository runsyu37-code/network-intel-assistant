import client from './client'
import type { NvrApi } from './types'

export async function getNvrs(params?: { NVR_ID?: string; Site_ID?: string; Rack_ID?: string; status?: string }): Promise<NvrApi[]> {
  const res = await client.get<NvrApi[]>('/nvrs', { params })
  return res.data
}
