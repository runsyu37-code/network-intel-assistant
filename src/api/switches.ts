import client from './client'
import type { PoeSwitchApi } from './types'

export async function getSwitches(params?: { SW_ID?: string; Site_ID?: string; Rack_ID?: string; status?: string }): Promise<PoeSwitchApi[]> {
  const res = await client.get<PoeSwitchApi[]>('/poe-switches', { params })
  return res.data
}
